import { useState, useEffect } from 'react';

export default function MarketStatus() {
    const [marketData, setMarketData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMarketStatus = async () => {
            try {
                const response = await fetch('http://localhost:5000/market-status');
                if (!response.ok) throw new Error('Failed to fetch market status');
                const data = await response.json();
                setMarketData(data);
                setError(null);
            } catch (err) {
                setError('Unable to fetch market data');
                console.error('Error fetching market status:', err);
            }
        };

        // Initial fetch
        fetchMarketStatus();

        // Set up polling every 30 seconds
        const intervalId = setInterval(fetchMarketStatus, 30000);

        return () => clearInterval(intervalId);
    }, []);

    if (error) {
        return (
            <div className="text-xs text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4     py-2 bg-white/5 backdrop-blur-lg border-t border-white/10 shadow-lg">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full shadow-sm ${
                        marketData?.market_status === 'Open' 
                            ? 'bg-green-500 animate-pulse shadow-green-500/30' 
                            : 'bg-red-500 shadow-red-500/30'
                    }`}></div>
                    <span className="text-xs text-gray-500">
                        Market {marketData?.market_status || 'Unknown'}
                    </span>
                </div>
                <div className="h-4 w-px"></div>
                <div className="flex items-center space-x-4">
                    <div className="flex flex-col backdrop-blur-lg rounded-lg px-3 py-1">
                        <span className="text-xs text-gray-400">Nifty 50</span>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-white/90">{marketData?.nifty?.price?.toLocaleString() || '-'}</span>
                            <span className={`text-xs font-medium ${
                                (marketData?.nifty?.change || 0) >= 0 
                                    ? 'text-green-400' 
                                    : 'text-red-400'
                            }`}>
                                {marketData?.nifty?.change >= 0 ? '+' : ''}
                                {marketData?.nifty?.change_percent?.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-xs text-gray-400">Sensex</span>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-white/90">{marketData?.sensex?.price?.toLocaleString() || '-'}</span>
                            <span className={`text-xs font-medium ${
                                (marketData?.sensex?.change || 0) >= 0 
                                    ? 'text-green-400' 
                                    : 'text-red-400'
                            }`}>
                                {marketData?.sensex?.change >= 0 ? '+' : ''}
                                {marketData?.sensex?.change_percent?.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 rounded-lg px-3 py-1">
                    <span className="text-xs text-green-400">▲ {marketData?.gainers_count || 0}</span>
                    <span className="text-xs text-gray-500">/</span>
                    <span className="text-xs text-red-400">▼ {marketData?.losers_count || 0}</span>
                </div>
                <div className="h-4 w-px bg-white/10"></div>
                <span className="text-xs text-gray-400 backdrop-blur-sm bg-white/5 rounded-lg px-3 py-1">
                    Last Updated: {marketData?.last_updated || '-'}
                </span>
            </div>
        </div>
    );
}
