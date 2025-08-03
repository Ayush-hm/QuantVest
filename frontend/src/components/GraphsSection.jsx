import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function GraphsSection({ portfolio }) {
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState('1M'); // 1M, 3M, 6M, 1Y, ALL

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (portfolio.length === 0) return;

      try {
        // Calculate date range based on selected timeRange
        const end_date = new Date().toLocaleDateString('en-GB'); // DD-MM-YYYY format
        const start_date = (() => {
          const date = new Date();
          switch (timeRange) {
            case '1M':
              date.setMonth(date.getMonth() - 1);
              break;
            case '3M':
              date.setMonth(date.getMonth() - 3);
              break;
            case '6M':
              date.setMonth(date.getMonth() - 6);
              break;
            case '1Y':
              date.setFullYear(date.getFullYear() - 1);
              break;
            case 'ALL':
              date.setFullYear(date.getFullYear() - 3); // Get 3 years of data or adjust as needed
              break;
          }
          return date.toLocaleDateString('en-GB');
        })();

        const response = await fetch(
          `http://localhost:5000/portfolio-history?start_date=${start_date}&end_date=${end_date}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch portfolio history');
        
        const data = await response.json();

        setChartData({
          labels: data.map(item => {
            const [day, month, year] = item.date.split('-');
            return new Date(year, month - 1, day).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: timeRange === '1Y' || timeRange === 'ALL' ? 'numeric' : undefined
            });
          }),
          datasets: [
            {
              label: 'Portfolio Value',
              data: data.map(item => item.value),
              fill: 'start',
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.4,
              borderWidth: 2,
            },
            {
              label: 'Amount Invested',
              data: data.map(item => item.investment),
              borderColor: '#94a3b8',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              tension: 0.1,
              borderWidth: 2,
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching portfolio history:', error);
      }
    };

    fetchHistoricalData();
  }, [portfolio, timeRange]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          boxHeight: 6,
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => `₹${context.parsed.y.toFixed(2)}`
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0
        }
      },
      y: {
        grid: {
          borderDash: [2, 4],
          color: 'rgba(0, 0, 0, 0.06)'
        },
        ticks: {
          callback: (value) => `₹${value.toLocaleString()}`
        }
      }
    }
  };

  const timeRanges = ['1M', '3M', '6M', '1Y', 'ALL'];
  
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Portfolio Performance</h2>
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`glass-button px-3 py-1 text-sm ${
                timeRange === range ? 'bg-white/50 text-purple-600' : ''
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[400px]">
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Add funds to see performance graph</p>
          </div>
        )}
      </div>
    </div>
  );
}
