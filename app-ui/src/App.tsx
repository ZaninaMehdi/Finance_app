import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
  const { companyName } = useParams<{ companyName: string }>();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (companyName) {
          const data = await getAnalysis(companyName);
          setChartData(transformData(data));
        }
      } catch (err) {
        setError('Error loading data.');
      }
    };
    fetchData();
  }, [companyName]);

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

  const handleSentimentClick = () => {
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      closePopup();
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      closePopup();
    }
  };

  useEffect(() => {
    if (isPopupOpen) {
      document.addEventListener('keydown', handleKeyPress);
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopupOpen]);

  return (
    <div>
      <h1>Financial Dashboard for {companyName}</h1>
      {chartData && (
        <button 
          onClick={handleSentimentClick} 
          className="bg-red-500 text-white px-4 py-2 mt-4 rounded"
        >
          Sentiment
        </button>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Layout for Charts and Chat */}
      <div className="flex h-[calc(100vh-4rem)]"> {/* Full height minus header */}
        {/* Charts Section */}
        <div className="flex-1 p-4">
          {chartData ? (
            <TechnicalAnalysisCharts data={chartData} />
          ) : (
            <p>Loading data...</p>
          )}
        </div>

        {/* Chat Section */}
        <div className="w-1/3 border-l border-gray-300">
          <ChatWidget />
        </div>
      </div>


      {/* Popup for Sentiment */}
      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div 
            ref={popupRef}
            className="bg-white w-2/3 h-2/3 p-8 rounded-3xl shadow-lg relative" // Changed to rounded-3xl for more roundness
          >
            <h2 className="text-5xl font-bold text-red-500 text-center absolute top-8 left-1/2 transform -translate-x-1/2">Sentiment</h2>
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-red-500 font-bold text-lg"
            >
              &times;
            </button>
            
            {/* Two-column layout with vertical divider */}
            <div className="flex h-full items-center mt-8">
              {/* Report Sentiment Column */}
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-bold mb-2">Report Sentiment</h3>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
                  lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod
                  malesuada.
                </p>
              </div>

              {/* Centered, Bold Vertical Divider */}
              <div className="w-1 border-l-4 border-gray-700 mx-2 h-2/3"></div>

              {/* Social Media Sentiment Column */}
              <div className="flex-1 pl-4">
                <h3 className="text-xl font-bold mb-2">Social Media Sentiment</h3>
                <p>
                  Donec vel mauris quam. Curabitur pellentesque enim at odio
                  facilisis, ut aliquet est pretium. Nullam sit amet eros auctor,
                  finibus odio eu, tincidunt est.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}




    </div>
  );
};

export default App;
