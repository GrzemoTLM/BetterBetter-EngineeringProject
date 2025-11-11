from typing import Any, List
from django.db.models import Q, QuerySet
from coupons.models import Coupon
from coupon_analytics.models.queries import (
    AnalyticsQuery,
    AnalyticsQueryGroup,
    AnalyticsQueryCondition,
)


class AnalyticsQueryBuilder:

    OPERATOR_LOOKUP = {
        "equals": "exact",
        "not_equals": "exact",
        "contains": "icontains",
        "not_contains": "icontains",
        "gt": "gt",
        "gte": "gte",
        "lt": "lt",
        "lte": "lte",
        "in": "in",
        "not_in": "in",
    }

    COUPON_TYPE_MAPPING = {
        "1": "home_win",
        "2": "away_win",
        "x": "draw",
        "1x": ["home_win", "draw"],
        "x2": ["draw", "away_win"],
    }

    def __init__(self, analytics_query: AnalyticsQuery):
        self.query = analytics_query

    def normalize_field(self, field: str) -> str:
        return field.replace(".", "__")

    def normalize_coupon_type(self, value: Any) -> Any:
        if isinstance(value, list):
            normalized_values = []
            for item in value:
                mapped = self.COUPON_TYPE_MAPPING.get(str(item), item)
                if isinstance(mapped, list):
                    normalized_values.extend(mapped)
                else:
                    normalized_values.append(mapped)
            return list(set(normalized_values))
        return self.COUPON_TYPE_MAPPING.get(str(value), value)

    def build_condition_q(self, condition: AnalyticsQueryCondition) -> Q:
        field = self.normalize_field(condition.field)
        operator_name = condition.operator
        lookup = self.OPERATOR_LOOKUP.get(operator_name, "exact")
        values = condition.value if isinstance(condition.value, list) else [condition.value]

        if "coupon_type" in field:
            values = [self.normalize_coupon_type(v) for v in values]
            values = [
                item for v in values for item in (v if isinstance(v, list) else [v])
            ]

        if lookup == "in":
            key = f"{field}__in"
            query_object = Q(**{key: values})
            if operator_name == "not_in":
                query_object = ~query_object
        else:
            value = values[0] if values else None
            key = f"{field}__{lookup}"
            query_object = Q(**{key: value})
            if operator_name == "not_equals":
                query_object = ~query_object
            elif operator_name == "not_contains":
                query_object = ~query_object

        if condition.negate:
            query_object = ~query_object

        return query_object

    def build_group_q(self, query_group: AnalyticsQueryGroup) -> Q:
        operator = query_group.operator.upper()  # "AND" lub "OR"
        parts: List[Q] = []

        for condition in query_group.conditions.all().order_by("order"):
            parts.append(self.build_condition_q(condition))

        for subgroup in query_group.subgroups.all().order_by("order"):
            parts.append(self.build_group_q(subgroup))

        if not parts:
            return Q()

        combined = parts[0]
        for grouped_query in parts[1:]:
            if operator == "AND":
                combined &= grouped_query
            else:
                combined |= grouped_query

        return combined

    def build_query_q(self) -> Q:
        root_groups = self.query.query_groups.filter(parent__isnull=True).order_by(
            "order"
        )

        if not root_groups.exists():
            return Q()

        total_query = Q()
        for idx, root_group in enumerate(root_groups):
            group_query = self.build_group_q(root_group)
            if idx == 0:
                total_query = group_query
            else:
                total_query &= group_query

        return total_query

    def apply(self) -> QuerySet:
        query_object = self.build_query_q()
        queryset = Coupon.objects.filter(query_object).distinct()

        if self.query.start_date:
            queryset = queryset.filter(created_at__date__gte=self.query.start_date)
        if self.query.end_date:
            queryset = queryset.filter(created_at__date__lte=self.query.end_date)
        if self.query.bookmaker_id:
            queryset = queryset.filter(bookmaker_account__bookmaker_id=self.query.bookmaker_id)
        if self.query.statuses:
            queryset = queryset.filter(status__in=self.query.statuses)
        if self.query.coupon_type:
            normalized_type = self.normalize_coupon_type(self.query.coupon_type)
            if isinstance(normalized_type, list):
                queryset = queryset.filter(coupon_type__in=normalized_type)
            else:
                queryset = queryset.filter(coupon_type=normalized_type)

        if self.query.sort_by:
            queryset = queryset.order_by(*self.query.sort_by)

        return queryset

