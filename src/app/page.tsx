import Link from "next/link";
import { memo } from "react";
import type { SymbolPair } from "@/types/index.types";

const SymbolLink = memo(({ symbol }: { symbol: SymbolPair }) => (
  <Link
    key={symbol}
    href={`/analyze?symbol=${symbol}`}
    className="block p-2 border rounded hover:bg-gray-700"
  >
    Analyze {symbol}
  </Link>
));

SymbolLink.displayName = "SymbolLink";

export default function Home() {
  const symbols: SymbolPair[] = [
    "BTCUSDT",
    "ETHUSDT",
    "SOLUSDT",
    "XRPUSDT",
    "DOGEUSDT",
    "DOTUSDT",
    "LINKUSDT",
    "MATICUSDT",
  ]; // You can add more cryptocurrency pairs but these crypto currencies as of now.

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Crypto Profit Analyzer for Spot Trading
      </h1>
      <button className="space-y-2">
        {symbols.map((symbol) => (
          <SymbolLink key={symbol} symbol={symbol} />
        ))}
      </button>
    </div>
  );
}
