import pytest
from decimal import Decimal
from unittest.mock import Mock, patch, MagicMock
from coupons.services.coupon_service import CouponService
from coupons.models import Bet, Coupon
from common.choices import CouponType

class TestCouponService:

    @pytest.fixture
    def service(self):
        return CouponService()

    def test_bet_returned_odds_canceled(self, service):
        mock_bet = Mock(spec=Bet)
        mock_bet.result = Bet.BetResult.CANCELED
        mock_bet.odds = Decimal('2.50')
        
        result = service.bet_returned_odds(mock_bet)
        assert result == Decimal('1.00')

    def test_bet_returned_odds_not_canceled(self, service):
        mock_bet = Mock(spec=Bet)
        mock_bet.result = Bet.BetResult.WIN
        mock_bet.odds = Decimal('2.50')
        
        result = service.bet_returned_odds(mock_bet)
        assert result == Decimal('2.50')

    def test_quantize2_odds(self, service):
        assert service.quantize2_odds(Decimal('1.234')) == Decimal('1.23')
        assert service.quantize2_odds(Decimal('1.235')) == Decimal('1.24')
        assert service.quantize2_odds(Decimal('1.2')) == Decimal('1.20')

    @patch('coupons.services.coupon_service.Bet.objects.filter')
    def test_recalc_coupon_odds_solo(self, mock_bet_filter, service):
        mock_coupon = Mock(spec=Coupon)
        mock_coupon.coupon_type = CouponType.AKO
        
        mock_bet = Mock(spec=Bet)
        mock_bet.result = Bet.BetResult.WIN
        mock_bet.odds = Decimal('2.00')
        
        mock_qs = MagicMock()
        mock_qs.only.return_value = [mock_bet]
        mock_qs.count.return_value = 1
        mock_bet_filter.return_value = mock_qs

        result = service.recalc_coupon_odds(mock_coupon)

        assert mock_coupon.multiplier == Decimal('2.00')
        assert mock_coupon.coupon_type == CouponType.SOLO
        mock_coupon.save.assert_called_once_with(update_fields=['multiplier', 'coupon_type'])
        assert result == mock_coupon

    @patch('coupons.services.coupon_service.Bet.objects.filter')
    def test_recalc_coupon_odds_ako(self, mock_bet_filter, service):
        mock_coupon = Mock(spec=Coupon)
        mock_coupon.coupon_type = CouponType.SOLO
        
        bet1 = Mock(spec=Bet)
        bet1.result = Bet.BetResult.WIN
        bet1.odds = Decimal('2.00')
        
        bet2 = Mock(spec=Bet)
        bet2.result = Bet.BetResult.CANCELED
        bet2.odds = Decimal('1.50')
        
        mock_qs = MagicMock()
        mock_qs.only.return_value = [bet1, bet2]
        mock_qs.count.return_value = 2
        mock_bet_filter.return_value = mock_qs

        result = service.recalc_coupon_odds(mock_coupon)

        assert mock_coupon.multiplier == Decimal('2.00') # 2.00 * 1.00 (canceled)
        assert mock_coupon.coupon_type == CouponType.AKO
        mock_coupon.save.assert_called_once_with(update_fields=['multiplier', 'coupon_type'])
        assert result == mock_coupon

    @patch('coupons.services.coupon_service.Bet.objects.filter')
    def test_recalc_coupon_odds_multiple_wins(self, mock_bet_filter, service):
        mock_coupon = Mock(spec=Coupon)
        mock_coupon.coupon_type = CouponType.AKO
        
        bet1 = Mock(spec=Bet)
        bet1.result = Bet.BetResult.WIN
        bet1.odds = Decimal('2.00')
        
        bet2 = Mock(spec=Bet)
        bet2.result = Bet.BetResult.WIN
        bet2.odds = Decimal('1.50')
        
        mock_qs = MagicMock()
        mock_qs.only.return_value = [bet1, bet2]
        mock_qs.count.return_value = 2
        mock_bet_filter.return_value = mock_qs

        service.recalc_coupon_odds(mock_coupon)

        assert mock_coupon.multiplier == Decimal('3.00')
