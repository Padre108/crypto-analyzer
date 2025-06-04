"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { findBestTradeKadane, getHistoricalPrices } from "../../utils/analyze";
import { TradeResult, PriceData } from "@/types/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyzePageContent />
    </Suspense>
  );
}

function AnalyzePageContent() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol") || "ETHUSDT";
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [trade, setTrade] = useState<TradeResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const prices = await getHistoricalPrices(symbol);

        if (prices.length === 0) {
          throw new Error("No price data received");
        }

        setPriceData(prices);
        setTrade(findBestTradeKadane(prices));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  const handleAnalyze = () => {
    if (budget !== null) {
      const result = findBestTradeKadane(priceData);

      if (result) {
        // Calculate the amount of cryptocurrency that can be bought with the certain budget
        const amountBought = budget / result.buyPrice;

        // Calculate the profit based on the amount bought and the sell price
        result.totalPossibleProfit = amountBought * result.sellPrice - budget;
      }

      setTrade(result);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!trade || priceData.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No trading data available
        </div>
      </div>
    );
  }

  //profit history data
  const profitHistoryData = {
    labels: trade.profitHistory.map((entry) => entry.date.toLocaleDateString()),
    datasets: [
      {
        label: "Profit History (Based on Budget)",
        data: trade.profitHistory.map((entry) => {
          if (budget !== null) {
            const amountBought = budget / trade.buyPrice;
            return amountBought * entry.profit;
          }
          return entry.profit;
        }),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 align-left">
        <button
          onClick={() => window.history.back()}
          className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition"
        >
          Back to Home
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">{symbol} Analysis</h1>

      <div className="mb-6 p-4 bg-black rounded-lg">
        <p>
          Buy 1 currency on {trade.buyDate.toLocaleDateString()} (Price: $
          {trade.buyPrice.toFixed(2)})
        </p>
        <p>
          Sell 1 currency on {trade.sellDate.toLocaleDateString()} (Price: $
          {trade.sellPrice.toFixed(2)})
        </p>
        <p className="font-bold">Max Profit: ${trade.maxProfit.toFixed(2)}</p>
        <p className="font-bold">
          Current Profit: ${trade.currentProfit.toFixed(2)}
        </p>
      </div>

      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Total Possible Profit</h2>
        <p className="text-xl">${trade.totalPossibleProfit.toFixed(2)}</p>
      </div>

      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">
          Enter Your Spot Trade Budget
        </h2>
        <input
          type="number"
          placeholder="Enter your budget in $"
          value={budget || ""}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="p-2 border border-gray-300 rounded-md mb-2 w-full"
        />
        <button
          onClick={handleAnalyze}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Analyze
        </button>
      </div>

      {trade.maxProfit === 0 && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-lg">
          <p>
            No profitable trades were found during the analyzed period. This
            could be due to bearish market conditions or high volatility, making
            it challenging to identify profitable opportunities.
          </p>
        </div>
      )}

      <div className="h-[500px] bg-white p-4 rounded-lg shadow">
        <Line
          data={{
            labels: priceData.map((data) => data.date.toLocaleDateString()),
            datasets: [
              {
                label: `${symbol} Price`,
                data: priceData.map((data) => data.price),
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                pointBackgroundColor: priceData.map((data) =>
                  data.date.getTime() === trade.buyDate.getTime()
                    ? "green"
                    : data.date.getTime() === trade.sellDate.getTime()
                    ? "red"
                    : "gray"
                ),
                tension: 0.1,
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                callbacks: {
                  label: (context) => `$${context.parsed.y.toFixed(2)}`,
                  title: (context) => context[0].label,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: false,
                ticks: {
                  callback: (value) => `$${Number(value).toFixed(2)}`,
                },
                grid: {
                  color: "rgba(0, 0, 0, 0.05)",
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  autoSkip: true,
                  maxRotation: 45,
                  minRotation: 45,
                },
              },
            },
          }}
        />
      </div>

      <div className="h-[500px] bg-white p-4 rounded-lg shadow mt-6">
        <Line
          data={profitHistoryData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => `$${Number(value).toFixed(2)}`,
                },
              },
              x: {
                ticks: {
                  autoSkip: true,
                  maxRotation: 45,
                  minRotation: 45,
                },
              },
            },
          }}
        />
      </div>

      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">
          Price Differences and Max Profit
        </h2>
        <table className="table-auto w-full text-left">
          <thead>
            <tr>
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Price Difference</th>
              <th className="border px-4 py-2">Max Profit</th>
            </tr>
          </thead>
          <tbody>
            {priceData.map((data, index) => {
              const priceDifference =
                index === 0
                  ? "-"
                  : (data.price - priceData[index - 1].price).toFixed(2);
              const maxProfit =
                index === 0
                  ? 0
                  : Math.max(0, data.price - priceData[0].price).toFixed(2);

              const isCurrentProfit = index === priceData.length - 1;

              return (
                <tr
                  key={data.date.toISOString()}
                  className={isCurrentProfit ? "bg-yellow-500" : ""}
                >
                  <td className="border px-4 py-2">
                    {data.date.toLocaleDateString()}
                  </td>
                  <td className="border px-4 py-2">{priceDifference}</td>
                  <td className="border px-4 py-2">{maxProfit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
