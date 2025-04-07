import { useState, useEffect } from 'react';
import './App.css';
import AddFundForm from './components/AddFundForm';
import PortfolioList from './components/PortfolioList';

function App() {
  const [portfolio, setPortfolio] = useState([]);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('http://localhost:5000/portfolio');
      const data = await res.json();
      setPortfolio(data);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    }
  };

  const handleAddFund = async (fund) => {
    try {
      await fetch('http://localhost:5000/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fund),
      });
      fetchPortfolio(); // Refresh after add
    } catch (err) {
      console.error("Error adding fund:", err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  return (
    <div className="min-h-screen p-6 flex flex-col items-center">
      <div className="text-center mt-24 mb-20">
        <h1 className="text-6xl font-bold text-blue-700">FundMate</h1>
        <h2 className="text-2xl italic text-gray-700 mt-2">
          All your funds at one place
        </h2>
      </div>
      <div className="mt-10 w-full max-w-2xl">
        <PortfolioList portfolio={portfolio} />
      </div>
      <AddFundForm onAdd={handleAddFund} />
    </div>
  );
}

export default App;
