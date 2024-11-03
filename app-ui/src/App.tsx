import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom"; // Import useParams
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../src/ui/tab";
import TechnicalAnalysisCharts from "./components/TechnicalAnalysisCharts";
import FundamentalAnalysisTables from "./components/FundamentalAnalysisTables";
import ComprehensiveAnalysisDetails from "./components/ComprehensiveAnalysisDetails";
import {
  getAnalysis,
  getFundamentalAnalysis,
  ApiResponse,
  FundamentalAnalysisResponse,
} from "./services/apiService";
import {
  getComprehensiveAnalysis,
  ComprehensiveAnalysisResponse,
} from "./services/comprehensiveAnalysisService";
import ChatWidget from './components/chatWidget';

interface ChartData {
  Date: string[];
  Close: number[];
  Volume: number[];
  RSI: number[];
  MACD: number[];
  MACD_hist: number[];
}

const App: React.FC = () => {
  const { companyName } = useParams<{ companyName: string }>(); // Get companyName from params
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [fundamentalData, setFundamentalData] =
    useState<FundamentalAnalysisResponse | null>(null);
  const [comprehensiveData, setComprehensiveData] =
    useState<ComprehensiveAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTechnicalData = async () => {
      if (companyName) { // Check if companyName is available
        try {
          const data = await getAnalysis(companyName);
          setChartData(transformData(data));
        } catch (err) {
          setError("Erreur lors du chargement des données techniques.");
        }
      }
    };

    const fetchFundamentalData = async () => {
      if (companyName) { // Check if companyName is available
        try {
          const data = await getFundamentalAnalysis(companyName);
          setFundamentalData(data);
        } catch (err) {
          setError("Erreur lors du chargement des données fondamentales.");
        }
      }
    };

    const fetchComprehensiveData = async () => {
      if (companyName) { // Check if companyName is available
        try {
          const data = await getComprehensiveAnalysis(companyName);
          setComprehensiveData(data);
        } catch (err) {
          setError(
            "Erreur lors du chargement des données de l'analyse complète."
          );
        }
      }
    };

    fetchTechnicalData();
    fetchFundamentalData();
    fetchComprehensiveData();
  }, [companyName]); // Add companyName to the dependency array

  const transformData = (json: ApiResponse): ChartData => {
    const sortedData = json.technical_analysis.sort(
      (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
    );
    return {
      Date: sortedData.map((item) => item.Date),
      Close: sortedData.map((item) => item.Close),
      Volume: sortedData.map((item) => item.Volume),
      RSI: sortedData.map((item) => item.RSI),
      MACD: sortedData.map((item) => item.MACD),
      MACD_hist: sortedData.map((item) => item.MACD_hist),
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
    <div className="w-[70vw] h-[100vh] bg-white shadow-lg rounded-lg p-6 overflow-y-auto mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Financial Dashboard for {companyName}
      </h1>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {/* Sentiment Button */}
      {chartData && (
        <button 
          onClick={handleSentimentClick} 
          className="bg-red-500 text-white px-4 py-2 mt-4 rounded"
        >
          Sentiment
        </button>
      )}

      <Tabs defaultValue="technical" className="h-full">
        <TabsList className="flex justify-center mb-4">
          <TabsTrigger value="technical" className="px-4 py-2">
            Technical Analysis
          </TabsTrigger>
          <TabsTrigger value="fundamental" className="px-4 py-2">
            Fundamental Analysis
          </TabsTrigger>
          <TabsTrigger value="comprehensive" className="px-4 py-2">
            Comprehensive Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="technical" className="h-full">
          {chartData ? (
            <TechnicalAnalysisCharts data={chartData} />
          ) : (
            <p className="text-center">Loading technical analysis data...</p>
          )}
        </TabsContent>

        <TabsContent value="fundamental" className="h-full">
          {fundamentalData ? (
            <FundamentalAnalysisTables data={fundamentalData} />
          ) : (
            <p className="text-center">Loading fundamental analysis data...</p>
          )}
        </TabsContent>

        <TabsContent value="comprehensive" className="h-full">
          {comprehensiveData ? (
            <ComprehensiveAnalysisDetails data={comprehensiveData} />
          ) : (
            <p className="text-center">
              Loading comprehensive analysis data...
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Chat Widget */}
      <ChatWidget />

      {/* Popup for Sentiment */}
      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div 
            ref={popupRef}
            className="bg-white w-2/3 h-2/3 p-8 rounded-3xl shadow-lg relative"
          >
            <h2 className="text-5xl font-bold text-red-500 text-center absolute top-8 left-1/2 transform -translate-x-1/2">
              Sentiment
            </h2>
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-red-500 font-bold text-lg"
            >
              &times;
            </button>
            
            {/* Two-column layout with vertical divider */}
            <div className="flex h-full items-center mt-8">
              {/* Report Sentiment Column */}
              <div className="flex-1 pr-4 text-center"> {/* Added text-center here */}
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
              <div className="flex-1 pl-4 text-center"> {/* Added text-center here */}
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
