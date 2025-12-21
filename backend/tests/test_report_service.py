import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

from coupon_analytics.services.report_service import (
    should_send_report,
    calculate_next_run,
    format_report_message,
)


class TestShouldSendReport:
    
    def test_should_send_when_next_run_passed(self):
        mock_report = Mock()
        mock_report.next_run = datetime(2020, 1, 1, 10, 0, 0)
        
        with patch('coupon_analytics.services.report_service.timezone') as mock_tz:
            mock_tz.now.return_value = datetime(2024, 1, 1, 12, 0, 0)
            result = should_send_report(mock_report)
        
        assert result is True
    
    def test_should_not_send_when_next_run_future(self):
        mock_report = Mock()
        mock_report.next_run = datetime(2030, 1, 1, 10, 0, 0)
        
        with patch('coupon_analytics.services.report_service.timezone') as mock_tz:
            mock_tz.now.return_value = datetime(2024, 1, 1, 12, 0, 0)
            result = should_send_report(mock_report)
        
        assert result is False
    
    def test_should_not_send_when_next_run_none(self):
        mock_report = Mock()
        mock_report.next_run = None
        
        result = should_send_report(mock_report)
        
        assert result is False
    
    def test_should_send_when_next_run_equal_now(self):
        now = datetime(2024, 1, 15, 12, 0, 0)
        mock_report = Mock()
        mock_report.next_run = now
        
        with patch('coupon_analytics.services.report_service.timezone') as mock_tz:
            mock_tz.now.return_value = now
            result = should_send_report(mock_report)
        
        assert result is True


class TestCalculateNextRun:
    
    @pytest.fixture
    def mock_report(self):
        report = Mock()
        return report
    
    def test_daily_frequency(self, mock_report):
        mock_report.frequency = 'DAILY'
        base_time = datetime(2024, 1, 1, 10, 0, 0)
        
        with patch('coupon_analytics.services.report_service.Report') as MockReport:
            MockReport.Frequency.DAILY = 'DAILY'
            MockReport.Frequency.WEEKLY = 'WEEKLY'
            MockReport.Frequency.MONTHLY = 'MONTHLY'
            MockReport.Frequency.YEARLY = 'YEARLY'
            
            result = calculate_next_run(mock_report, base_time)
        
        expected = base_time + timedelta(days=1)
        assert result == expected
    
    def test_weekly_frequency(self, mock_report):
        mock_report.frequency = 'WEEKLY'
        base_time = datetime(2024, 1, 1, 10, 0, 0)
        
        with patch('coupon_analytics.services.report_service.Report') as MockReport:
            MockReport.Frequency.DAILY = 'DAILY'
            MockReport.Frequency.WEEKLY = 'WEEKLY'
            MockReport.Frequency.MONTHLY = 'MONTHLY'
            MockReport.Frequency.YEARLY = 'YEARLY'
            
            result = calculate_next_run(mock_report, base_time)
        
        expected = base_time + timedelta(weeks=1)
        assert result == expected
    
    def test_monthly_frequency(self, mock_report):
        mock_report.frequency = 'MONTHLY'
        base_time = datetime(2024, 1, 1, 10, 0, 0)
        
        with patch('coupon_analytics.services.report_service.Report') as MockReport:
            MockReport.Frequency.DAILY = 'DAILY'
            MockReport.Frequency.WEEKLY = 'WEEKLY'
            MockReport.Frequency.MONTHLY = 'MONTHLY'
            MockReport.Frequency.YEARLY = 'YEARLY'
            
            result = calculate_next_run(mock_report, base_time)
        
        expected = base_time + timedelta(days=30)
        assert result == expected
    
    def test_yearly_frequency(self, mock_report):
        mock_report.frequency = 'YEARLY'
        base_time = datetime(2024, 1, 1, 10, 0, 0)
        
        with patch('coupon_analytics.services.report_service.Report') as MockReport:
            MockReport.Frequency.DAILY = 'DAILY'
            MockReport.Frequency.WEEKLY = 'WEEKLY'
            MockReport.Frequency.MONTHLY = 'MONTHLY'
            MockReport.Frequency.YEARLY = 'YEARLY'
            
            result = calculate_next_run(mock_report, base_time)
        
        expected = base_time + timedelta(days=365)
        assert result == expected
    
    def test_unknown_frequency_defaults_to_daily(self, mock_report):
        mock_report.frequency = 'UNKNOWN'
        base_time = datetime(2024, 1, 1, 10, 0, 0)
        
        with patch('coupon_analytics.services.report_service.Report') as MockReport:
            MockReport.Frequency.DAILY = 'DAILY'
            MockReport.Frequency.WEEKLY = 'WEEKLY'
            MockReport.Frequency.MONTHLY = 'MONTHLY'
            MockReport.Frequency.YEARLY = 'YEARLY'
            
            result = calculate_next_run(mock_report, base_time)
        
        expected = base_time + timedelta(days=1)
        assert result == expected


class TestFormatReportMessage:
    
    def test_daily_report_formatting(self):
        report_data = {
            'frequency': 'DAILY',
            'generated_at': '2024-01-15T10:30:00.000000',
            'data': {
                'total_coupons': 10,
                'won': 5,
                'lost': 4,
                'in_progress': 1,
                'total_stake': '100.00',
                'total_payout': '150.00',
                'profit': '50.00',
                'win_rate': 55.56,
                'roi': 50.0,
            }
        }
        
        result = format_report_message(report_data)
        
        assert 'DAILY' in result
        assert 'Total: 10' in result
        assert 'Won: 5' in result
        assert 'Lost: 4' in result
    
    def test_weekly_report_formatting(self):
        report_data = {
            'frequency': 'WEEKLY',
            'generated_at': '2024-01-15T10:30:00.000000',
            'data': {
                'total_coupons': 50,
                'won': 30,
                'lost': 18,
                'in_progress': 2,
                'total_stake': '500.00',
                'total_payout': '700.00',
                'profit': '200.00',
                'win_rate': 62.5,
                'roi': 40.0,
            }
        }
        
        result = format_report_message(report_data)
        
        assert 'WEEKLY' in result
        assert 'Total: 50' in result
    
    def test_monthly_report_formatting(self):
        report_data = {
            'frequency': 'MONTHLY',
            'generated_at': '2024-01-15T10:30:00.000000',
            'data': {
                'total_coupons': 200,
                'won': 100,
                'lost': 95,
                'in_progress': 5,
                'total_stake': '2000.00',
                'total_payout': '2200.00',
                'profit': '200.00',
                'win_rate': 51.28,
                'roi': 10.0,
            }
        }
        
        result = format_report_message(report_data)
        
        assert 'MONTHLY' in result
    
    def test_yearly_report_formatting(self):
        report_data = {
            'frequency': 'YEARLY',
            'generated_at': '2024-12-31T23:59:59.000000',
            'data': {
                'total_coupons': 2500,
                'won': 1300,
                'lost': 1150,
                'in_progress': 50,
                'total_stake': '25000.00',
                'total_payout': '30000.00',
                'profit': '5000.00',
                'win_rate': 53.06,
                'roi': 20.0,
            }
        }
        
        result = format_report_message(report_data)
        
        assert 'YEARLY' in result
    
    def test_message_contains_all_sections(self):
        report_data = {
            'frequency': 'DAILY',
            'generated_at': '2024-01-15T10:30:00.000000',
            'data': {
                'total_coupons': 10,
                'won': 5,
                'lost': 4,
                'in_progress': 1,
                'total_stake': '100.00',
                'total_payout': '150.00',
                'profit': '50.00',
                'win_rate': 55.56,
                'roi': 50.0,
            }
        }
        
        result = format_report_message(report_data)
        
        assert 'Coupon statistics' in result
        assert 'Finances' in result
        assert 'Metrics' in result
        assert 'Win rate' in result
        assert 'ROI' in result
    
    def test_negative_profit_display(self):
        report_data = {
            'frequency': 'DAILY',
            'generated_at': '2024-01-15T10:30:00.000000',
            'data': {
                'total_coupons': 10,
                'won': 2,
                'lost': 8,
                'in_progress': 0,
                'total_stake': '100.00',
                'total_payout': '50.00',
                'profit': '-50.00',
                'win_rate': 20.0,
                'roi': -50.0,
            }
        }
        
        result = format_report_message(report_data)
        
        assert '-50.00' in result
        assert '-50.0%' in result


class TestFormatReportMessageEdgeCases:
    
    def test_zero_coupons(self):
        report_data = {
            'frequency': 'DAILY',
            'generated_at': '2024-01-15T10:30:00.000000',
            'data': {
                'total_coupons': 0,
                'won': 0,
                'lost': 0,
                'in_progress': 0,
                'total_stake': '0.00',
                'total_payout': '0.00',
                'profit': '0.00',
                'win_rate': 0,
                'roi': 0,
            }
        }
        
        result = format_report_message(report_data)
        
        assert 'Total: 0' in result
        assert 'Win rate: 0%' in result
    
    def test_unknown_frequency_uses_default_emoji(self):
        report_data = {
            'frequency': 'CUSTOM',
            'generated_at': '2024-01-15T10:30:00.000000',
            'data': {
                'total_coupons': 10,
                'won': 5,
                'lost': 5,
                'in_progress': 0,
                'total_stake': '100.00',
                'total_payout': '100.00',
                'profit': '0.00',
                'win_rate': 50.0,
                'roi': 0.0,
            }
        }
        
        result = format_report_message(report_data)
        
        assert 'REPORT' in result
