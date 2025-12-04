import os
import sys
import random
from decimal import Decimal
from datetime import datetime, timedelta, timezone as dt_timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BetBetter.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from coupons.models.coupon import Coupon
from coupons.models.bet import Bet
from coupons.models.event import Event
from coupons.models.bet_type_dict import BetTypeDict
from coupons.models.discipline import Discipline
from finances.models.bookmaker_account import BookmakerAccountModel

User = get_user_model()

OPPONENTS_HOME = [
    "Real Madrid", "Atletico Madrid", "Sevilla FC", "Valencia CF", "Villarreal CF",
    "Real Sociedad", "Athletic Bilbao", "Real Betis", "Celta Vigo", "Espanyol",
    "Getafe CF", "Osasuna", "Rayo Vallecano", "Mallorca", "Girona FC",
    "Almeria", "Cadiz CF", "Las Palmas", "Granada CF", "Alaves"
]

OPPONENTS_AWAY = [
    "Real Madrid", "Atletico Madrid", "Sevilla FC", "Valencia CF", "Villarreal CF",
    "Real Sociedad", "Athletic Bilbao", "Real Betis", "Celta Vigo", "Espanyol",
    "Getafe CF", "Osasuna", "Rayo Vallecano", "Mallorca", "Girona FC",
    "Almeria", "Cadiz CF", "Las Palmas", "Granada CF", "Alaves"
]

OTHER_MATCHES = [
    ("Real Madrid", "Atletico Madrid"),
    ("Sevilla FC", "Valencia CF"),
    ("Villarreal CF", "Real Sociedad"),
    ("Athletic Bilbao", "Real Betis"),
    ("Celta Vigo", "Espanyol"),
    ("Getafe CF", "Osasuna"),
    ("Mallorca", "Girona FC"),
    ("Bayern Munich", "Borussia Dortmund"),
    ("Manchester City", "Liverpool FC"),
    ("Arsenal", "Chelsea"),
    ("PSG", "Marseille"),
    ("Juventus", "Inter Milan"),
    ("AC Milan", "Napoli"),
    ("Ajax", "PSV Eindhoven"),
    ("Porto", "Benfica"),
]

BET_TYPES_CONFIG = [
    {"code": "1X2", "lines": ["1", "X", "2"]},
    {"code": "DC", "lines": ["1X", "12", "X2"]},
    {"code": "DNB", "lines": ["1", "2"]},
    {"code": "OU_2.5", "lines": ["Over 2.5", "Under 2.5"]},
    {"code": "OU_1.5", "lines": ["Over 1.5", "Under 1.5"]},
    {"code": "OU_3.5", "lines": ["Over 3.5", "Under 3.5"]},
    {"code": "BTTS", "lines": ["Yes", "No"]},
    {"code": "HANDICAP", "lines": ["-1", "+1", "-2", "+2"]},
    {"code": "CS", "lines": ["1:0", "2:0", "2:1", "3:1", "0:0", "1:1", "2:2"]},
    {"code": "HT_FT", "lines": ["1/1", "1/X", "1/2", "X/1", "X/X", "X/2", "2/1", "2/X", "2/2"]},
    {"code": "CORNERS_OU_9.5", "lines": ["Over 9.5", "Under 9.5"]},
    {"code": "ANYTIME_SCORER", "lines": ["Lewandowski", "Yamal", "Raphinha", "Pedri", "Gavi"]},
]


def get_random_date_in_2025():
    start = datetime(2025, 1, 1, tzinfo=dt_timezone.utc)
    end = datetime(2025, 12, 1, tzinfo=dt_timezone.utc)
    delta = end - start
    random_days = random.randint(0, delta.days)
    random_hours = random.randint(12, 22)
    return start + timedelta(days=random_days, hours=random_hours)


def get_or_create_bet_type(code):
    try:
        return BetTypeDict.objects.get(code=code)
    except BetTypeDict.DoesNotExist:
        return BetTypeDict.objects.create(code=code, description=f"Bet type {code}")


def create_barcelona_event(discipline, is_home, opponent, event_date):
    if is_home:
        home_team = "FC Barcelona"
        away_team = opponent
        name = f"FC Barcelona - {opponent}"
    else:
        home_team = opponent
        away_team = "FC Barcelona"
        name = f"{opponent} - FC Barcelona"
    
    event = Event.objects.create(
        name=name,
        home_team=home_team,
        away_team=away_team,
        discipline=discipline,
        start_time=event_date,
    )
    return event


def create_other_event(discipline, home, away, event_date):
    event = Event.objects.create(
        name=f"{home} - {away}",
        home_team=home,
        away_team=away,
        discipline=discipline,
        start_time=event_date,
    )
    return event


def get_line_for_barcelona(bet_config, is_home, is_barcelona_win):
    code = bet_config["code"]
    lines = bet_config["lines"]
    
    if code == "1X2":
        if is_barcelona_win:
            return "1" if is_home else "2"
        else:
            return random.choice(lines)
    elif code == "DC":
        if is_barcelona_win:
            return "1X" if is_home else "X2"
        return random.choice(lines)
    elif code == "DNB":
        if is_barcelona_win:
            return "1" if is_home else "2"
        return random.choice(lines)
    else:
        return random.choice(lines)


def generate_odds():
    return Decimal(str(round(random.uniform(1.20, 5.50), 2)))


def seed_barcelona_coupons():
    try:
        user = User.objects.get(id=1)
    except User.DoesNotExist:
        print("User with id=1 does not exist!")
        return
    
    try:
        bookmaker_account = BookmakerAccountModel.objects.filter(user=user).first()
        if not bookmaker_account:
            print("User has no bookmaker account! Creating default...")
            from coupons.models.bookmaker import Bookmaker
            from coupons.models.currency import Currency
            bookmaker = Bookmaker.objects.first()
            currency = Currency.objects.first()
            if not bookmaker or not currency:
                print("No bookmaker or currency in database!")
                return
            bookmaker_account = BookmakerAccountModel.objects.create(
                user=user,
                bookmaker=bookmaker,
                currency=currency,
                balance=1000
            )
    except Exception as e:
        print(f"Error getting bookmaker account: {e}")
        return
    
    discipline = Discipline.objects.filter(name__icontains="piłka").first()
    if not discipline:
        discipline = Discipline.objects.filter(name__icontains="football").first()
    if not discipline:
        discipline = Discipline.objects.filter(code__icontains="FOOTBALL").first()
    if not discipline:
        discipline = Discipline.objects.first()
    if not discipline:
        print("No discipline found in database! Run seed_disciplines first.")
        return

    created_coupons = 0
    
    print("Creating SOLO coupons with Barcelona (home)...")
    for i in range(8):
        event_date = get_random_date_in_2025()
        opponent = random.choice(OPPONENTS_HOME)
        event = create_barcelona_event(discipline, is_home=True, opponent=opponent, event_date=event_date)
        
        bet_config = random.choice(BET_TYPES_CONFIG)
        bet_type = get_or_create_bet_type(bet_config["code"])
        odds = generate_odds()
        is_won = random.choice([True, True, True, False, False])
        
        coupon = Coupon.objects.create(
            user=user,
            bookmaker_account=bookmaker_account,
            coupon_type="solo",
            bet_stake=Decimal(str(random.randint(10, 100))),
            multiplier=odds,
            status="won" if is_won else "lost",
            balance=Decimal(str(random.randint(10, 100))) * odds if is_won else Decimal("0.00"),
            created_at=event_date - timedelta(hours=1),
        )
        
        Bet.objects.create(
            coupon=coupon,
            event=event,
            event_name=event.name,
            bet_type=bet_type,
            discipline=discipline,
            line=get_line_for_barcelona(bet_config, is_home=True, is_barcelona_win=is_won),
            odds=odds,
            result="win" if is_won else "lost",
        )
        created_coupons += 1
    
    print("Creating SOLO coupons with Barcelona (away)...")
    for i in range(8):
        event_date = get_random_date_in_2025()
        opponent = random.choice(OPPONENTS_AWAY)
        event = create_barcelona_event(discipline, is_home=False, opponent=opponent, event_date=event_date)
        
        bet_config = random.choice(BET_TYPES_CONFIG)
        bet_type = get_or_create_bet_type(bet_config["code"])
        odds = generate_odds()
        is_won = random.choice([True, True, False, False, False])
        
        coupon = Coupon.objects.create(
            user=user,
            bookmaker_account=bookmaker_account,
            coupon_type="solo",
            bet_stake=Decimal(str(random.randint(10, 100))),
            multiplier=odds,
            status="won" if is_won else "lost",
            balance=Decimal(str(random.randint(10, 100))) * odds if is_won else Decimal("0.00"),
            created_at=event_date - timedelta(hours=1),
        )
        
        Bet.objects.create(
            coupon=coupon,
            event=event,
            event_name=event.name,
            bet_type=bet_type,
            discipline=discipline,
            line=get_line_for_barcelona(bet_config, is_home=False, is_barcelona_win=is_won),
            odds=odds,
            result="win" if is_won else "lost",
        )
        created_coupons += 1
    
    print("Creating AKO coupons with Barcelona + other matches...")
    for i in range(18):
        event_date = get_random_date_in_2025()
        is_home = random.choice([True, False])
        opponent = random.choice(OPPONENTS_HOME if is_home else OPPONENTS_AWAY)
        barcelona_event = create_barcelona_event(discipline, is_home=is_home, opponent=opponent, event_date=event_date)
        
        num_other_bets = random.randint(1, 3)
        other_matches_sample = random.sample(OTHER_MATCHES, num_other_bets)
        
        all_bets_data = []
        total_odds = Decimal("1.00")
        
        barcelona_bet_config = random.choice(BET_TYPES_CONFIG)
        barcelona_bet_type = get_or_create_bet_type(barcelona_bet_config["code"])
        barcelona_odds = generate_odds()
        barcelona_won = random.choice([True, True, False])
        
        all_bets_data.append({
            "event": barcelona_event,
            "bet_type": barcelona_bet_type,
            "bet_config": barcelona_bet_config,
            "odds": barcelona_odds,
            "is_barcelona": True,
            "is_home": is_home,
            "won": barcelona_won,
        })
        total_odds *= barcelona_odds
        
        for home, away in other_matches_sample:
            other_event = create_other_event(discipline, home, away, event_date + timedelta(hours=random.randint(-2, 2)))
            other_bet_config = random.choice(BET_TYPES_CONFIG[:7])
            other_bet_type = get_or_create_bet_type(other_bet_config["code"])
            other_odds = generate_odds()
            other_won = random.choice([True, True, True, False])
            
            all_bets_data.append({
                "event": other_event,
                "bet_type": other_bet_type,
                "bet_config": other_bet_config,
                "odds": other_odds,
                "is_barcelona": False,
                "is_home": True,
                "won": other_won,
            })
            total_odds *= other_odds
        
        all_won = all(b["won"] for b in all_bets_data)
        stake = Decimal(str(random.randint(10, 50)))
        
        coupon = Coupon.objects.create(
            user=user,
            bookmaker_account=bookmaker_account,
            coupon_type="combo",
            bet_stake=stake,
            multiplier=total_odds.quantize(Decimal("0.01")),
            status="won" if all_won else "lost",
            balance=stake * total_odds if all_won else Decimal("0.00"),
            created_at=event_date - timedelta(hours=1),
        )
        
        for bet_data in all_bets_data:
            if bet_data["is_barcelona"]:
                line = get_line_for_barcelona(bet_data["bet_config"], bet_data["is_home"], bet_data["won"])
            else:
                line = random.choice(bet_data["bet_config"]["lines"])
            
            Bet.objects.create(
                coupon=coupon,
                event=bet_data["event"],
                event_name=bet_data["event"].name,
                bet_type=bet_data["bet_type"],
                discipline=discipline,
                line=line,
                odds=bet_data["odds"],
                result="win" if bet_data["won"] else "lost",
            )
        
        created_coupons += 1
    
    print("Creating special Barcelona coupons (specific bet types)...")
    special_bet_types = ["BTTS", "OU_2.5", "HANDICAP", "CS", "ANYTIME_SCORER", "CORNERS_OU_9.5"]
    
    for bet_code in special_bet_types:
        for j in range(2):
            event_date = get_random_date_in_2025()
            is_home = random.choice([True, False])
            opponent = random.choice(OPPONENTS_HOME if is_home else OPPONENTS_AWAY)
            event = create_barcelona_event(discipline, is_home=is_home, opponent=opponent, event_date=event_date)
            
            bet_config = next((b for b in BET_TYPES_CONFIG if b["code"] == bet_code), BET_TYPES_CONFIG[0])
            bet_type = get_or_create_bet_type(bet_code)
            odds = generate_odds()
            is_won = random.choice([True, False])
            
            coupon = Coupon.objects.create(
                user=user,
                bookmaker_account=bookmaker_account,
                coupon_type="solo",
                bet_stake=Decimal(str(random.randint(20, 80))),
                multiplier=odds,
                status="won" if is_won else "lost",
                balance=Decimal(str(random.randint(20, 80))) * odds if is_won else Decimal("0.00"),
                created_at=event_date - timedelta(hours=1),
            )
            
            Bet.objects.create(
                coupon=coupon,
                event=event,
                event_name=event.name,
                bet_type=bet_type,
                discipline=discipline,
                line=random.choice(bet_config["lines"]),
                odds=odds,
                result="win" if is_won else "lost",
            )
            created_coupons += 1
    
    print("Creating in_progress coupons...")
    for i in range(4):
        event_date = timezone.now() + timedelta(days=random.randint(1, 30))
        is_home = random.choice([True, False])
        opponent = random.choice(OPPONENTS_HOME if is_home else OPPONENTS_AWAY)
        event = create_barcelona_event(discipline, is_home=is_home, opponent=opponent, event_date=event_date)
        
        bet_config = random.choice(BET_TYPES_CONFIG)
        bet_type = get_or_create_bet_type(bet_config["code"])
        odds = generate_odds()
        
        coupon = Coupon.objects.create(
            user=user,
            bookmaker_account=bookmaker_account,
            coupon_type="solo",
            bet_stake=Decimal(str(random.randint(10, 100))),
            multiplier=odds,
            status="in_progress",
            balance=Decimal("0.00"),
            created_at=timezone.now(),
        )
        
        Bet.objects.create(
            coupon=coupon,
            event=event,
            event_name=event.name,
            bet_type=bet_type,
            discipline=discipline,
            line=random.choice(bet_config["lines"]),
            odds=odds,
            result=None,
        )
        created_coupons += 1
    
    print(f"\n✅ Created {created_coupons} Barcelona coupons for user id=1!")
    print(f"   - Solo home: 8")
    print(f"   - Solo away: 8")
    print(f"   - Combo (AKO): 18")
    print(f"   - Special bet types: 12")
    print(f"   - In progress: 4")


if __name__ == "__main__":
    seed_barcelona_coupons()

