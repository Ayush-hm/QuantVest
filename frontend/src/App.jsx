import { useState, useEffect } from 'react';
import './App.css';
import AddFundForm from './components/AddFundForm';
import PortfolioList from './components/PortfolioList';
import GraphsSection from './components/GraphsSection';
import MarketStatus from './components/MarketStatus';

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
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Add Fund Form Section */}
          <div className="glass-card p-6">
            <AddFundForm onAdd={handleAddFund} />
            
            {/* Recommended Funds Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommended Funds</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: "ICICI Prudential Technology Fund",
                    category: "Sectoral/Tech",
                    returns: "22.4% (3Y)",
                    risk: "High"
                  },
                  {
                    name: "Axis Small Cap Fund",
                    category: "Small Cap",
                    returns: "28.1% (3Y)",
                    risk: "Very High"
                  },
                  {
                    name: "Mirae Asset Large Cap Fund",
                    category: "Large Cap",
                    returns: "15.8% (3Y)",
                    risk: "Moderate"
                  }
                ].map((fund, index) => (
                  <div key={index} className="glass-card p-4 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{fund.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        fund.risk === 'High' ? 'bg-orange-100 text-orange-700' :
                        fund.risk === 'Very High' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {fund.risk}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{fund.category}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-600">{fund.returns}</span>
                      <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                        Add to Portfolio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio and Graphs Section */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <PortfolioList portfolio={portfolio} />
            </div>
            <GraphsSection portfolio={portfolio} />
          </div>
        </div>
      </main>

      <footer className="glass-effect border-t border-white/20 fixed bottom-0 left-0 right-0 z-50">
        <MarketStatus />
      </footer>
    </div>
  );
}

export default App;
