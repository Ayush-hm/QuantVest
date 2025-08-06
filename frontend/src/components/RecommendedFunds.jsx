import { useState, useEffect } from 'react';

const RecommendedFunds = ({ portfolio, onAddFund }) => {
    const [recommendedFunds, setRecommendedFunds] = useState([]);
    const [loading, setLoading] = useState(true);

    const analyzePortfolio = async () => {
        try {
            // Get all available funds
            const response = await fetch('http://localhost:5000/funds');
            const allFunds = await response.json();

            // Get current portfolio categories and asset types
            const portfolioFunds = portfolio?.funds || [];
            const portfolioCategories = new Set(portfolioFunds.map(fund => 
                fund.scheme_name.toLowerCase().includes('equity') ? 'Equity' :
                fund.scheme_name.toLowerCase().includes('debt') ? 'Debt' :
                fund.scheme_name.toLowerCase().includes('hybrid') ? 'Hybrid' : 'Other'
            ));

            // Function to get fund details
            const getFundDetails = async (schemeCode) => {
                try {
                    const response = await fetch(`http://localhost:5000/fund/${schemeCode}`);
                    return await response.json();
                } catch (error) {
                    console.error("Error fetching fund details:", error);
                    return null;
                }
            };

            // Categories we want to ensure are represented
            const desiredCategories = ['Large Cap', 'Mid Cap', 'Small Cap', 'Debt', 'Index'];
            const recommendations = [];

            // Get fund details for potential recommendations
            const potentialRecommendations = await Promise.all(
                Object.entries(allFunds)
                    .filter(([_, name]) => {
                        // Filter out funds already in portfolio
                        return !portfolioFunds.some(pf => pf.scheme_name === name);
                    })
                    .slice(0, 20) // Limit initial search to 20 funds
                    .map(async ([code, name]) => {
                        const details = await getFundDetails(code);
                        if (!details) return null;

                        // Calculate category
                        let category = 'Other';
                        if (name.toLowerCase().includes('large cap')) category = 'Large Cap';
                        else if (name.toLowerCase().includes('mid cap')) category = 'Mid Cap';
                        else if (name.toLowerCase().includes('small cap')) category = 'Small Cap';
                        else if (name.toLowerCase().includes('nifty') || name.toLowerCase().includes('sensex')) category = 'Index';
                        else if (name.toLowerCase().includes('debt') || name.toLowerCase().includes('bond')) category = 'Debt';

                        // Calculate risk level
                        let risk = 'Moderate';
                        if (category === 'Small Cap' || category === 'Mid Cap') risk = 'High';
                        else if (category === 'Large Cap' || category === 'Index') risk = 'Moderate';
                        else if (category === 'Debt') risk = 'Low';

                        return {
                            code,
                            name,
                            category,
                            risk,
                            returns: details.returns || "NA",
                            nav: details.nav || "NA",
                            scheme_code: code
                        };
                    })
            );

            // Filter out null values and sort by diversity
            const validRecommendations = potentialRecommendations.filter(r => r !== null);

            // Prioritize recommendations that add diversity
            desiredCategories.forEach(category => {
                if (!portfolioCategories.has(category)) {
                    const recommendation = validRecommendations.find(r => r.category === category);
                    if (recommendation && recommendations.length < 3) {
                        recommendations.push(recommendation);
                    }
                }
            });

            // Fill remaining slots with top performing funds
            while (recommendations.length < 3 && validRecommendations.length > recommendations.length) {
                const nextRec = validRecommendations.find(r => 
                    !recommendations.some(rec => rec.code === r.code)
                );
                if (nextRec) recommendations.push(nextRec);
            }

            setRecommendedFunds(recommendations);
            setLoading(false);
        } catch (error) {
            console.error("Error analyzing portfolio:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        analyzePortfolio();
    }, [portfolio]);

    if (loading) {
        return (
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommended Funds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((_, index) => (
                        <div key={index} className="glass-card p-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommended Funds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedFunds.map((fund, index) => (
                    <div key={index} className="glass-card p-4 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{fund.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                fund.risk === 'High' ? 'bg-orange-100 text-orange-700' :
                                fund.risk === 'Very High' ? 'bg-red-100 text-red-700' :
                                fund.risk === 'Low' ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {fund.risk}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{fund.category}</div>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-sm font-medium text-gray-900">NAV: ₹{fund.nav}</span>
                                {fund.returns !== "NA" && (
                                    <span className="text-sm font-medium text-green-600 ml-2">
                                        ({fund.returns}%)
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => onAddFund({
                                    scheme_name: fund.name,
                                    scheme_code: fund.scheme_code
                                })}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                                Add to Portfolio
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedFunds;
