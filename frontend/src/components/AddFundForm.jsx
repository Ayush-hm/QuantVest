import { useState } from "react";

export default function AddFundForm({ onAdd }) {
    const [schemeName, setSchemeName] = useState("");
    const [amount, setAmount] = useState("");
    const [buyDate, setBuyDate] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        // Send formatted data to parent handler
        onAdd({ scheme_name: schemeName, amount, buy_date: buyDate });

        // Clear inputs
        setSchemeName("");
        setAmount("");
        setBuyDate("");
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-black p-6 rounded-2xl shadow-md max-w-md w-full space-y-4"
        >
            <h2 className="text-3xl font-semibold">Add Fund</h2>

            <input
                type="text"
                className="border p-3 w-full rounded"
                placeholder="Scheme Name"
                value={schemeName}
                onChange={(e) => setSchemeName(e.target.value)}
                required
            />

            <input
                type="number"
                className="border p-3 w-full rounded"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
            />

            <input
                type="date"
                className="border p-3 w-full rounded"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                required
            />

            <button
                type="submit"
                className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
            >
                Add to Portfolio
            </button>
        </form>
    );
}
