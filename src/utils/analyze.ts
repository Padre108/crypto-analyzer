import { TradeResult, PriceData } from "@/types/types";

export function findBestTradeKadane(prices: PriceData[]): TradeResult {
  if (prices.length < 2) throw new Error("Need at least 2 data points");
  
  // Calculate daily price differences
  const diffs = prices.slice(1).map((p, i) => p.price - prices[i].price);
  
  //  Kadane's algorithm to find maximum subarray sum
  let maxProfit = 0; // Start with 0 -cause you  don't trade if no profit possible
  let currentProfit = 0;
  let start = 0;
  let tempStart = 0;
  let end = 0;
  
  for (let i = 0; i < diffs.length; i++) {
    if (currentProfit + diffs[i] < diffs[i]) {
      currentProfit = diffs[i];
      tempStart = i;
    } else {
      currentProfit += diffs[i];
    }
    
    if (currentProfit > maxProfit) {
      maxProfit = currentProfit;
      start = tempStart;
      end = i + 1; // +1 because diffs is offset by 1 from prices
    }
  }
  
  // Handle case where no profitable trade exists
  if (maxProfit <= 0) {
    return {
      buyDate: prices[0].date,
      sellDate: prices[0].date,
      currentProfit: 0,
      maxProfit: 0,
      buyPrice: prices[0].price,
      sellPrice: prices[0].price,
      totalPossibleProfit: 0,
      profitHistory: prices.map((p) => ({
        date: p.date,
        profit: 0,
      })),
    };
  }
  
  // Calculate profit history based on final buy/sell points
  const buyPrice = prices[start].price;
  const profitHistory = prices.map((p, i) => ({
    date: p.date,
    profit: i <= start ? 0 : Math.max(0, p.price - buyPrice),
  }));
  
  return {
    buyDate: prices[start].date,
    sellDate: prices[end].date,
    currentProfit: maxProfit, // Use maxProfit as final current profit since this is a Spot trading
    maxProfit,
    buyPrice: prices[start].price,
    sellPrice: prices[end].price,
    totalPossibleProfit: maxProfit,
    profitHistory,
  };
}


export async function getHistoricalPrices(symbol: string): Promise<PriceData[]> {
  try {
    // fetch historical price data from Bybit API
    const publicResponse = await fetch(
      `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=D&limit=30`
    );
    const response = await publicResponse.json();

    // Convert and sort by date (oldest first)
    return response.result.list
      .map((candle: string[]) => ({
        date: new Date(parseInt(candle[0])), // Converts timestamp to Date
        price: parseFloat(candle[4]), // Closing price of the candle
      }))
      .sort((a: PriceData, b: PriceData) => a.date.getTime() - b.date.getTime()); // Sort chronologically
  } catch (error) {
    console.error("API error:", error);
    return [];
  }
}