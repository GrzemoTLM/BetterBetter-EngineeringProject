import { Trophy, TrendingUp, Award } from 'lucide-react';

const TopPerformers = () => {
  const topBookmakers = [
    { name: 'Bet365', profit: '+$1,240', winRate: '68%', bets: 45 },
    { name: 'Pinnacle', profit: '+$890', winRate: '65%', bets: 32 },
    { name: 'Betfair', profit: '+$650', winRate: '62%', bets: 28 },
  ];

  const topStrategies = [
    { name: 'Progression', profit: '+$2,100', winRate: '71%', bets: 67 },
    { name: 'Value Betting', profit: '+$1,450', winRate: '64%', bets: 52 },
    { name: 'Arbitrage', profit: '+$980', winRate: '58%', bets: 38 },
  ];

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Top Bookmakers */}
      <div className="bg-background-paper rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={20} className="text-primary-main" />
          <h3 className="text-lg font-semibold text-text-primary">
            Top Bookmakers
          </h3>
        </div>
        <div className="space-y-3">
          {topBookmakers.map((bookmaker, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0
                      ? 'bg-yellow-500'
                      : index === 1
                      ? 'bg-gray-400'
                      : 'bg-amber-600'
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-text-primary">
                    {bookmaker.name}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {bookmaker.bets} bets • {bookmaker.winRate} win rate
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-status-roi-positive">
                  {bookmaker.profit}
                </div>
                <div className="text-xs text-text-secondary flex items-center gap-1">
                  <TrendingUp size={10} />
                  Profit
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Strategies */}
      <div className="bg-background-paper rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} className="text-secondary-main" />
          <h3 className="text-lg font-semibold text-text-primary">
            Top Strategies
          </h3>
        </div>
        <div className="space-y-3">
          {topStrategies.map((strategy, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0
                      ? 'bg-yellow-500'
                      : index === 1
                      ? 'bg-gray-400'
                      : 'bg-amber-600'
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-text-primary">
                    {strategy.name}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {strategy.bets} bets • {strategy.winRate} win rate
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-status-roi-positive">
                  {strategy.profit}
                </div>
                <div className="text-xs text-text-secondary flex items-center gap-1">
                  <TrendingUp size={10} />
                  Profit
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopPerformers;

