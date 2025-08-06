import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import AddFundForm from './components/AddFundForm';
import PortfolioList from './components/PortfolioList';
import GraphsSection from './components/GraphsSection';
import MarketStatus from './components/MarketStatus';
import RecommendedFunds from './components/RecommendedFunds';

function App() {
  const [portfolio, setPortfolio] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('http://localhost:5000/portfolio');
      const data = await res.json();
      // Update state with the entire portfolio data including funds and summary
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
    <Router>
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-gradient)' }}>
      <nav className="glass-effect sticky to  p-0 z-50 px-4 py-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold" style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              QuantVest
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-medium text-purple-600 bg-purple-100/50 rounded-full">Beta</span>
          </div>
          <div className="flex   items-center space-x-4">
            <button className="glass-button">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            <p className="text-sm text-gray-500 glass-card px-3 py-1.5 rounded-full">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </nav>

      <main className="flex-1 px-4 py-6 mb-16">
        <Routes>
          <Route path="/" element={
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Add Fund Form Section */}
              <div className="glass-card p-6">
                <AddFundForm onAdd={handleAddFund} />
                <RecommendedFunds portfolio={portfolio} onAddFund={handleAddFund} />
              </div>

              {/* Portfolio and Graphs Section */}
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <PortfolioList portfolio={portfolio?.funds || []} />
                </div>
                <GraphsSection portfolio={portfolio?.funds || []} />
              </div>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>      <footer className="glass-effect border-t border-white/20 fixed bottom-0 left-0 right-0 z-50">
        <MarketStatus />
      </footer>
    </div>
    </Router>
  );
}

export default App;
