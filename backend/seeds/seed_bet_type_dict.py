import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BetBetter.settings')

import django
django.setup()

from coupons.models.bet_type_dict import BetTypeDict
from coupons.models.discipline import Discipline
UNIVERSAL_BET_TYPES = [
    {"code": "1X2", "description": "Wynik meczu (1X2)"},
    {"code": "1X2_H1", "description": "Wynik 1. połowy"},
    {"code": "1X2_H2", "description": "Wynik 2. połowy"},
    {"code": "DC", "description": "Podwójna szansa"},
    {"code": "DC_H1", "description": "Podwójna szansa - 1. połowa"},
    {"code": "DNB", "description": "Remis bez zakładu"},
    {"code": "ML", "description": "Zwycięzca meczu (Moneyline)"},
    {"code": "HANDICAP", "description": "Handicap"},
    {"code": "AH", "description": "Handicap azjatycki"},
]

SOCCER_BET_TYPES = [
    {"code": "1X2", "description": "Wynik meczu (1X2)"},
    {"code": "1X2_H1", "description": "Wynik 1. połowy"},
    {"code": "1X2_H2", "description": "Wynik 2. połowy"},
    {"code": "DC", "description": "Podwójna szansa"},
    {"code": "DC_H1", "description": "Podwójna szansa - 1. połowa"},
    {"code": "DNB", "description": "Remis bez zakładu"},
    {"code": "DNB_H1", "description": "Remis bez zakładu - 1. połowa"},
    
    {"code": "OU_0.5", "description": "Over/Under 0.5 bramek"},
    {"code": "OU_1.5", "description": "Over/Under 1.5 bramek"},
    {"code": "OU_2.5", "description": "Over/Under 2.5 bramek"},
    {"code": "OU_3.5", "description": "Over/Under 3.5 bramek"},
    {"code": "OU_4.5", "description": "Over/Under 4.5 bramek"},
    {"code": "OU_5.5", "description": "Over/Under 5.5 bramek"},
    {"code": "OU_H1_0.5", "description": "Over/Under 0.5 bramek - 1. połowa"},
    {"code": "OU_H1_1.5", "description": "Over/Under 1.5 bramek - 1. połowa"},
    {"code": "OU_H1_2.5", "description": "Over/Under 2.5 bramek - 1. połowa"},
    {"code": "OU_H2_0.5", "description": "Over/Under 0.5 bramek - 2. połowa"},
    {"code": "OU_H2_1.5", "description": "Over/Under 1.5 bramek - 2. połowa"},
    
    {"code": "HOME_OU_0.5", "description": "Gospodarze Over/Under 0.5 bramek"},
    {"code": "HOME_OU_1.5", "description": "Gospodarze Over/Under 1.5 bramek"},
    {"code": "HOME_OU_2.5", "description": "Gospodarze Over/Under 2.5 bramek"},
    {"code": "AWAY_OU_0.5", "description": "Goście Over/Under 0.5 bramek"},
    {"code": "AWAY_OU_1.5", "description": "Goście Over/Under 1.5 bramek"},
    {"code": "AWAY_OU_2.5", "description": "Goście Over/Under 2.5 bramek"},
    
    {"code": "BTTS", "description": "Obie drużyny strzelą (BTTS)"},
    {"code": "BTTS_H1", "description": "Obie drużyny strzelą - 1. połowa"},
    {"code": "BTTS_H2", "description": "Obie drużyny strzelą - 2. połowa"},
    {"code": "BTTS_YES_OU_2.5", "description": "BTTS + Over/Under 2.5"},
    {"code": "BTTS_NO_OU_2.5", "description": "BTTS Nie + Over/Under 2.5"},
    
    {"code": "HANDICAP", "description": "Handicap europejski"},
    {"code": "AH", "description": "Handicap azjatycki"},
    {"code": "AH_H1", "description": "Handicap azjatycki - 1. połowa"},
    
    {"code": "CS", "description": "Dokładny wynik"},
    {"code": "CS_H1", "description": "Dokładny wynik - 1. połowa"},
    
    {"code": "HT_FT", "description": "Połowa/Koniec meczu"},
    
    {"code": "CORNERS_OU", "description": "Rzuty rożne Over/Under"},
    {"code": "CORNERS_OU_8.5", "description": "Rzuty rożne Over/Under 8.5"},
    {"code": "CORNERS_OU_9.5", "description": "Rzuty rożne Over/Under 9.5"},
    {"code": "CORNERS_OU_10.5", "description": "Rzuty rożne Over/Under 10.5"},
    {"code": "CORNERS_1X2", "description": "Rzuty rożne - Więcej"},
    {"code": "CORNERS_AH", "description": "Rzuty rożne - Handicap azjatycki"},
    
    {"code": "CARDS_OU", "description": "Kartki Over/Under"},
    {"code": "CARDS_OU_3.5", "description": "Kartki Over/Under 3.5"},
    {"code": "CARDS_OU_4.5", "description": "Kartki Over/Under 4.5"},
    {"code": "CARDS_1X2", "description": "Kartki - Więcej"},
    {"code": "RED_CARD", "description": "Czerwona kartka w meczu"},
    
    {"code": "ANYTIME_SCORER", "description": "Strzelec bramki (kiedykolwiek)"},
    {"code": "FIRST_SCORER", "description": "Pierwszy strzelec"},
    {"code": "LAST_SCORER", "description": "Ostatni strzelec"},
    {"code": "SCORER_2+", "description": "Strzelec 2+ bramek"},
    {"code": "SCORER_HAT", "description": "Hat-trick"},
    
    {"code": "GOAL_0_15", "description": "Bramka w 0-15 min"},
    {"code": "GOAL_16_30", "description": "Bramka w 16-30 min"},
    {"code": "GOAL_31_45", "description": "Bramka w 31-45 min"},
    {"code": "GOAL_46_60", "description": "Bramka w 46-60 min"},
    {"code": "GOAL_61_75", "description": "Bramka w 61-75 min"},
    {"code": "GOAL_76_90", "description": "Bramka w 76-90 min"},
    
    {"code": "CLEAN_SHEET_HOME", "description": "Czyste konto - Gospodarze"},
    {"code": "CLEAN_SHEET_AWAY", "description": "Czyste konto - Goście"},
    {"code": "WIN_TO_NIL_HOME", "description": "Wygrana do zera - Gospodarze"},
    {"code": "WIN_TO_NIL_AWAY", "description": "Wygrana do zera - Goście"},
    {"code": "ODD_EVEN", "description": "Parzyste/Nieparzyste bramki"},
    {"code": "HIGHEST_SCORING_HALF", "description": "Połowa z większą liczbą bramek"},
    {"code": "PENALTY", "description": "Rzut karny w meczu"},
    {"code": "OWN_GOAL", "description": "Samobój w meczu"},
]

BASKETBALL_BET_TYPES = [
    {"code": "ML", "description": "Zwycięzca meczu"},
    {"code": "ML_H1", "description": "Zwycięzca 1. połowy"},
    {"code": "ML_Q1", "description": "Zwycięzca 1. kwarty"},
    {"code": "ML_Q2", "description": "Zwycięzca 2. kwarty"},
    {"code": "ML_Q3", "description": "Zwycięzca 3. kwarty"},
    {"code": "ML_Q4", "description": "Zwycięzca 4. kwarty"},
    
    {"code": "SPREAD", "description": "Spread (handicap punktowy)"},
    {"code": "SPREAD_H1", "description": "Spread - 1. połowa"},
    {"code": "SPREAD_Q1", "description": "Spread - 1. kwarta"},
    {"code": "AH", "description": "Handicap azjatycki"},
    
    {"code": "OU", "description": "Over/Under punktów"},
    {"code": "OU_H1", "description": "Over/Under punktów - 1. połowa"},
    {"code": "OU_Q1", "description": "Over/Under punktów - 1. kwarta"},
    {"code": "HOME_OU", "description": "Punkty gospodarzy Over/Under"},
    {"code": "AWAY_OU", "description": "Punkty gości Over/Under"},
    
    {"code": "ODD_EVEN", "description": "Parzyste/Nieparzyste punkty"},
    {"code": "ODD_EVEN_H1", "description": "Parzyste/Nieparzyste - 1. połowa"},
    
    {"code": "WIN_MARGIN", "description": "Margines zwycięstwa"},
    {"code": "WIN_MARGIN_EXACT", "description": "Dokładny margines zwycięstwa"},
    
    {"code": "OVERTIME", "description": "Dogrywka - Tak/Nie"},
    
    {"code": "HIGHEST_SCORING_Q", "description": "Kwarta z największą liczbą punktów"},
    {"code": "RACE_TO_X", "description": "Kto pierwszy zdobędzie X punktów"},
    
    {"code": "PLAYER_POINTS", "description": "Punkty zawodnika Over/Under"},
    {"code": "PLAYER_REBOUNDS", "description": "Zbiórki zawodnika Over/Under"},
    {"code": "PLAYER_ASSISTS", "description": "Asysty zawodnika Over/Under"},
    {"code": "PLAYER_3PT", "description": "Trójki zawodnika Over/Under"},
    {"code": "PLAYER_DOUBLE", "description": "Double-double zawodnika"},
    {"code": "PLAYER_TRIPLE", "description": "Triple-double zawodnika"},
]

TENNIS_BET_TYPES = [
    {"code": "ML", "description": "Zwycięzca meczu"},
    {"code": "ML_SET1", "description": "Zwycięzca 1. seta"},
    {"code": "ML_SET2", "description": "Zwycięzca 2. seta"},
    {"code": "ML_SET3", "description": "Zwycięzca 3. seta"},
    
    {"code": "HANDICAP_GAMES", "description": "Handicap gemów"},
    {"code": "HANDICAP_SETS", "description": "Handicap setów"},
    {"code": "AH_GAMES", "description": "Handicap azjatycki gemów"},
    
    {"code": "OU_GAMES", "description": "Over/Under gemów"},
    {"code": "OU_SETS", "description": "Over/Under setów"},
    {"code": "OU_GAMES_SET1", "description": "Over/Under gemów - 1. set"},
    {"code": "OU_GAMES_SET2", "description": "Over/Under gemów - 2. set"},
    
    {"code": "CS_SETS", "description": "Dokładny wynik w setach"},
    
    {"code": "TIEBREAK", "description": "Tie-break w meczu - Tak/Nie"},
    {"code": "TIEBREAK_SET1", "description": "Tie-break w 1. secie"},
    
    {"code": "SET_BETTING", "description": "Zakład na sety"},
    {"code": "FIRST_SET_FIRST_GAME", "description": "Zwycięzca 1. gema"},
    
    {"code": "ACES_OU", "description": "Asy Over/Under"},
    {"code": "DOUBLE_FAULTS_OU", "description": "Podwójne błędy Over/Under"},
    
    {"code": "ODD_EVEN_GAMES", "description": "Parzyste/Nieparzyste gemy"},
    {"code": "SET_TO_LOVE", "description": "Set do zera"},
]

VOLLEYBALL_BET_TYPES = [
    {"code": "ML", "description": "Zwycięzca meczu"},
    {"code": "ML_SET1", "description": "Zwycięzca 1. seta"},
    {"code": "ML_SET2", "description": "Zwycięzca 2. seta"},
    {"code": "ML_SET3", "description": "Zwycięzca 3. seta"},
    {"code": "HANDICAP_SETS", "description": "Handicap setów"},
    {"code": "HANDICAP_POINTS", "description": "Handicap punktów"},
    {"code": "OU_SETS", "description": "Over/Under setów"},
    {"code": "OU_POINTS", "description": "Over/Under punktów"},
    {"code": "OU_POINTS_SET1", "description": "Over/Under punktów - 1. set"},
    {"code": "CS_SETS", "description": "Dokładny wynik w setach"},
    {"code": "ODD_EVEN_POINTS", "description": "Parzyste/Nieparzyste punkty"},
]

HOCKEY_BET_TYPES = [
    {"code": "1X2", "description": "Wynik meczu (1X2)"},
    {"code": "ML", "description": "Zwycięzca (z dogrywką)"},
    {"code": "ML_REG", "description": "Zwycięzca (czas regulaminowy)"},
    {"code": "DC", "description": "Podwójna szansa"},
    {"code": "DNB", "description": "Remis bez zakładu"},
    {"code": "OU_0.5", "description": "Over/Under 0.5 goli"},
    {"code": "OU_1.5", "description": "Over/Under 1.5 goli"},
    {"code": "OU_2.5", "description": "Over/Under 2.5 goli"},
    {"code": "OU_3.5", "description": "Over/Under 3.5 goli"},
    {"code": "OU_4.5", "description": "Over/Under 4.5 goli"},
    {"code": "OU_5.5", "description": "Over/Under 5.5 goli"},
    {"code": "OU_6.5", "description": "Over/Under 6.5 goli"},
    {"code": "BTTS", "description": "Obie drużyny strzelą"},
    {"code": "HANDICAP", "description": "Handicap"},
    {"code": "PERIOD_1X2", "description": "Wynik 1. tercji"},
    {"code": "PERIOD_OU", "description": "Over/Under goli - tercja"},
    {"code": "OVERTIME", "description": "Dogrywka - Tak/Nie"},
    {"code": "FIRST_GOAL", "description": "Pierwsza bramka"},
    {"code": "EMPTY_NET", "description": "Bramka przy pustej bramce"},
]

HANDBALL_BET_TYPES = [
    {"code": "1X2", "description": "Wynik meczu (1X2)"},
    {"code": "1X2_H1", "description": "Wynik 1. połowy"},
    {"code": "ML", "description": "Zwycięzca meczu"},
    {"code": "DC", "description": "Podwójna szansa"},
    {"code": "DNB", "description": "Remis bez zakładu"},
    {"code": "OU", "description": "Over/Under bramek"},
    {"code": "OU_H1", "description": "Over/Under bramek - 1. połowa"},
    {"code": "HANDICAP", "description": "Handicap"},
    {"code": "AH", "description": "Handicap azjatycki"},
    {"code": "ODD_EVEN", "description": "Parzyste/Nieparzyste bramki"},
    {"code": "HT_FT", "description": "Połowa/Koniec meczu"},
    {"code": "WIN_MARGIN", "description": "Margines zwycięstwa"},
]

BOXING_BET_TYPES = [
    {"code": "ML", "description": "Zwycięzca walki"},
    {"code": "KO_TKO", "description": "Wygrana przez KO/TKO"},
    {"code": "DECISION", "description": "Wygrana na punkty"},
    {"code": "ROUND_BETTING", "description": "Zakład na rundę"},
    {"code": "OU_ROUNDS", "description": "Over/Under rund"},
    {"code": "DISTANCE", "description": "Walka do końca - Tak/Nie"},
    {"code": "METHOD", "description": "Metoda zwycięstwa"},
    {"code": "ROUND_GROUP", "description": "Grupa rund zwycięstwa"},
    {"code": "DRAW", "description": "Remis"},
]

MMA_BET_TYPES = [
    {"code": "ML", "description": "Zwycięzca walki"},
    {"code": "KO_TKO", "description": "Wygrana przez KO/TKO"},
    {"code": "SUBMISSION", "description": "Wygrana przez poddanie"},
    {"code": "DECISION", "description": "Wygrana na punkty"},
    {"code": "OU_ROUNDS", "description": "Over/Under rund"},
    {"code": "DISTANCE", "description": "Walka do końca - Tak/Nie"},
    {"code": "METHOD", "description": "Metoda zwycięstwa"},
    {"code": "ROUND_BETTING", "description": "Zakład na rundę"},
    {"code": "METHOD_ROUND", "description": "Metoda + Runda"},
    {"code": "FIGHTER_KO", "description": "Zawodnik wygra przez KO"},
    {"code": "FIGHTER_SUB", "description": "Zawodnik wygra przez poddanie"},
]

F1_BET_TYPES = [
    {"code": "WINNER", "description": "Zwycięzca wyścigu"},
    {"code": "PODIUM", "description": "Miejsce na podium"},
    {"code": "TOP_6", "description": "Miejsce w TOP 6"},
    {"code": "TOP_10", "description": "Miejsce w TOP 10"},
    {"code": "POLE", "description": "Pole position"},
    {"code": "FASTEST_LAP", "description": "Najszybsze okrążenie"},
    {"code": "H2H", "description": "Head to head kierowców"},
    {"code": "CONSTRUCTOR", "description": "Zwycięski konstruktor"},
    {"code": "DNF", "description": "Nieukończenie wyścigu (DNF)"},
    {"code": "SAFETY_CAR", "description": "Safety car - Tak/Nie"},
    {"code": "WINNING_MARGIN", "description": "Margines zwycięstwa"},
    {"code": "FIRST_RETIREMENT", "description": "Pierwszy kierowca DNF"},
]

SPEEDWAY_BET_TYPES = [
    {"code": "ML", "description": "Zwycięzca meczu"},
    {"code": "HANDICAP", "description": "Handicap punktowy"},
    {"code": "OU", "description": "Over/Under punktów"},
    {"code": "HEAT_WINNER", "description": "Zwycięzca biegu"},
    {"code": "TOP_SCORER", "description": "Najlepszy zawodnik meczu"},
    {"code": "H2H", "description": "Head to head zawodników"},
]

SNOOKER_BET_TYPES = [
    {"code": "ML", "description": "Zwycięzca meczu"},
    {"code": "HANDICAP_FRAMES", "description": "Handicap frame'ów"},
    {"code": "OU_FRAMES", "description": "Over/Under frame'ów"},
    {"code": "CS_FRAMES", "description": "Dokładny wynik w frame'ach"},
    {"code": "CENTURY", "description": "Setka w meczu - Tak/Nie"},
    {"code": "HIGHEST_BREAK", "description": "Najwyższy break Over/Under"},
    {"code": "FRAME_WINNER", "description": "Zwycięzca frame'a"},
    {"code": "147", "description": "Maximum break (147)"},
]

DARTS_BET_TYPES = [
    {"code": "ML", "description": "Zwycięzca meczu"},
    {"code": "HANDICAP_LEGS", "description": "Handicap legów"},
    {"code": "HANDICAP_SETS", "description": "Handicap setów"},
    {"code": "OU_LEGS", "description": "Over/Under legów"},
    {"code": "OU_180", "description": "Over/Under 180-tek"},
    {"code": "CS_LEGS", "description": "Dokładny wynik w legach"},
    {"code": "CHECKOUT_OU", "description": "Najwyższy checkout Over/Under"},
    {"code": "9_DARTER", "description": "9-darter w meczu"},
    {"code": "MOST_180", "description": "Więcej 180-tek"},
]

ESPORT_FPS_BET_TYPES = [
    {"code": "ML", "description": "Zwycięzca meczu"},
    {"code": "ML_MAP1", "description": "Zwycięzca mapy 1"},
    {"code": "ML_MAP2", "description": "Zwycięzca mapy 2"},
    {"code": "ML_MAP3", "description": "Zwycięzca mapy 3"},
    {"code": "HANDICAP_MAPS", "description": "Handicap map"},
    {"code": "HANDICAP_ROUNDS", "description": "Handicap rund"},
    {"code": "OU_MAPS", "description": "Over/Under map"},
    {"code": "OU_ROUNDS", "description": "Over/Under rund"},
    {"code": "OU_ROUNDS_MAP1", "description": "Over/Under rund - mapa 1"},
    {"code": "CS_MAPS", "description": "Dokładny wynik w mapach"},
    {"code": "FIRST_BLOOD", "description": "Pierwszy frag"},
    {"code": "PISTOL_ROUND", "description": "Zwycięzca rundy pistoletowej"},
    {"code": "KNIFE_ROUND", "description": "Zwycięzca rundy nożowej"},
    {"code": "OVERTIME", "description": "Dogrywka - Tak/Nie"},
    {"code": "ACE", "description": "Ace w meczu"},
    {"code": "ODD_EVEN_ROUNDS", "description": "Parzyste/Nieparzyste rundy"},
]

ESPORT_MOBA_BET_TYPES = [
    {"code": "ML", "description": "Zwycięzca meczu"},
    {"code": "ML_MAP1", "description": "Zwycięzca mapy 1"},
    {"code": "ML_MAP2", "description": "Zwycięzca mapy 2"},
    {"code": "ML_MAP3", "description": "Zwycięzca mapy 3"},
    {"code": "HANDICAP_MAPS", "description": "Handicap map"},
    {"code": "OU_MAPS", "description": "Over/Under map"},
    {"code": "CS_MAPS", "description": "Dokładny wynik w mapach"},
    {"code": "FIRST_BLOOD", "description": "Pierwsza krew"},
    {"code": "FIRST_TOWER", "description": "Pierwsza wieża"},
    {"code": "FIRST_DRAGON", "description": "Pierwszy smok"},
    {"code": "FIRST_BARON", "description": "Pierwszy Baron"},
    {"code": "FIRST_ROSHAN", "description": "Pierwszy Roshan (Dota)"},
    {"code": "OU_KILLS", "description": "Over/Under zabójstw"},
    {"code": "OU_KILLS_MAP1", "description": "Over/Under zabójstw - mapa 1"},
    {"code": "OU_DURATION", "description": "Over/Under czas gry"},
    {"code": "ODD_EVEN_KILLS", "description": "Parzyste/Nieparzyste zabójstwa"},
    {"code": "TEAM_KILLS", "description": "Zabójstwa drużyny Over/Under"},
]

ESPORT_FIFA_BET_TYPES = [
    {"code": "1X2", "description": "Wynik meczu (1X2)"},
    {"code": "ML", "description": "Zwycięzca meczu"},
    {"code": "DC", "description": "Podwójna szansa"},
    {"code": "DNB", "description": "Remis bez zakładu"},
    {"code": "OU_0.5", "description": "Over/Under 0.5 bramek"},
    {"code": "OU_1.5", "description": "Over/Under 1.5 bramek"},
    {"code": "OU_2.5", "description": "Over/Under 2.5 bramek"},
    {"code": "OU_3.5", "description": "Over/Under 3.5 bramek"},
    {"code": "OU_4.5", "description": "Over/Under 4.5 bramek"},
    {"code": "BTTS", "description": "Obie strony strzelą"},
    {"code": "HANDICAP", "description": "Handicap"},
    {"code": "CS", "description": "Dokładny wynik"},
    {"code": "ODD_EVEN", "description": "Parzyste/Nieparzyste bramki"},
]

DISCIPLINE_BET_TYPES = {
    "SOC": SOCCER_BET_TYPES,
    "FUTS": SOCCER_BET_TYPES,
    
    "BASK": BASKETBALL_BET_TYPES,
    
    "TEN": TENNIS_BET_TYPES,
    "TABL": TENNIS_BET_TYPES,
    "BADM": TENNIS_BET_TYPES,
    "SQSH": TENNIS_BET_TYPES,
    "PADL": TENNIS_BET_TYPES,
    
    "VOLL": VOLLEYBALL_BET_TYPES,
    "BEAV": VOLLEYBALL_BET_TYPES,
    
    "HOCK": HOCKEY_BET_TYPES,
    "FHOC": HOCKEY_BET_TYPES,
    
    "HAND": HANDBALL_BET_TYPES,
    
    "BOX": BOXING_BET_TYPES,
    "KICK": BOXING_BET_TYPES,
    
    "MMA": MMA_BET_TYPES,
    
    "F1": F1_BET_TYPES,
    "MOTO": F1_BET_TYPES,
    "NASCAR": F1_BET_TYPES,
    "INDY": F1_BET_TYPES,
    "DTCAR": F1_BET_TYPES,
    "WRC": F1_BET_TYPES,
    
    "SPWAY": SPEEDWAY_BET_TYPES,
    
    "SNOK": SNOOKER_BET_TYPES,
    "POOL": SNOOKER_BET_TYPES,
    
    "DART": DARTS_BET_TYPES,
    
    "CS2": ESPORT_FPS_BET_TYPES,
    "VALO": ESPORT_FPS_BET_TYPES,
    "COD": ESPORT_FPS_BET_TYPES,
    "R6S": ESPORT_FPS_BET_TYPES,
    "APEX": ESPORT_FPS_BET_TYPES,
    "PUBG": ESPORT_FPS_BET_TYPES,
    "FORT": ESPORT_FPS_BET_TYPES,
    "WZON": ESPORT_FPS_BET_TYPES,
    "OWAT": ESPORT_FPS_BET_TYPES,
    
    "LOL": ESPORT_MOBA_BET_TYPES,
    "DOTA": ESPORT_MOBA_BET_TYPES,
    "HOTS": ESPORT_MOBA_BET_TYPES,
    "MLBB": ESPORT_MOBA_BET_TYPES,
    "KOG": ESPORT_MOBA_BET_TYPES,
    
    "FIFA": ESPORT_FIFA_BET_TYPES,
    "RLKT": ESPORT_FIFA_BET_TYPES,
}
def seed_bet_type_dict():
    """
    Seed the database with bet types for each discipline.
    Uses update_or_create to avoid duplicates.
    """
    created_count = 0
    updated_count = 0
    skipped_count = 0

    disciplines = Discipline.objects.all()
    
    for discipline in disciplines:
        # Pobierz typy zakładów dla danej dyscypliny
        bet_types = DISCIPLINE_BET_TYPES.get(discipline.code, UNIVERSAL_BET_TYPES)
        
        print(f"\n📂 {discipline.code} - {discipline.name}:")
        
        for bet_type_data in bet_types:
            bet_type, created = BetTypeDict.objects.update_or_create(
                code=bet_type_data["code"],
                discipline=discipline,
                defaults={
                    "description": bet_type_data["description"],
                }
            )

            if created:
                created_count += 1
                print(f"   ✅ {bet_type.code}: {bet_type.description}")
            else:
                updated_count += 1
                print(f"   🔄 {bet_type.code}: {bet_type.description}")

    print(f"\n{'='*60}")
    print(f"📊 Summary:")
    print(f"   - Created: {created_count}")
    print(f"   - Updated: {updated_count}")
    print(f"   - Total bet types: {BetTypeDict.objects.count()}")
    print(f"   - Disciplines covered: {disciplines.count()}")
    print(f"{'='*60}")
if __name__ == "__main__":
    print("🚀 Seeding bet type dictionaries...")
    print("="*60)
    seed_bet_type_dict()
    print("\n✅ Done!")

