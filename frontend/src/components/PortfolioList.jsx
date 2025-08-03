import React from "react";

export default function PortfolioList({ portfolio }) {
    const totalInvestment = portfolio.reduce((sum, fund) => sum + fund.amount_invested, 0);
    const currentValue = portfolio.reduce((sum, fund) => {
        const currentPrice = fund.current_price ?? 0;
        return sum + (currentPrice * fund.units);
    }, 0);
    const totalPnL = currentValue - totalInvestment;
    const totalPnLPercentage = ((totalPnL / totalInvestment) * 100).toFixed(2);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Your Portfolio</h2>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Current Value</p>
                        <p className="text-lg font-semibold">₹{currentValue.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total P&L</p>
                        <p className={`text-lg font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)} ({totalPnL >= 0 ? '+' : ''}{totalPnLPercentage}%)
                        </p>
                    </div>
                </div>
            </div>

            {portfolio.length === 0 ? (
                <div className="glass-card p-12 text-center animate-fade-in">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                        <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-20"></div>
                        <div className="relative flex items-center justify-center w-full h-full bg-purple-50 rounded-full">
                            <svg className="w-12 h-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Start Your Portfolio</h3>
                    <p className="mt-2 text-gray-500">Begin your investment journey by adding your first mutual fund.</p>
                </div>
            ) : (
                <div className="overflow-x-auto glass-card rounded-xl animate-fade-in">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Fund Name</th>
                                <th className="text-right">Units</th>
                                <th className="text-right">Buy Price</th>
                                <th className="text-right">Current Price</th>
                                <th className="text-right">Investment</th>
                                <th className="text-right">Current Value</th>
                                <th className="text-right">P&L</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {portfolio.map((fund, index) => {
                                const currentPrice = fund.current_price ?? 0;
                                const buyPrice = fund.buy_price ?? 0;
                                const currentValue = currentPrice * fund.units;
                                const pnl = currentValue - fund.amount_invested;
                                const pnlPercentage = ((pnl / fund.amount_invested) * 100).toFixed(2);
                                const pnlColor = pnl >= 0 ? "text-green-600" : "text-red-600";

                                return (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {fund.scheme_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {fund.units.toFixed(3)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            ₹{buyPrice.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            ₹{currentPrice.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            ₹{fund.amount_invested.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            ₹{currentValue.toFixed(2)}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${pnlColor}`}>
                                            {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                                            <span className="text-xs ml-1">({pnl >= 0 ? '+' : ''}{pnlPercentage}%)</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
