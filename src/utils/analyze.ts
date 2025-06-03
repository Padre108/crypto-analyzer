import { client } from "../lib/bybit";

import { TradeResult, PriceData } from "@/types/index.types";

export function findBestTradeKadane(prices: PriceData[]): TradeResult {
  if (prices.length < 2) throw new Error("Need at least 2 data points");

  const priceDifferences = prices.map((_, i) => {
    if (i === 0) return 0;
    return prices[i].price - prices[i - 1].price;
  });

  let maxProfit = 0;
  let currentProfit = 0;
  let buyIndex = 0;
  let sellIndex = 0;
  let tempBuyIndex = 0;

  const profitHistory: { date: Date; profit: number }[] = [{
    date: prices[0].date,
    profit: 0,
  }];

  for (let i = 1; i < priceDifferences.length; i++) {
    // Adjust currentProfit to reflect actual spot trading logic
    currentProfit = Math.max(0, prices[i].price - prices[tempBuyIndex].price);

    // Track profit history
    profitHistory.push({
      date: prices[i].date,
      profit: currentProfit,
    });

    if (currentProfit > maxProfit) {
      maxProfit = currentProfit;
      buyIndex = tempBuyIndex;
      sellIndex = i;
    }

    if (currentProfit < 0) {
      currentProfit = 0;
      tempBuyIndex = i;
    }

    console.log(`Current Profit at index ${i}:`, currentProfit);
    console.log(`Max Profit so far:`, maxProfit);
  }
  console.log("Price Differences:", priceDifferences);
  console.log("Max Profit:", maxProfit);
  console.log("Total Possible Profit:", maxProfit);

  return {
    buyDate: prices[buyIndex].date,
    sellDate: prices[sellIndex].date,
    currentProfit,
    maxProfit,
    buyPrice: prices[buyIndex].price,
    sellPrice: prices[sellIndex].price,
    totalPossibleProfit: maxProfit, // Kadane's algorithm focuses on max profit
    profitHistory, // Include profit history in the result
  };
}

export async function getHistoricalPrices(symbol: string): Promise<PriceData[]> {
  try {
    let response;

    // Try authenticated API first if keys exist
    if (process.env.NEXT_PUBLIC_BYBIT_API_KEY) {
      response = await client.getKline({
        category: "spot",
        symbol,
        interval: "D",
        limit: 30,
      });
    } else {
      // Fallback to public API
      const publicResponse = await fetch(
        `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=D&limit=30`
      );
      response = await publicResponse.json();
    }

    // Convert and sort by date (oldest first)
    return response.result.list
      .map((candle: string[]) => ({
        date: new Date(parseInt(candle[0])), // Convert timestamp to Date
        price: parseFloat(candle[4]), // Closing price
      }))
      .sort((a: PriceData, b: PriceData) => a.date.getTime() - b.date.getTime()); // Sort chronologically
  } catch (error) {
    console.error("API error:", error);
    return [];
  }
}