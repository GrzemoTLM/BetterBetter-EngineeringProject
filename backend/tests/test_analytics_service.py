import pytest
from decimal import Decimal, ROUND_HALF_UP
from unittest.mock import Mock, patch, MagicMock

from coupon_analytics.services.analytics_service import (
    CouponAnalyticsResult,
    _percent,
    AnalyticsService,
)

class TestCouponAnalyticsResult:
    
    def test_basic_creation(self):
        result = CouponAnalyticsResult(
            total_coupons=100,
            finished_coupons=90,
            in_progress_coupons=10,
            won_coupons=50,
            lost_coupons=40,
            canceled_coupons=0,
            total_stake=Decimal('1000'),
            realized_profit=Decimal('200'),
            roi=Decimal('0.2'),
            yield_=Decimal('20'),
            win_rate=Decimal('0.5556'),
            avg_stake=Decimal('10'),
            avg_multiplier=Decimal('2.5'),
        )
        
        assert result.total_coupons == 100
        assert result.won_coupons == 50
        assert result.realized_profit == Decimal('200')
    
    def test_to_representation_formats_decimals(self):
        result = CouponAnalyticsResult(
            total_coupons=10,
            finished_coupons=8,
            in_progress_coupons=2,
            won_coupons=5,
            lost_coupons=3,
            canceled_coupons=0,
            total_stake=Decimal('500.555'),
            realized_profit=Decimal('100.123'),
            roi=Decimal('0.2005'),
            yield_=Decimal('20.05'),
            win_rate=Decimal('0.6250'),
            avg_stake=Decimal('50.00'),
            avg_multiplier=Decimal('1.85'),
        )
        
        rep = result.to_representation()
        
        assert 'yield' in rep
        assert 'yield_' not in rep
        assert isinstance(rep['total_stake'], str)
        assert isinstance(rep['roi'], str)
    
    def test_to_representation_handles_none(self):
        result = CouponAnalyticsResult(
            total_coupons=0,
            finished_coupons=0,
            in_progress_coupons=0,
            won_coupons=0,
            lost_coupons=0,
            canceled_coupons=0,
            total_stake=Decimal('0'),
            realized_profit=Decimal('0'),
            roi=None,
            yield_=None,
            win_rate=None,
            avg_stake=None,
            avg_multiplier=None,
        )
        
        rep = result.to_representation()
        
        assert rep['roi'] is None
        assert rep['yield'] is None
        assert rep['win_rate'] is None


class TestPercentFunction:
    
    def test_basic_calculation(self):
        result = _percent(Decimal('1'), Decimal('2'))
        assert result == Decimal('0.5000')
    
    def test_with_zero_denominator(self):
        result = _percent(Decimal('10'), Decimal('0'))
        assert result is None
    
    def test_with_none_denominator(self):
        result = _percent(Decimal('10'), None)
        assert result is None
    
    def test_rounding(self):
        result = _percent(Decimal('1'), Decimal('3'))
        assert result == Decimal('0.3333')
    
    def test_whole_number_result(self):
        result = _percent(Decimal('10'), Decimal('10'))
        assert result == Decimal('1.0000')


class TestAnalyticsService:
    
    @pytest.fixture
    def analytics_service(self):
        return AnalyticsService()
    
    def test_summary_from_empty_queryset(self, analytics_service):
        mock_qs = MagicMock()
        mock_qs.count.return_value = 0
        mock_qs.filter.return_value = mock_qs
        mock_qs.aggregate.return_value = {
            'total_stake': None, 
            'realized_profit': None,
            'avg_stake': None,
            'avg_multiplier': None,
        }
        
        result = analytics_service._summary_from_queryset(mock_qs)
        
        assert result.total_coupons == 0
        assert result.total_stake == Decimal('0.00')
        assert result.roi is None
    
    def test_summary_calculates_win_rate(self, analytics_service):
        mock_qs = MagicMock()
        mock_qs.count.return_value = 10
        
        def filter_side_effect(*args, **kwargs):
            filtered_qs = MagicMock()
            if 'status' in str(kwargs) or args:
                if hasattr(args[0], 'children') if args else False:
                    filtered_qs.count.return_value = 8
                else:
                    filtered_qs.count.return_value = 5
                filtered_qs.aggregate.return_value = {
                    'total_stake': Decimal('100'),
                    'realized_profit': Decimal('50'),
                }
            else:
                filtered_qs.count.return_value = 0
            filtered_qs.filter.return_value = filtered_qs
            return filtered_qs
        
        mock_qs.filter.side_effect = filter_side_effect
        mock_qs.aggregate.return_value = {
            'avg_stake': Decimal('10'),
            'avg_multiplier': Decimal('2.0'),
        }
        
        result = analytics_service._summary_from_queryset(mock_qs)
        
        assert result.total_coupons == 10


class TestAnalyticsResultEdgeCases:
    
    def test_all_coupons_won(self):
        result = CouponAnalyticsResult(
            total_coupons=10,
            finished_coupons=10,
            in_progress_coupons=0,
            won_coupons=10,
            lost_coupons=0,
            canceled_coupons=0,
            total_stake=Decimal('100'),
            realized_profit=Decimal('200'),
            roi=Decimal('2.0'),
            yield_=Decimal('200'),
            win_rate=Decimal('1.0000'),
            avg_stake=Decimal('10'),
            avg_multiplier=Decimal('3.0'),
        )
        
        assert result.win_rate == Decimal('1.0000')
        assert result.roi == Decimal('2.0')
    
    def test_all_coupons_lost(self):
        result = CouponAnalyticsResult(
            total_coupons=10,
            finished_coupons=10,
            in_progress_coupons=0,
            won_coupons=0,
            lost_coupons=10,
            canceled_coupons=0,
            total_stake=Decimal('100'),
            realized_profit=Decimal('-100'),
            roi=Decimal('-1.0'),
            yield_=Decimal('-100'),
            win_rate=Decimal('0.0000'),
            avg_stake=Decimal('10'),
            avg_multiplier=Decimal('2.0'),
        )
        
        assert result.win_rate == Decimal('0.0000')
        assert result.realized_profit == Decimal('-100')
    
    def test_large_numbers(self):
        result = CouponAnalyticsResult(
            total_coupons=1000000,
            finished_coupons=900000,
            in_progress_coupons=100000,
            won_coupons=500000,
            lost_coupons=400000,
            canceled_coupons=0,
            total_stake=Decimal('10000000.00'),
            realized_profit=Decimal('2000000.00'),
            roi=Decimal('0.2'),
            yield_=Decimal('20'),
            win_rate=Decimal('0.5556'),
            avg_stake=Decimal('10.00'),
            avg_multiplier=Decimal('2.0'),
        )
        
        rep = result.to_representation()
        assert rep['total_coupons'] == 1000000
