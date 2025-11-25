const SummaryBox = () => {
  const totalMultiplier = '45x';
  const toWin = '554$';

  return (
    <div className="rounded-xl overflow-hidden shadow-md w-full">
      {/* Upper Half - Dark Background */}
      <div className="bg-slate-800 text-white px-6 py-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-300">
            TOTAL MULTIPLIER
          </span>
          <span className="text-2xl font-bold">{totalMultiplier}</span>
        </div>
      </div>

      {/* Lower Half - Green Background */}
      <div className="bg-emerald-500 text-white px-6 py-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">To win</span>
          <span className="text-2xl font-bold">{toWin}</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryBox;

