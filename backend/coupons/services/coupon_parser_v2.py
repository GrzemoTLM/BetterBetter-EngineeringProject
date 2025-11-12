import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class Bet:
    event_name: str
    start_time: Optional[str] = None
    bet_type: str = "1X2"
    line: str = "1"
    odds: str = "1.00"


@dataclass
class CouponInput:
    bookmaker_account: int
    coupon_type: str = "SOLO"
    bet_stake: str = "0.00"
    placed_at: Optional[str] = None
    bets: List[Bet] = None
    
    def __post_init__(self):
        if self.bets is None:
            self.bets = []
    
    def to_dict(self):
        return {
            "bookmaker_account": self.bookmaker_account,
            "coupon_type": self.coupon_type,
            "bet_stake": self.bet_stake,
            "placed_at": self.placed_at,
            "bets": [asdict(bet) for bet in self.bets]
        }


class CouponParserV2:

    def __init__(self):
        self.text_lines = []
        self.parsed_data = {}
    
    def parse(self, ocr_text: str, bookmaker_account: int = 1) -> CouponInput:
        self.text_lines = [line.strip() for line in ocr_text.split('\n') if line.strip()]
        self.parsed_data = {}
        
        self._extract_dates_and_times()
        self._extract_bets_and_odds()
        self._extract_stake()
        self._extract_coupon_type()
        
        coupon = CouponInput(
            bookmaker_account=bookmaker_account,
            coupon_type=self.parsed_data.get('coupon_type', 'SOLO'),
            bet_stake=self.parsed_data.get('bet_stake', '0.00'),
            placed_at=self.parsed_data.get('placed_at'),
            bets=self.parsed_data.get('bets', [])
        )
        
        return coupon
    
    def _extract_dates_and_times(self):
        dates = []
        times = []
        
        for line in self.text_lines:
            date_match = re.search(r'(\d{1,2}[./]\d{1,2}[./]\d{4})', line)
            if date_match:
                dates.append(date_match.group(1))
            
            time_match = re.search(r'(\d{1,2}:\d{2})', line)
            if time_match:
                times.append(time_match.group(1))
        
        self.parsed_data['dates'] = dates
        self.parsed_data['times'] = times
        
        if dates and times:
            date_str = dates[0]
            time_str = times[0]
            self.parsed_data['placed_at'] = self._format_datetime(date_str, time_str)
    
    def _extract_bets_and_odds(self):
        bets = []
        processed_indices = set()

        for i, line in enumerate(self.text_lines):
            if i in processed_indices:
                continue

            if ' - ' in line:
                odds = "1.00"

                parts = line.split(' - ')

                if len(parts) >= 2:
                    team1 = parts[-2].strip()
                    team2 = parts[-1].strip()
                    event_name = f"{team1} - {team2}"

                    team1_clean = re.sub(r'^\d+\s+', '', team1)
                    team1_clean = re.sub(r'^\w+\s+kurs:\s+\d+\s+', '', team1_clean, flags=re.IGNORECASE)
                    team1_clean = re.sub(r'^\w+\s+', '', team1_clean).strip()

                    if team1_clean:
                        event_name = f"{team1_clean} - {team2}"

                    odds_match = re.search(r'(\d+\.\d{2})', line)
                    if odds_match:
                        odds_str = odds_match.group(1)
                        if float(odds_str) < 1.0 or float(odds_str) > 100.0:
                            odds = "1.00"
                        else:
                            odds = odds_str

                if odds == "1.00":
                    for j in range(i+1, min(i+4, len(self.text_lines))):
                        next_line = self.text_lines[j].strip()
                        if re.match(r'^\d+\.\d{2}$', next_line):
                            odds = next_line
                            processed_indices.add(j)
                            break

                bets.append(Bet(
                    event_name=event_name,
                    odds=odds,
                    bet_type="1X2"
                ))
                processed_indices.add(i)

        self.parsed_data['bets'] = bets
    
    def _extract_stake(self):
        for i, line in enumerate(self.text_lines):
            if 'Stawka' in line:
                match = re.search(r'(\d+[.,]\d+)', line)
                if match:
                    amount = match.group(1).replace(',', '.')
                    self.parsed_data['bet_stake'] = f"{float(amount):.2f}"
                    return
                
                for j in range(i+1, min(i+5, len(self.text_lines))):
                    next_line = self.text_lines[j].strip()
                    if re.match(r'^\d+[.,]\d+$', next_line):
                        amount = next_line.replace(',', '.')
                        self.parsed_data['bet_stake'] = f"{float(amount):.2f}"
                        return
        
        for line in self.text_lines:
            match = re.search(r'(\d+[.,]\d+)', line)
            if match:
                amount = float(match.group(1).replace(',', '.'))
                if 0.5 <= amount <= 100000:
                    self.parsed_data['bet_stake'] = f"{amount:.2f}"
                    return
        
        self.parsed_data['bet_stake'] = "0.00"
    
    def _extract_coupon_type(self):
        text_combined = ' '.join(self.text_lines).upper()

        if any(kw in text_combined for kw in ['AKO', '2UP', '3UP', '4UP', 'MULTIPLE']):
            self.parsed_data['coupon_type'] = 'AKO'
        else:
            self.parsed_data['coupon_type'] = 'SOLO'
    
    def _format_datetime(self, date_str: str, time_str: str) -> str:
        try:
            parts = date_str.replace('/', '.').split('.')
            day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
            
            time_parts = time_str.split(':')
            hour, minute = int(time_parts[0]), int(time_parts[1])
            
            dt = datetime(year, month, day, hour, minute, 0)
            
            return dt.isoformat() + '+01:00'
        except Exception as e:
            print(f"Błąd parsowania daty: {e}")
            return None


CouponParser = CouponParserV2


