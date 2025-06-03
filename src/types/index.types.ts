export interface PriceData {
  date: Date;
  price: number;
}

export interface TradeResult {
  buyDate: Date;      // Date of best day to buy
  sellDate: Date;     // Date of best day to sell
  maxProfit: number;  // Profit (sellPrice - buyPrice)
  currentProfit: number; // Current profit at the end of the analysis
  buyPrice: number;   // Price at which to buy
  sellPrice: number;  // Price at which to sell
  totalPossibleProfit: number; // Total profit from all positive trades
  profitHistory: { date: Date; profit: number }[]; // Array to store intermediate profits
}

export type SymbolPair = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'XRPUSDT' |  'DOGEUSDT' | 'DOTUSDT' | 'LINKUSDT' | 'MATICUSDT' ;