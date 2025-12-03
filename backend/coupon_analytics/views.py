from coupon_analytics.views.analytics_views import (
    CouponAnalyticsSummaryView,
    CouponAnalyticsQuerySummaryView,
)
from coupon_analytics.views.alert_views import (
    AlertRuleListCreateView,
    AlertRuleDetailView,
    AlertRuleEvaluateView,
    AlertEventListView,
)
from coupon_analytics.views.strategy_views import (
    UserStrategyListCreateView,
    UserStrategyDetailView,
    UserStrategySummaryView,
    UserStrategiesSummaryView,
)

__all__ = [
    'CouponAnalyticsSummaryView',
    'CouponAnalyticsQuerySummaryView',
    'AlertRuleListCreateView',
    'AlertRuleDetailView',
    'AlertRuleEvaluateView',
    'AlertEventListView',
    'UserStrategyListCreateView',
    'UserStrategyDetailView',
    'UserStrategySummaryView',
    'UserStrategiesSummaryView',
]
