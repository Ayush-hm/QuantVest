import { useState } from "react";

export default function AddFundForm({ onAdd }) {
    const [schemeName, setSchemeName] = useState("");
    const [amount, setAmount] = useState("");
    const [buyDate, setBuyDate] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onAdd({ scheme_name: schemeName, amount, buy_date: buyDate });
            setSchemeName("");
            setAmount("");
            setBuyDate("");
        } catch (error) {
            console.error("Error adding fund:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Add New Fund</h2>
                    <p className="text-sm text-gray-500 mt-1">Quick add your mutual fund investment</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[240px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scheme Name
                    </label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search mutual fund schemes..."
                        value={schemeName}
                        onChange={(e) => setSchemeName(e.target.value)}
                        required
                    />
                </div>

                <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">₹</span>
                        <input
                            type="number"
                            className="input-field pl-8"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purchase Date
                    </label>
                    <input
                        type="date"
                        className="input-field"
                        value={buyDate}
                        onChange={(e) => setBuyDate(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`btn-primary h-[42px] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center w-20">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </span>
                    ) : 'Add Fund'}
                </button>
            </form>
        </div>
    );
}
