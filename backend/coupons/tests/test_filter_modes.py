"""
Testy dla trybu filtrowania kuponów: won_coupons vs won_bets
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal

from coupons.models import Coupon, Bet, Event, BetTypeDict, Discipline, Bookmaker
from finances.models import BookmakerAccountModel, Currency
from coupon_analytics.models.queries import AnalyticsQuery, AnalyticsQueryGroup, AnalyticsQueryCondition
from coupon_analytics.services.query_builder import AnalyticsQueryBuilder

User = get_user_model()


class FilterModeTestCase(TestCase):
    """Test rozróżnienia między wygranym kuponem a wygranym typem"""

    def setUp(self):
        """Przygotowanie danych testowych"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Waluta
        self.currency = Currency.objects.create(
            code='PLN',
            name='Polish Zloty',
            symbol='zł'
        )
        
        # Bukmacher
        self.bookmaker = Bookmaker.objects.create(
            name='Test Bookie',
            country='PL'
        )
        
        # Konto bukmachera
        self.account = BookmakerAccountModel.objects.create(
            user=self.user,
            bookmaker=self.bookmaker,
            currency=self.currency,
            balance=Decimal('1000.00')
        )
        
        # Dyscyplina
        self.discipline = Discipline.objects.create(
            name='Football',
            code='FOOTBALL'
        )
        
        # Typ zakładu
        self.bet_type = BetTypeDict.objects.create(
            description='1X2',
            code='1X2'
        )
        
        # Eventy
        self.event1 = Event.objects.create(
            home_team='Barcelona',
            away_team='Real Madrid',
            discipline=self.discipline
        )
        
        self.event2 = Event.objects.create(
            home_team='Bayern',
            away_team='Dortmund',
            discipline=self.discipline
        )
        
        # SCENARIUSZ 1: Kupon SOLO wygrany
        self.coupon_solo_won = Coupon.objects.create(
            user=self.user,
            bookmaker_account=self.account,
            coupon_type='solo',
            bet_stake=Decimal('100.00'),
            multiplier=Decimal('2.00'),
            balance=Decimal('200.00'),
            status='won'
        )
        
        Bet.objects.create(
            coupon=self.coupon_solo_won,
            event=self.event1,
            event_name='Barcelona vs Real Madrid',
            bet_type=self.bet_type,
            discipline=self.discipline,
            line='1',
            odds=Decimal('2.00'),
            result='win'
        )
        
        # SCENARIUSZ 2: Kupon AKO przegrany (Barcelona wygrała, Bayern przegrał)
        self.coupon_ako_lost = Coupon.objects.create(
            user=self.user,
            bookmaker_account=self.account,
            coupon_type='ako',
            bet_stake=Decimal('100.00'),
            multiplier=Decimal('4.00'),
            balance=Decimal('0.00'),
            status='lost'
        )
        
        # Typ 1: Barcelona wygrana
        Bet.objects.create(
            coupon=self.coupon_ako_lost,
            event=self.event1,
            event_name='Barcelona vs Real Madrid',
            bet_type=self.bet_type,
            discipline=self.discipline,
            line='1',
            odds=Decimal('2.00'),
            result='win'  # Ten typ WYGRAŁ
        )
        
        # Typ 2: Bayern przegrany
        Bet.objects.create(
            coupon=self.coupon_ako_lost,
            event=self.event2,
            event_name='Bayern vs Dortmund',
            bet_type=self.bet_type,
            discipline=self.discipline,
            line='1',
            odds=Decimal('2.00'),
            result='lost'  # Ten typ PRZEGRAŁ
        )
        
        # SCENARIUSZ 3: Kupon SOLO przegrany
        self.coupon_solo_lost = Coupon.objects.create(
            user=self.user,
            bookmaker_account=self.account,
            coupon_type='solo',
            bet_stake=Decimal('100.00'),
            multiplier=Decimal('2.00'),
            balance=Decimal('0.00'),
            status='lost'
        )
        
        Bet.objects.create(
            coupon=self.coupon_solo_lost,
            event=self.event2,
            event_name='Bayern vs Dortmund',
            bet_type=self.bet_type,
            discipline=self.discipline,
            line='1',
            odds=Decimal('2.00'),
            result='lost'
        )

    def test_filter_won_coupons_only(self):
        """Test: tylko kupony ze statusem 'won'"""
        query = AnalyticsQuery.objects.create(
            user=self.user,
            name="Won Coupons Only"
        )
        
        group = AnalyticsQueryGroup.objects.create(
            analytics_query=query,
            operator="AND",
            parent=None
        )
        
        AnalyticsQueryCondition.objects.create(
            group=group,
            field="status",
            operator="equals",
            value="won"
        )
        
        builder = AnalyticsQueryBuilder(query)
        coupons = builder.apply()
        
        # Tylko 1 kupon wygrany (solo_won)
        self.assertEqual(coupons.count(), 1)
        self.assertIn(self.coupon_solo_won, coupons)
        self.assertNotIn(self.coupon_ako_lost, coupons)
        self.assertNotIn(self.coupon_solo_lost, coupons)

    def test_filter_won_bets(self):
        """Test: kupony zawierające wygrany typ (nawet jeśli kupon przegrany)"""
        query = AnalyticsQuery.objects.create(
            user=self.user,
            name="Won Bets"
        )
        
        group = AnalyticsQueryGroup.objects.create(
            analytics_query=query,
            operator="AND",
            parent=None
        )
        
        AnalyticsQueryCondition.objects.create(
            group=group,
            field="bets__result",
            operator="equals",
            value="win"
        )
        
        builder = AnalyticsQueryBuilder(query)
        coupons = builder.apply()
        
        # 2 kupony: solo_won i ako_lost (oba mają wygrany typ Barcelona)
        self.assertEqual(coupons.count(), 2)
        self.assertIn(self.coupon_solo_won, coupons)
        self.assertIn(self.coupon_ako_lost, coupons)  # Ważne!
        self.assertNotIn(self.coupon_solo_lost, coupons)

    def test_filter_barcelona_won_bets(self):
        """Test: kupony z wygranym typem na Barcelonę"""
        query = AnalyticsQuery.objects.create(
            user=self.user,
            name="Barcelona Won Bets"
        )
        
        group = AnalyticsQueryGroup.objects.create(
            analytics_query=query,
            operator="AND",
            parent=None
        )
        
        # Barcelona w nazwie eventu
        AnalyticsQueryCondition.objects.create(
            group=group,
            field="bets__event__home_team",
            operator="contains",
            value="Barcelona",
            order=0
        )
        
        # Typ wygrany
        AnalyticsQueryCondition.objects.create(
            group=group,
            field="bets__result",
            operator="equals",
            value="win",
            order=1
        )
        
        builder = AnalyticsQueryBuilder(query)
        coupons = builder.apply()
        
        # 2 kupony: solo_won i ako_lost
        self.assertEqual(coupons.count(), 2)
        self.assertIn(self.coupon_solo_won, coupons)
        self.assertIn(self.coupon_ako_lost, coupons)

    def test_filter_barcelona_won_coupons(self):
        """Test: tylko wygrane kupony z Barceloną"""
        query = AnalyticsQuery.objects.create(
            user=self.user,
            name="Barcelona Won Coupons"
        )
        
        group = AnalyticsQueryGroup.objects.create(
            analytics_query=query,
            operator="AND",
            parent=None
        )
        
        # Barcelona w nazwie eventu
        AnalyticsQueryCondition.objects.create(
            group=group,
            field="bets__event__home_team",
            operator="contains",
            value="Barcelona",
            order=0
        )
        
        # Kupon wygrany
        AnalyticsQueryCondition.objects.create(
            group=group,
            field="status",
            operator="equals",
            value="won",
            order=1
        )
        
        builder = AnalyticsQueryBuilder(query)
        coupons = builder.apply()
        
        # Tylko 1 kupon: solo_won
        self.assertEqual(coupons.count(), 1)
        self.assertIn(self.coupon_solo_won, coupons)
        self.assertNotIn(self.coupon_ako_lost, coupons)  # Ważne! AKO przegrane

    def test_all_coupons_barcelona(self):
        """Test: wszystkie kupony z Barceloną (bez filtra wygranych)"""
        query = AnalyticsQuery.objects.create(
            user=self.user,
            name="All Barcelona Coupons"
        )
        
        group = AnalyticsQueryGroup.objects.create(
            analytics_query=query,
            operator="AND",
            parent=None
        )
        
        AnalyticsQueryCondition.objects.create(
            group=group,
            field="bets__event__home_team",
            operator="contains",
            value="Barcelona"
        )
        
        builder = AnalyticsQueryBuilder(query)
        coupons = builder.apply()
        
        # 2 kupony: solo_won i ako_lost
        self.assertEqual(coupons.count(), 2)

