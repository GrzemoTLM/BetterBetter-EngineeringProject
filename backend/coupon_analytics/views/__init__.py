from .analytics_views import CouponAnalyticsSummaryView, CouponAnalyticsQuerySummaryView
from .alert_views import (
    AlertRuleListCreateView,
    AlertRuleDetailView,
    AlertRuleEvaluateView,
    AlertEventListView,
)
from .strategy_views import (
    UserStrategyListCreateView,
    UserStrategyDetailView,
    UserStrategySummaryView,
    UserStrategiesSummaryView,
)
from .report_views import (
    ReportListCreateView,
    ReportDetailView,
    ReportToggleActiveView,
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
    'ReportListCreateView',
    'ReportDetailView',
    'ReportToggleActiveView',
]

