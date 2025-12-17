import type { OcrExtractResponse } from '../types/coupons';

export interface ParsedOcrBet {
  event_name: string;
  bet_type: string;
  line: string;
  odds: string;
}

export function parseOcrToBets(ocr: OcrExtractResponse): ParsedOcrBet[] {
  const text = (ocr as any).detailed_result?.text ?? (ocr as any).raw_text ?? '';
  const lines = text
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  const bets: ParsedOcrBet[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('-')) {
      const eventLine = line;

      let betTypeLineIndex = -1;
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (/Wynik meczu/i.test(lines[j])) {
          betTypeLineIndex = j;
          break;
        }
      }

      if (betTypeLineIndex !== -1) {
        const betTypeLine = lines[betTypeLineIndex];
        const match = betTypeLine.match(/Wynik meczu:\s*(\S+)/i);
        const lineValue = match?.[1] ?? '';

        let odds = '';
        for (let k = betTypeLineIndex + 1; k < Math.min(betTypeLineIndex + 6, lines.length); k++) {
          const oddsMatch = lines[k].match(/^\d+([.,]\d+)?$/);
          if (oddsMatch) {
            odds = oddsMatch[0].replace(',', '.');
            break;
          }
        }

        bets.push({
          event_name: eventLine,
          bet_type: '1X2',
          line: lineValue || '1',
          odds: odds || '1.00',
        });

        break;
      }
    }
  }

  return bets;
}

