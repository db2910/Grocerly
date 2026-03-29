'use client';

interface MarketFilterProps {
  markets: string[];
  selectedMarket: string | null;
  onSelectMarket: (market: string | null) => void;
}

export function MarketFilter({ markets, selectedMarket, onSelectMarket }: MarketFilterProps) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Market Location</h3>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSelectMarket(null)}
          className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
            selectedMarket === null
              ? "border border-primary/40 bg-primary/5 shadow-sm text-primary"
              : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/40 text-slate-700 dark:text-slate-300"
          }`}
        >
          <span>All Markets</span>
          <span className={`material-symbols-outlined text-lg ${selectedMarket === null ? "text-primary" : "text-slate-300"}`}>
            {selectedMarket === null ? "radio_button_checked" : "radio_button_unchecked"}
          </span>
        </button>
        {markets.map(market => (
          <button
            key={market}
            onClick={() => onSelectMarket(market)}
            className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
              selectedMarket === market
                ? "border border-primary/40 bg-primary/5 shadow-sm text-primary"
                : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/40 text-slate-700 dark:text-slate-300"
            }`}
          >
            <span>{market}</span>
            <span className={`material-symbols-outlined text-lg ${selectedMarket === market ? "text-primary" : "text-slate-300"}`}>
              {selectedMarket === market ? "radio_button_checked" : "radio_button_unchecked"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
