import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Activity, DollarSign, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MarketData {
  ihsg: {
    value: number;
    change: number;
    changePercent: number;
    lastUpdate: string;
  };
  gold: {
    value: number;
    change: number;
    changePercent: number;
    lastUpdate: string;
  };
  usdIdr: {
    value: number;
    change: number;
    changePercent: number;
    lastUpdate: string;
  };
  topStocks: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  }[];
}

export default function MarketTicker() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      
      // Simulate realistic IHSG values (around 7000-7500 range)
      const baseIHSG = 7235.45;
      const ihsgVariation = (Math.random() - 0.5) * 50;
      const ihsgValue = baseIHSG + ihsgVariation;
      const ihsgChange = ihsgVariation;
      const ihsgChangePercent = (ihsgChange / baseIHSG) * 100;

      // Simulate gold price in IDR per gram (around 1,100,000-1,200,000)
      const baseGold = 1156000;
      const goldVariation = (Math.random() - 0.5) * 15000;
      const goldValue = baseGold + goldVariation;
      const goldChange = goldVariation;
      const goldChangePercent = (goldChange / baseGold) * 100;

      // Simulate USD/IDR exchange rate (around 16,000-16,500)
      const baseUsdIdr = 16250;
      const usdIdrVariation = (Math.random() - 0.5) * 100;
      const usdIdrValue = baseUsdIdr + usdIdrVariation;
      const usdIdrChange = usdIdrVariation;
      const usdIdrChangePercent = (usdIdrChange / baseUsdIdr) * 100;

      // Simulate top 5 Indonesian stocks
      const topStocks = [
        { symbol: "BBCA", name: "Bank Central Asia", basePrice: 9850 },
        { symbol: "BBRI", name: "Bank Rakyat Indonesia", basePrice: 5475 },
        { symbol: "TLKM", name: "Telkom Indonesia", basePrice: 3420 },
        { symbol: "ASII", name: "Astra International", basePrice: 5050 },
        { symbol: "BMRI", name: "Bank Mandiri", basePrice: 6525 },
      ].map(stock => {
        const variation = (Math.random() - 0.5) * stock.basePrice * 0.02;
        return {
          symbol: stock.symbol,
          name: stock.name,
          price: stock.basePrice + variation,
          change: variation,
          changePercent: (variation / stock.basePrice) * 100,
        };
      });

      setMarketData({
        ihsg: {
          value: ihsgValue,
          change: ihsgChange,
          changePercent: ihsgChangePercent,
          lastUpdate: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
        gold: {
          value: goldValue,
          change: goldChange,
          changePercent: goldChangePercent,
          lastUpdate: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
        usdIdr: {
          value: usdIdrValue,
          change: usdIdrChange,
          changePercent: usdIdrChangePercent,
          lastUpdate: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
        topStocks,
      });
      setLastFetch(now);
    } catch (error) {
      console.error("Error fetching market data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    // Refresh every 15 minutes (reduced from 5 mins to save browser resources)
    const interval = setInterval(fetchMarketData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading && !marketData) {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 border-b border-amber-600">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm text-amber-900">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Memuat data pasar...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!marketData) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 border-b border-amber-600 text-amber-900">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          {/* IHSG */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-800" />
              <span className="font-semibold text-amber-800">IHSG</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-amber-900">{formatNumber(marketData.ihsg.value)}</span>
              <Badge
                variant="outline"
                className={`text-xs border-0 ${
                  marketData.ihsg.change >= 0
                    ? "bg-green-600/20 text-green-800"
                    : "bg-red-600/20 text-red-800"
                }`}
              >
                {marketData.ihsg.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {marketData.ihsg.change >= 0 ? "+" : ""}
                {formatNumber(marketData.ihsg.change)} ({formatNumber(marketData.ihsg.changePercent)}%)
              </Badge>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px bg-amber-700/50" />

          {/* USD/IDR */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-800" />
              <span className="font-semibold text-amber-800">USD/IDR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-amber-900">{formatCurrency(marketData.usdIdr.value)}</span>
              <Badge
                variant="outline"
                className={`text-xs border-0 ${
                  marketData.usdIdr.change >= 0
                    ? "bg-red-600/20 text-red-800"
                    : "bg-green-600/20 text-green-800"
                }`}
              >
                {marketData.usdIdr.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {formatNumber(marketData.usdIdr.changePercent)}%
              </Badge>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px bg-amber-700/50" />

          {/* Gold Price */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-800" />
              <span className="font-semibold text-amber-800">Emas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-amber-900">{formatCurrency(marketData.gold.value)}/gr</span>
              <Badge
                variant="outline"
                className={`text-xs border-0 ${
                  marketData.gold.change >= 0
                    ? "bg-green-600/20 text-green-800"
                    : "bg-red-600/20 text-red-800"
                }`}
              >
                {marketData.gold.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {marketData.gold.change >= 0 ? "+" : ""}
                {formatNumber(marketData.gold.changePercent)}%
              </Badge>
            </div>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <RefreshCw 
              className={`h-3 w-3 cursor-pointer hover:text-amber-900 transition-colors ${loading ? 'animate-spin' : ''}`}
              onClick={fetchMarketData}
            />
            <span>Update: {marketData.ihsg.lastUpdate}</span>
          </div>
        </div>

        {/* Top 5 Stocks */}
        <div className="flex flex-wrap items-center gap-4 mt-2 pt-2 border-t border-amber-600/30">
          <span className="text-xs font-semibold text-amber-800">Top 5 Saham:</span>
          <div className="flex flex-wrap gap-3">
            {marketData.topStocks.map((stock) => (
              <div key={stock.symbol} className="flex items-center gap-1.5 bg-amber-400/30 px-2 py-1 rounded">
                <span className="font-bold text-xs text-amber-900">{stock.symbol}</span>
                <span className="text-xs text-amber-800">{formatCurrency(stock.price)}</span>
                <span className={`text-xs font-medium ${stock.change >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {stock.change >= 0 ? '+' : ''}{formatNumber(stock.changePercent)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}