import React, { useState } from "react";

export default function PortfolioList({ portfolio, onPortfolioUpdate }) {
    const [editingFund, setEditingFund] = useState(null);
    const [newAmount, setNewAmount] = useState("");

    const handleEditClick = (fund) => {
        setEditingFund(fund);
        setNewAmount(fund.amount_invested.toString());
    };

    const handleUpdateAmount = async () => {
        try {
            const response = await fetch(`http://localhost:5000/portfolio/${editingFund.scheme_code}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseFloat(newAmount) })
            });

            if (!response.ok) throw new Error('Failed to update investment amount');

            setEditingFund(null);
            if (onPortfolioUpdate) onPortfolioUpdate();
        } catch (error) {
            console.error('Error updating investment amount:', error);
            alert('Failed to update investment amount. Please try again.');
        }
    };

    const totalInvestment = portfolio.reduce((sum, fund) => sum + fund.amount_invested, 0);
    const currentValue = portfolio.reduce((sum, fund) => {
        const currentPrice = fund.current_price ?? 0;
        return sum + (currentPrice * fund.units);
    }, 0);
    const totalPnL = currentValue - totalInvestment;
    const totalPnLPercentage = ((totalPnL / totalInvestment) * 100).toFixed(2);

    return (
        <div className="relative">
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
                                            <button
                                                onClick={() => handleEditClick(fund)}
                                                className="text-left hover:text-purple-600 transition-colors"
                                            >
                                                {fund.scheme_name}
                                            </button>
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

            {/* Modal */}
            {editingFund && (
                <>
                    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"></div>
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-200">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                Edit Investment for {editingFund.scheme_name}
                            </h3>
                            <label className="block mb-2 text-sm font-medium text-gray-700">New Amount Invested (₹):</label>
                            <input
                                type="number"
                                value={newAmount}
                                onChange={(e) => setNewAmount(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                            />
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setEditingFund(null)}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateAmount}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
