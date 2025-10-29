from django.core.management.base import BaseCommand
from coupons.models import BetTypeDict


class Command(BaseCommand):
    help = 'Seed bet types dictionary'

    def handle(self, *args, **options):
        bet_types = [
            # --- Twoje bazowe ---
            ('1', 'Win - Home Team'),
            ('X', 'Draw'),
            ('2', 'Win - Away Team'),
            ('1X', 'Home Team or Draw'),
            ('X2', 'Away Team or Draw'),
            ('12', 'Either Team Wins'),
            ('UNDER', 'Under'),
            ('OVER', 'Over'),
            ('ODD', 'Odd'),
            ('EVEN', 'Even'),
            ('BTS', 'Both Teams Score'),
            ('NBTS', 'Not Both Teams Score'),
            ('HT1', 'Home Team Over 0.5 (1st Half)'),
            ('HT2', 'Away Team Over 0.5 (1st Half)'),
            ('HTOD', 'Odd/Even (1st Half)'),
            ('CC', 'Correct Score'),
            ('DC', 'Double Chance'),
            ('HAH', 'Handicap Home'),
            ('HAA', 'Handicap Away'),
            ('ML', 'Moneyline'),
            ('PARLAYS', 'Parlay'),
            ('PROP', 'Proposition Bet'),

            # --- Piłka nożna (soccer) ---
            ('DNB', 'Draw No Bet'),
            ('HTFT', 'Half-Time / Full-Time'),
            ('H1_1X2', '1st Half Result (1X2)'),
            ('H1_OU', '1st Half Total Over/Under'),
            ('H2_1X2', '2nd Half Result (1X2)'),
            ('H2_OU', '2nd Half Total Over/Under'),
            ('AH', 'Asian Handicap'),
            ('EH_3W', 'European Handicap (3-way)'),
            ('WIN_MARGIN', 'Winning Margin (Bands)'),
            ('TEAM_OVER', 'Team Total Over (Match)'),
            ('TEAM_UNDER', 'Team Total Under (Match)'),
            ('H1_TEAM_OVER', 'Team Total Over (1st Half)'),
            ('H1_TEAM_UNDER', 'Team Total Under (1st Half)'),
            ('FTS', 'First Team To Score'),
            ('LTS', 'Last Team To Score'),
            ('WIN_TO_NIL', 'Win To Nil (Team)'),
            ('CLEAN_SHEET_Y', 'Clean Sheet – Yes (Team)'),
            ('CLEAN_SHEET_N', 'Clean Sheet – No (Team)'),
            ('BOTH_HALVES_GOAL_Y', 'Goal In Both Halves – Yes'),
            ('BOTH_HALVES_GOAL_N', 'Goal In Both Halves – No'),
            ('RES_BTS_1Y', 'Result & BTTS: Home & Yes'),
            ('RES_BTS_1N', 'Result & BTTS: Home & No'),
            ('RES_BTS_XY', 'Result & BTTS: Draw & Yes'),
            ('RES_BTS_XN', 'Result & BTTS: Draw & No'),
            ('RES_BTS_2Y', 'Result & BTTS: Away & Yes'),
            ('RES_BTS_2N', 'Result & BTTS: Away & No'),
            ('FGS', 'First Goalscorer'),
            ('AGS', 'Anytime Goalscorer'),
            ('LGS', 'Last Goalscorer'),
            ('GS_2PLUS', 'Player To Score 2+ Goals'),
            ('GS_3PLUS', 'Player To Score Hat-Trick'),
            ('CORNERS_OVER', 'Total Corners Over'),
            ('CORNERS_UNDER', 'Total Corners Under'),
            ('TEAM_CORN_OVER', 'Team Corners Over'),
            ('TEAM_CORN_UNDER', 'Team Corners Under'),
            ('CARDS_OVER', 'Total Cards Over'),
            ('CARDS_UNDER', 'Total Cards Under'),
            ('TEAM_CARD_OVER', 'Team Cards Over'),
            ('TEAM_CARD_UNDER', 'Team Cards Under'),
            ('TO_QUALIFY', 'To Qualify (incl. ET/Pens)'),

            # --- Koszykówka ---
            ('SPREAD', 'Point Spread (ATS)'),
            ('OU', 'Total Points Over/Under'),
            ('TEAM_OU', 'Team Total Points Over/Under'),
            ('RACE_TO', 'Race To X Points'),
            ('Q1_1X2', 'Q1 Result (1X2)'),
            ('Q1_OU', 'Q1 Total Points Over/Under'),
            ('HT_1X2', 'Halftime Result (1X2)'),
            ('HT_OU', 'Halftime Total Over/Under'),
            ('P_PTS_OU', 'Player Points Over/Under'),
            ('P_REB_OU', 'Player Rebounds Over/Under'),
            ('P_AST_OU', 'Player Assists Over/Under'),
            ('P_PRA_OU', 'Player PRA (Pts+Reb+Ast) Over/Under'),
            ('P_3PM_OU', 'Player 3PT Made Over/Under'),
            ('P_STL_OU', 'Player Steals Over/Under'),
            ('P_BLK_OU', 'Player Blocks Over/Under'),
            ('P_DD', 'Player Double-Double'),
            ('P_TD', 'Player Triple-Double'),

            # --- Tenis ---
            ('TEN_ML', 'Match Winner (Tennis)'),
            ('SET_BET', 'Set Betting (Correct Set Score)'),
            ('GAMES_OU', 'Total Games Over/Under'),
            ('GAMES_HCP', 'Games Handicap'),
            ('SETS_OU', 'Total Sets Over/Under'),
            ('S1_ML', 'Set 1 Winner'),
            ('S1_GAMES_OU', 'Set 1 – Total Games Over/Under'),
            ('TIEBREAK_Y', 'Tie-break in Match – Yes'),
            ('TIEBREAK_N', 'Tie-break in Match – No'),
            ('P_ACES_OU', 'Player Aces Over/Under'),
            ('P_DF_OU', 'Player Double Faults Over/Under'),
            ('P_GAMES_WON_OU', 'Player Games Won Over/Under'),
            ('PLAYER_WIN_SET', 'Player To Win A Set'),

            # --- Hokej ---
            ('REG_1X2', 'Regulation Time Result (1X2)'),
            ('PUCKLINE', 'Puck Line (±1.5)'),
            ('P_G_OU', 'Player Goals Over/Under'),
            ('P_PTS_OU_HK', 'Player Points (G+A) Over/Under'),
            ('P_SOG_OU', 'Player Shots On Goal Over/Under'),

            # --- Baseball ---
            ('RUNLINE', 'Run Line (±1.5)'),
            ('F5_ML', 'First 5 Innings Moneyline'),
            ('F5_OU', 'First 5 Innings Total Over/Under'),
            ('P_HR_Y', 'Player To Hit A Home Run – Yes'),
            ('P_HITS_OU', 'Player Hits Over/Under'),
            ('P_RBI_OU', 'Player RBIs Over/Under'),
            ('P_SO_OU', 'Pitcher Strikeouts Over/Under'),
            ('TB_OU', 'Player Total Bases Over/Under'),

            # --- American Football (NFL) ---
            ('ATD', 'Anytime Touchdown Scorer'),
            ('FTD', 'First Touchdown Scorer'),
            ('P_RUSH_YDS_OU', 'Player Rushing Yards Over/Under'),
            ('P_REC_YDS_OU', 'Player Receiving Yards Over/Under'),
            ('P_PASS_YDS_OU', 'QB Passing Yards Over/Under'),
            ('P_REC_OU', 'Player Receptions Over/Under'),
            ('FG_MADE_OU', 'Field Goals Made Over/Under (Team/Player)'),
            ('FSM', 'First Scoring Method'),

            # --- Cricket ---
            ('MATCH_RESULT', 'Match Result (Cricket)'),
            ('TO_WIN_TOSS', 'To Win The Toss'),
            ('TOP_BATSMAN', 'Top Batsman'),
            ('TOP_BOWLER', 'Top Bowler'),
            ('TOTAL_RUNS_OU', 'Total Runs Over/Under'),
            ('TEAM_RUNS_OU', 'Team Total Runs Over/Under'),
            ('MOST_SIXES', 'Most Sixes (Team)'),
            ('PLAYER_RUNS_OU', 'Player Runs Over/Under'),
            ('HOP', 'Highest Opening Partnership'),
            ('FOW_OU', 'Fall of 1st Wicket – Over/Under'),
            ('METHOD_OUT', 'Method of Dismissal'),

            # --- MMA / Boxing ---
            ('FIGHT_ML', 'Fight Winner'),
            ('METHOD', 'Method of Victory (KO/TKO/Submission/Decision)'),
            ('ROUND_GROUP', 'Round Group (e.g., 1–3, 4–6)'),
            ('TOTAL_RNDS_OU', 'Total Rounds Over/Under'),
            ('WINS_IN_RND', 'Win in Exact Round'),

            # --- Esports (LoL / CS2 / Dota2) ---
            ('MATCH_ML', 'Match Winner (Esports)'),
            ('MAP_ML', 'Map Winner'),
            ('MAP_HCP', 'Map Handicap'),
            ('MAPS_OU', 'Total Maps Over/Under'),
            ('KILLS_OU', 'Total Kills Over/Under (Map/Match)'),
            ('FIRST_BLOOD', 'First Blood'),
            ('FIRST_TOWER', 'First Tower (LoL)'),
            ('ROUNDS_OU', 'Total Rounds Over/Under (CS2)'),

            # --- Volleyball / Handball ---
            ('VOL_ML', 'Volleyball Match Winner'),
            ('VOL_SET_BET', 'Volleyball – Set Betting'),
            ('VOL_SET_HCP', 'Volleyball – Set Handicap'),
            ('VOL_POINTS_OU', 'Volleyball – Total Points Over/Under'),
            ('HAN_1X2', 'Handball Match Result (1X2)'),
            ('HAN_OU', 'Handball – Total Goals Over/Under'),
            ('HAN_TEAM_OU', 'Handball – Team Total Over/Under'),

            # --- Darts / Snooker ---
            ('DAR_ML', 'Darts Match Winner'),
            ('DAR_LEGS_OU', 'Darts – Total Legs Over/Under'),
            ('DAR_180S_OU', 'Darts – 180s Over/Under'),
            ('HIGHEST_CO_OU', 'Darts – Highest Checkout Over/Under'),
            ('SNO_ML', 'Snooker Match Winner'),
            ('SNO_FRAMES_OU', 'Snooker – Total Frames Over/Under'),
            ('SNO_CS', 'Snooker – Correct Score (Frames)'),
            ('SNO_HB_OU', 'Snooker – Highest Break Over/Under'),

            # --- Outrights / Turnieje ---
            ('OUTRIGHT_WIN', 'Outright Winner'),
            ('TOP3', 'Top 3 / Podium Finish'),
            ('TOP10', 'Top 10 Finish'),
            ('H2H_TOURN', 'Tournament Head-to-Head'),
        ]
        seen = set()
        unique_bet_types = []
        for code, description in bet_types:
            if code in seen:
                continue
            seen.add(code)
            unique_bet_types.append((code, description))

        created_count = 0
        updated_count = 0
        for code, description in unique_bet_types:
            obj, created = BetTypeDict.objects.update_or_create(
                code=code,
                defaults={'description': description}
            )
            if created:
                created_count += 1
            else:
                if obj.description != description:
                    obj.description = description
                    obj.save(update_fields=['description'])
                    updated_count += 1
                    self.stdout.write(self.style.WARNING(f' Updated bet type name: {obj.code} → {obj.description}'))
                else:
                    self.stdout.write(self.style.WARNING(f' Bet type already exists: {obj.code}'))

        self.stdout.write(self.style.SUCCESS(
            f'\n Seed completed successfully! Created: {created_count}, Updated: {updated_count}'))
