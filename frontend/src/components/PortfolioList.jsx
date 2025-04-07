import React from "react";

export default function PortfolioList({ portfolio }) {
    return (
        <div className="mt-8">
            <h2 className="text-3xl font-semibold mb-4">Your Holdings</h2>

            {portfolio.length === 0 ? (
                <p className="text-gray-600">No funds in portfolio yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left rounded-lg shadow">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="py-3 px-4">Fund Name</th>
                                <th className="py-3 px-4">Units</th>
                                <th className="py-3 px-4">Buy Price</th>
                                <th className="py-3 px-4">Current Price</th>
                                <th className="py-3 px-4">P&L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {portfolio.map((fund, index) => {
                                const currentPrice = fund.current_price ?? 0;
                                const buyPrice = fund.buy_price ?? 0;
                                const pnl = ((currentPrice - buyPrice) * fund.units).toFixed(2);
                                const pnlColor = pnl >= 0 ? "text-green-600" : "text-red-600";

                                return (
                                    <tr key={index} className="border-t">
                                        <td className="py-3 px-4">{fund.scheme_name}</td>
                                        <td className="py-3 px-4">{fund.units}</td>
                                        <td className="py-3 px-4">₹{buyPrice}</td>
                                        <td className="py-3 px-4">₹{currentPrice}</td>
                                        <td className={`py-3 px-4 font-semibold ${pnlColor}`}>
                                            ₹{pnl}
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
