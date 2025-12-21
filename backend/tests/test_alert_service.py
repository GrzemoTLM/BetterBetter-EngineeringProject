import pytest
from decimal import Decimal
from datetime import datetime, time, timedelta
from unittest.mock import Mock, patch, MagicMock

from coupon_analytics.services.alert_service import (
    _dec_or_none,
    _COMPARATORS,
    _render_message,
    _get_calendar_period,
)


class TestDecOrNone:
    
    def test_with_integer(self):
        result = _dec_or_none(100)
        assert result == Decimal('100')
    
    def test_with_float(self):
        result = _dec_or_none(50.75)
        assert result == Decimal('50.75')
    
    def test_with_string(self):
        result = _dec_or_none("123.45")
        assert result == Decimal('123.45')
    
    def test_with_none(self):
        result = _dec_or_none(None)
        assert result is None
    
    def test_with_invalid_string(self):
        result = _dec_or_none("invalid")
        assert result is None
    
    def test_with_decimal(self):
        result = _dec_or_none(Decimal('99.99'))
        assert result == Decimal('99.99')


class TestComparators:
    
    def test_lt_true(self):
        assert _COMPARATORS['lt'](5, 10) is True
    
    def test_lt_false(self):
        assert _COMPARATORS['lt'](10, 5) is False
    
    def test_lt_equal(self):
        assert _COMPARATORS['lt'](5, 5) is False
    
    def test_lt_with_none(self):
        assert _COMPARATORS['lt'](None, 5) is False
        assert _COMPARATORS['lt'](5, None) is False
    
    def test_lte_true(self):
        assert _COMPARATORS['lte'](5, 10) is True
        assert _COMPARATORS['lte'](5, 5) is True
    
    def test_lte_false(self):
        assert _COMPARATORS['lte'](10, 5) is False
    
    def test_gt_true(self):
        assert _COMPARATORS['gt'](10, 5) is True
    
    def test_gt_false(self):
        assert _COMPARATORS['gt'](5, 10) is False
    
    def test_gte_true(self):
        assert _COMPARATORS['gte'](10, 5) is True
        assert _COMPARATORS['gte'](5, 5) is True
    
    def test_gte_false(self):
        assert _COMPARATORS['gte'](5, 10) is False
    
    def test_eq_true(self):
        assert _COMPARATORS['eq'](5, 5) is True
    
    def test_eq_false(self):
        assert _COMPARATORS['eq'](5, 10) is False
    
    def test_eq_with_none(self):
        assert _COMPARATORS['eq'](None, None) is False


class TestRenderMessage:
    
    def test_basic_message_substitution(self):
        mock_rule = Mock()
        mock_rule.message = "The value of {metric} is {value}, threshold: {threshold}"
        mock_rule.metric = "ROI"
        mock_rule.comparator = "gt"
        mock_rule.threshold_value = Decimal('10')
        
        start = datetime(2024, 1, 1)
        end = datetime(2024, 1, 31)
        
        result = _render_message(
            mock_rule, 
            metric_value=Decimal('15'), 
            start=start, 
            end=end
        )
        
        assert "ROI" in result
        assert "15" in result
        assert "10" in result
    
    def test_date_substitution(self):
        mock_rule = Mock()
        mock_rule.message = "Period from {start} to {end}"
        mock_rule.metric = "yield"
        mock_rule.comparator = "lt"
        mock_rule.threshold_value = Decimal('5')
        
        start = datetime(2024, 3, 15)
        end = datetime(2024, 3, 20)
        
        result = _render_message(mock_rule, metric_value=Decimal('3'), start=start, end=end)
        
        assert "2024-03-15" in result
        assert "2024-03-20" in result
    
    def test_none_metric_value(self):
        mock_rule = Mock()
        mock_rule.message = "Value: {value}"
        mock_rule.metric = "loss"
        mock_rule.comparator = "gt"
        mock_rule.threshold_value = Decimal('100')
        
        result = _render_message(
            mock_rule, 
            metric_value=None, 
            start=datetime(2024, 1, 1), 
            end=datetime(2024, 1, 31)
        )
        
        assert "None" in result
    
    def test_empty_message_generates_default(self):
        mock_rule = Mock()
        mock_rule.message = ""
        mock_rule.metric = "ROI"
        mock_rule.comparator = "gt"
        mock_rule.threshold_value = Decimal('10')
        
        result = _render_message(
            mock_rule, 
            metric_value=Decimal('15'), 
            start=datetime(2024, 1, 1), 
            end=datetime(2024, 1, 31)
        )
        
        assert "Alert" in result
        assert "ROI" in result
        assert "gt" in result


class TestGetCalendarPeriod:
    
    def test_single_day_period(self):
        now = datetime(2024, 6, 15, 12, 30, 0)
        start_dt, end_dt = _get_calendar_period(now, 1)
        
        assert start_dt.date() == now.date()
        assert end_dt.date() == now.date()
        assert start_dt.time() == time.min
        assert end_dt.time() == time.max
    
    def test_seven_day_period(self):
        now = datetime(2024, 6, 15, 12, 30, 0)
        start_dt, end_dt = _get_calendar_period(now, 7)
        
        assert start_dt.date() == datetime(2024, 6, 9).date()
        assert end_dt.date() == now.date()
    
    def test_thirty_day_period(self):
        now = datetime(2024, 6, 30, 23, 59, 0)
        start_dt, end_dt = _get_calendar_period(now, 30)
        
        expected_start = datetime(2024, 6, 1).date()
        assert start_dt.date() == expected_start
        assert end_dt.date() == now.date()
