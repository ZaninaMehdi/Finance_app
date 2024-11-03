import React, { useState, useEffect } from 'react';
import TechnicalAnalysisCharts from './components/TechnicalAnalysisCharts';
import { getAnalysis, ApiResponse } from './services/apiService';
import ChatWidget from './components/chatWidget';
import './App.css';

interface ChartData {
  Date: string[];
  Close: number[];
  Volume: number[];
  RSI: number[];
  MACD: number[];
  MACD_hist: number[];
}

const App: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAnalysis('AMZN');
        setChartData(transformData(data));
      } catch (err) {
        setError('Error loading data.');
      }
    };
    fetchData();
  }, []);

  const transformData = (json: ApiResponse): ChartData => {
    return {
      Date: json.technical_analysis.map((item) => item.Date),
      Close: json.technical_analysis.map((item) => item.Close),
      Volume: json.technical_analysis.map((item) => item.Volume),
      RSI: json.technical_analysis.map((item) => item.RSI),
      MACD: json.technical_analysis.map((item) => item.MACD),
      MACD_hist: json.technical_analysis.map((item) => item.MACD_hist),
    };
  };

  return (
    <div>
      <h1>Financial Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {chartData ? (
        <TechnicalAnalysisCharts data={chartData} />
      ) : (
        <p>Loading data...</p>
      )}

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default App;