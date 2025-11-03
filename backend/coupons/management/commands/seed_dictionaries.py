from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.apps import apps as django_apps


def pick_model(candidates):
    for app_label, model_name in candidates:
        try:
            return django_apps.get_model(app_label, model_name)
        except LookupError:
            continue
    raise CommandError(f"No model found from candidates: {candidates}")


def field_names(model):
    return {f.name for f in model._meta.get_fields()}


def filter_defaults(model, data):
    allowed = field_names(model)
    return {k: v for k, v in data.items() if k in allowed}


class Command(BaseCommand):
    help = "Seeds currencies, disciplines (sports), and bet types dictionaries."

    def add_arguments(self, parser):
        parser.add_argument(
            "--only",
            type=str,
            help="Comma-separated subset: currencies,sports,bettypes (default: all)",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        subsets = None
        if options.get("only"):
            subsets = {s.strip().lower() for s in options["only"].split(",")}

        Currency = pick_model([
            ("coupons", "Currency"),
            ("common", "Currency"),
            ("dictionaries", "Currency"),
        ])
        Sport = pick_model([
            ("coupons", "Discipline"),
            ("dictionaries", "Sport"),
            ("common", "Sport"),
        ])
        BetType = pick_model([
            ("coupons", "BetTypeDict"),
            ("dictionaries", "BetType"),
            ("bets", "BetType"),
            ("common", "BetType"),
        ])

        currency_fields = field_names(Currency)
        sport_fields = field_names(Sport)
        bettype_fields = field_names(BetType)

        currencies = [
            ("USD", "US Dollar", "$", 2),
            ("EUR", "Euro", "€", 2),
            ("PLN", "Polish Zloty", "zł", 2),
            ("GBP", "British Pound", "£", 2),
            ("CHF", "Swiss Franc", "CHF", 2),
            ("JPY", "Japanese Yen", "¥", 0),
            ("CNY", "Chinese Yuan", "¥", 2),
            ("AUD", "Australian Dollar", "$", 2),
            ("NZD", "New Zealand Dollar", "$", 2),
            ("CAD", "Canadian Dollar", "$", 2),
            ("SEK", "Swedish Krona", "kr", 2),
            ("NOK", "Norwegian Krone", "kr", 2),
            ("DKK", "Danish Krone", "kr", 2),
            ("CZK", "Czech Koruna", "Kč", 2),
            ("HUF", "Hungarian Forint", "Ft", 0),
            ("RON", "Romanian Leu", "lei", 2),
            ("BGN", "Bulgarian Lev", "лв", 2),
            ("HRK", "Croatian Kuna", "kn", 2),
            ("RSD", "Serbian Dinar", "дин", 2),
            ("TRY", "Turkish Lira", "₺", 2),
            ("UAH", "Ukrainian Hryvnia", "₴", 2),
            ("RUB", "Russian Ruble", "₽", 2),
            ("ZAR", "South African Rand", "R", 2),
            ("BRL", "Brazilian Real", "R$", 2),
            ("ARS", "Argentine Peso", "$", 2),
            ("MXN", "Mexican Peso", "$", 2),
            ("CLP", "Chilean Peso", "$", 0),
            ("COP", "Colombian Peso", "$", 2),
            ("PEN", "Peruvian Sol", "S/.", 2),
            ("UYU", "Uruguayan Peso", "$U", 2),
            ("BOB", "Bolivian Boliviano", "Bs.", 2),
            ("INR", "Indian Rupee", "₹", 2),
            ("IDR", "Indonesian Rupiah", "Rp", 0),
            ("MYR", "Malaysian Ringgit", "RM", 2),
            ("SGD", "Singapore Dollar", "$", 2),
            ("HKD", "Hong Kong Dollar", "$", 2),
            ("KRW", "South Korean Won", "₩", 0),
            ("TWD", "New Taiwan Dollar", "NT$", 2),
            ("PHP", "Philippine Peso", "₱", 2),
            ("THB", "Thai Baht", "฿", 2),
            ("AED", "UAE Dirham", "د.إ", 2),
            ("SAR", "Saudi Riyal", "﷼", 2),
            ("QAR", "Qatari Riyal", "﷼", 2),
            ("KWD", "Kuwaiti Dinar", "د.ك", 3),
            ("BHD", "Bahraini Dinar", "ب.د", 3),
            ("OMR", "Omani Rial", "ر.ع.", 3),
            ("EGP", "Egyptian Pound", "£", 2),
            ("MAD", "Moroccan Dirham", "د.م.", 2),
            ("NGN", "Nigerian Naira", "₦", 2),
            ("KES", "Kenyan Shilling", "KSh", 2),
            ("GHS", "Ghanaian Cedi", "₵", 2),
            ("TZS", "Tanzanian Shilling", "TSh", 2),
            ("VND", "Vietnamese Dong", "₫", 0),
            ("ILS", "Israeli New Shekel", "₪", 2),
            ("PKR", "Pakistani Rupee", "₨", 2),
            ("BDT", "Bangladeshi Taka", "৳", 2),
            ("LKR", "Sri Lankan Rupee", "Rs", 2),
            ("NPR", "Nepalese Rupee", "Rs", 2),
            ("IRR", "Iranian Rial", "﷼", 0),
            ("IQD", "Iraqi Dinar", "ع.د", 3),
            ("DZD", "Algerian Dinar", "د.ج", 2),
            ("ETB", "Ethiopian Birr", "Br", 2),
        ]

        sports = [
            ("SOCCER", "Football / Soccer", "team_sport"),
            ("BASKETBALL", "Basketball", "team_sport"),
            ("TENNIS", "Tennis", "racket_sport"),
            ("VOLLEYBALL", "Volleyball", "team_sport"),
            ("ICE_HOCKEY", "Ice Hockey", "team_sport"),
            ("BASEBALL", "Baseball", "team_sport"),
            ("AMERICAN_FOOTBALL", "American Football (NFL/NCAAF)", "team_sport"),
            ("HANDBALL", "Handball", "team_sport"),
            ("RUGBY_UNION", "Rugby Union", "team_sport"),
            ("RUGBY_LEAGUE", "Rugby League", "team_sport"),
            ("CRICKET", "Cricket", "team_sport"),
            ("BOXING", "Boxing", "combat_sport"),
            ("MMA", "MMA", "combat_sport"),
            ("ESPORTS_CS", "eSports - Counter-Strike", "esport"),
            ("ESPORTS_LOL", "eSports - League of Legends", "esport"),
            ("ESPORTS_DOTA2", "eSports - Dota 2", "esport"),
            ("FUTSAL", "Futsal", "team_sport"),
            ("TABLE_TENNIS", "Table Tennis", "racket_sport"),
            ("BADMINTON", "Badminton", "racket_sport"),
            ("SNOOKER", "Snooker", "cue_sport"),
            ("DARTS", "Darts", "precision_sport"),
            ("CYCLING", "Cycling", "endurance"),
            ("F1", "Formula 1 / Motorsports", "motorsport"),
            ("NASCAR", "NASCAR", "motorsport"),
            ("MOTORCYCLE", "MotoGP / Motorcycling", "motorsport"),
            ("WATER_POLO", "Water Polo", "team_sport"),
            ("FIELD_HOCKEY", "Field Hockey", "team_sport"),
            ("BEACH_VOLLEY", "Beach Volleyball", "team_sport"),
            ("ALPINE_SKIING", "Alpine Skiing", "endurance"),
            ("BIATHLON", "Biathlon", "endurance"),
            ("SKI_JUMPING", "Ski Jumping", "endurance"),
            ("ATHLETICS", "Athletics / Track & Field", "endurance"),
            ("GOLF", "Golf", "precision_sport"),
            ("RINK_HOCKEY", "Rink Hockey", "team_sport"),
            ("AUSSIE_RULES", "Australian Rules", "team_sport"),
            ("GAELIC_FOOTBALL", "Gaelic Football", "team_sport"),
            ("HURLING", "Hurling", "team_sport"),
            ("BOX_LACROSSE", "Lacrosse", "team_sport"),
            ("SQUASH", "Squash", "racket_sport"),
            ("RACKETLON", "Racketlon", "racket_sport"),
            ("BOWLS", "Bowls", "precision_sport"),
            ("KABADDI", "Kabaddi", "team_sport"),
            ("PESAPALLO", "Pesäpallo", "team_sport"),
            ("BANDY", "Bandy", "team_sport"),
            ("NETBALL", "Netball", "team_sport"),
            ("PES", "Pro Evo / Virtual Football", "esport"),
            ("VIRTUALS", "Virtual Sports (generic)", "esport"),
            ("ROWING", "Rowing", "endurance"),
            ("CANOE_SPRINT", "Canoe Sprint", "endurance"),
            ("SURFING", "Surfing", "endurance"),
            ("SPEEDWAY", "Speedway", "motorsport"),
            ("CLIMBING", "Sport Climbing", "endurance"),
            ("WEIGHTLIFTING", "Weightlifting", "other"),
            ("WRESTLING", "Wrestling", "combat_sport"),
            ("TAEKWONDO", "Taekwondo", "combat_sport"),
            ("JUDO", "Judo", "combat_sport"),
            ("SUMO", "Sumo", "combat_sport"),
            ("FENCING", "Fencing", "combat_sport"),
            ("CHESS", "Chess", "other"),
        ]

        global_bettypes = [
            ("1X2", "1X2 (Home/Draw/Away)"),
            ("ML", "Moneyline / 2-way"),
            ("SPREAD", "Spread / Handicap"),
            ("AH", "Asian Handicap"),
            ("OU", "Over/Under (Totals)"),
            ("DNB", "Draw No Bet"),
            ("DC", "Double Chance"),
            ("CS", "Correct Score"),
            ("HTFT", "Half Time / Full Time"),
            ("TO_QUALIFY", "To Qualify / Advance"),
            ("WIN_MARGIN", "Winning Margin Bands"),
            ("1ST_SCORE", "First Team to Score"),
            ("ODD_EVEN", "Odd / Even Total"),
            ("TEAM_TOTALS", "Team Totals"),
            ("BTS", "Both Teams to Score (BTTS)"),
            ("BTS_AND_RESULT", "BTTS & Result"),
            ("CLEAN_SHEET", "Clean Sheet / Win to Nil"),
            ("TO_WIN_OT", "To Win in OT/Extra Time"),
            ("ANYTIME_SCORER", "Anytime Scorer (player)"),
            ("FIRST_SCORER", "First Scorer (player)"),
            ("LAST_SCORER", "Last Scorer (player)"),
        ]

        per_sport = {
            "SOCCER": [
                ("CORNERS_OU", "Corners Over/Under"),
                ("CARDS_OU", "Cards Over/Under"),
                ("PENALTY_YN", "Penalty Awarded Yes/No"),
                ("RED_CARD_YN", "Red Card Yes/No"),
                ("OFFSIDES_OU", "Offsides Over/Under"),
                ("BTS_2PLUS", "Both Teams 2+ Goals"),
                ("PLAYER_SOT_OU", "Player Shots on Target O/U"),
            ],
            "BASKETBALL": [
                ("Q_ML", "Quarter Winner (ML)"),
                ("H_ML", "Half Winner (ML)"),
                ("PLAYER_PTS", "Player Points O/U"),
                ("PLAYER_AST", "Player Assists O/U"),
                ("PLAYER_REB", "Player Rebounds O/U"),
                ("PLAYER_3PM", "Player 3-Pointers Made O/U"),
                ("DOUBLE_DOUBLE", "Player Double-Double"),
                ("TRIPLE_DOUBLE", "Player Triple-Double"),
                ("RACE_TO_N", "Race to N Points"),
            ],
            "TENNIS": [
                ("MATCH_WINNER", "Match Winner"),
                ("SET_HCP", "Set Handicap"),
                ("GAMES_HCP", "Games Handicap"),
                ("TOTAL_GAMES", "Total Games O/U"),
                ("CORRECT_SET", "Correct Set Score"),
                ("TIEBREAK_YN", "Tie-break in Match Yes/No"),
                ("PLAYER_WIN_SET", "Player to Win a Set"),
                ("ACES_OU", "Aces Over/Under"),
                ("DF_OU", "Double Faults Over/Under"),
            ],
            "VOLLEYBALL": [
                ("MATCH_WINNER", "Match Winner"),
                ("SET_HCP", "Set Handicap"),
                ("TOTAL_POINTS", "Total Points O/U"),
                ("TOTAL_SETS", "Total Sets O/U"),
                ("CORRECT_SET", "Correct Set Score"),
                ("RACE_TO_25", "Race to 25 Points"),
            ],
            "ICE_HOCKEY": [
                ("3WAY_ML", "Moneyline 3-way (regulation)"),
                ("ML_OT", "Moneyline incl. OT/SO"),
                ("PUCKLINE", "Puck Line (-1.5/+1.5)"),
                ("TOTAL_GOALS", "Total Goals O/U"),
                ("PLAYER_POINTS", "Player Points O/U"),
                ("PLAYER_SOG", "Player Shots on Goal O/U"),
                ("TEAM_TOTALS", "Team Totals"),
                ("WIN_REG", "To Win in Regulation"),
            ],
            "BASEBALL": [
                ("ML", "Moneyline"),
                ("RUN_LINE", "Run Line (-1.5/+1.5)"),
                ("TOTAL_RUNS", "Total Runs O/U"),
                ("F5_ML", "First 5 Innings Moneyline"),
                ("PITCHER_SO", "Pitcher Strikeouts O/U"),
                ("PLAYER_HITS", "Player Hits O/U"),
                ("TOTAL_BASES", "Player Total Bases O/U"),
                ("HR_YN", "Home Run Yes/No"),
            ],
            "AMERICAN_FOOTBALL": [
                ("SPREAD", "Point Spread"),
                ("TOTAL_POINTS", "Total Points O/U"),
                ("ANYTIME_TD", "Anytime TD Scorer"),
                ("PASS_YDS", "QB Passing Yards O/U"),
                ("RUSH_YDS", "Rushing Yards O/U"),
                ("REC_YDS", "Receiving Yards O/U"),
                ("FG_MADE", "Field Goals Made O/U"),
                ("TEAM_TOTALS", "Team Totals"),
                ("TOTAL_SACKS", "Total Sacks O/U"),
                ("RACE_TO_10", "Race to 10 Points"),
            ],
            "MMA": [
                ("FIGHT_WINNER", "Fight Winner"),
                ("METHOD", "Method of Victory"),
                ("ROUND_BET", "Round Betting"),
                ("GO_DISTANCE", "Go the Distance Y/N"),
                ("TOTAL_ROUNDS", "Total Rounds O/U"),
            ],
            "BOXING": [
                ("FIGHT_WINNER", "Fight Winner"),
                ("METHOD", "Method of Victory"),
                ("ROUND_GROUP", "Round Group Betting"),
                ("TOTAL_ROUNDS", "Total Rounds O/U"),
            ],
            "HANDBALL": [
                ("ML", "Moneyline"),
                ("HANDICAP", "Handicap"),
                ("TOTAL_GOALS", "Total Goals O/U"),
                ("WIN_MARGIN", "Winning Margin Bands"),
                ("TEAM_TOTALS", "Team Totals"),
            ],
            "CRICKET": [
                ("MATCH_WINNER", "Match Winner"),
                ("TOTAL_RUNS", "Total Runs O/U"),
                ("TOP_BATSMAN", "Top Batsman"),
                ("TOP_BOWLER", "Top Bowler"),
                ("TOTAL_6S", "Total Sixes O/U"),
                ("WICKETS_OU", "Wickets Over/Under"),
            ],
            "RUGBY_UNION": [
                ("ML", "Moneyline"),
                ("HANDICAP", "Handicap"),
                ("TOTAL_POINTS", "Total Points O/U"),
                ("TRY_SCORER", "Anytime Try Scorer"),
                ("WIN_MARGIN", "Winning Margin Bands"),
            ],
            "ESPORTS_CS": [
                ("MATCH_WINNER", "Match Winner"),
                ("MAP_WINNER", "Map Winner"),
                ("MAP_HCP", "Map Handicap"),
                ("TOTAL_MAPS", "Total Maps O/U"),
                ("TOTAL_RNDS", "Total Rounds O/U"),
                ("PISTOL_WINNER", "Pistol Round Winner"),
            ],
            "ESPORTS_LOL": [
                ("MATCH_WINNER", "Match Winner"),
                ("MAP_HANDICAP", "Map Handicap"),
                ("FIRST_BLOOD", "First Blood"),
                ("FIRST_TOWER", "First Tower"),
                ("TOTAL_KILLS", "Total Kills O/U"),
                ("TOTAL_MAPS", "Total Maps O/U"),
            ],
            "ESPORTS_DOTA2": [
                ("MATCH_WINNER", "Match Winner"),
                ("MAP_HANDICAP", "Map Handicap"),
                ("TOTAL_MAPS", "Total Maps O/U"),
                ("FIRST_ROSHAN", "First Roshan"),
                ("TOTAL_KILLS", "Total Kills O/U"),
            ],
            "SNOOKER": [
                ("MATCH_WINNER", "Match Winner"),
                ("FRAME_HCP", "Frame Handicap"),
                ("TOTAL_FRAMES", "Total Frames O/U"),
                ("CENTURY_YN", "Century Break Yes/No"),
            ],
            "DARTS": [
                ("MATCH_WINNER", "Match Winner"),
                ("HANDICAP", "Legs/Sets Handicap"),
                ("TOTAL_180S", "Total 180s O/U"),
                ("CHECKOUT_OU", "Highest Checkout O/U"),
            ],
            "F1": [
                ("RACE_WINNER", "Race Winner"),
                ("PODIUM", "Podium Finish"),
                ("FASTEST_LAP", "Fastest Lap"),
                ("HEAD_TO_HEAD", "Head-to-Head Driver"),
                ("POLE_POSITION", "Pole Position"),
            ],
        }

        created_counts = {"currencies": 0, "sports": 0, "bettypes": 0}
        updated_counts = {"currencies": 0, "sports": 0, "bettypes": 0}

        def upsert(model, lookup, defaults):
            return model.objects.update_or_create(defaults=defaults, **lookup)

        if subsets is None or "currencies" in subsets:
            for code, name, symbol, minor_unit in currencies:
                defaults = {"name": name}
                if "symbol" in currency_fields and symbol is not None:
                    defaults["symbol"] = symbol
                if "value" in currency_fields:
                    defaults.setdefault("value", Decimal("1.00"))
                if "is_active" in currency_fields:
                    defaults.setdefault("is_active", True)
                _obj, created = upsert(Currency, {"code": code}, filter_defaults(Currency, defaults))
                created_counts["currencies"] += int(created)
                updated_counts["currencies"] += int(not created)

        sport_cache = {}
        if subsets is None or "sports" in subsets:
            for code, name, category in sports:
                real_code = (code or "").upper()[:12]
                defaults = {"name": name}
                if "category" in sport_fields:
                    defaults["category"] = category
                if "is_active" in sport_fields:
                    defaults.setdefault("is_active", True)
                _obj, created = upsert(Sport, {"code": real_code}, filter_defaults(Sport, defaults))
                created_counts["sports"] += int(created)
                updated_counts["sports"] += int(not created)

        for code, _name, _category in sports:
            try:
                sport_cache[code] = Sport.objects.get(code=(code or "").upper()[:12])
            except Sport.DoesNotExist:
                pass

        if subsets is None or "bettypes" in subsets:
            # global
            for code, name in global_bettypes:
                defaults = {}
                if "description" in bettype_fields:
                    defaults["description"] = name
                elif "name" in bettype_fields:
                    defaults["name"] = name
                lookup = {"code": code}
                _obj, created = upsert(BetType, lookup, filter_defaults(BetType, defaults))
                created_counts["bettypes"] += int(created)
                updated_counts["bettypes"] += int(not created)

            # per sport
            for sport_code, items in per_sport.items():
                sport_obj = sport_cache.get(sport_code)
                for code, name in items:
                    defaults = {}
                    if "description" in bettype_fields:
                        defaults["description"] = name
                    elif "name" in bettype_fields:
                        defaults["name"] = name
                    lookup = {}
                    if "sport" in bettype_fields:
                        lookup = {"code": code, "sport": sport_obj}
                    else:
                        lookup = {"code": f"{sport_code}:{code}"}
                    _obj, created = upsert(BetType, lookup, filter_defaults(BetType, defaults))
                    created_counts["bettypes"] += int(created)
                    updated_counts["bettypes"] += int(not created)

        self.stdout.write(self.style.SUCCESS("Seeding finished."))
        for k in ["currencies", "sports", "bettypes"]:
            self.stdout.write(f"{k}: created={created_counts[k]}, updated={updated_counts[k]}")
