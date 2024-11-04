import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tab";
import TechnicalAnalysisCharts from "../components/TechnicalAnalysisCharts";
import FundamentalAnalysisTables from "../components/FundamentalAnalysisTables";
import ComprehensiveAnalysisDetails from "../components/ComprehensiveAnalysisDetails";
import ChatWidget from "../components/chatWidget";

import {
  getAnalysis,
  getFundamentalAnalysis,
  ApiResponse,
  FundamentalAnalysisResponse,
} from "../services/apiService";
import {
  getComprehensiveAnalysis,
  ComprehensiveAnalysisResponse,
} from "../services/comprehensiveAnalysisService";
import SideBar from "../components/SideBar";

interface ChartData {
  Date: string[];
  Close: number[];
  Volume: number[];
  RSI: number[];
  MACD: number[];
  MACD_hist: number[];
}

const Dashboard: React.FC = () => {
  const { companyName } = useParams<{ companyName: string }>();
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
      if (companyName) {
        try {
          const data = await getAnalysis(companyName);
          setChartData(transformData(data));
        } catch (err) {
          setError("Erreur lors du chargement des données techniques.");
        }
      }
    };

    const fetchFundamentalData = async () => {
      if (companyName) {
        try {
          const data = await getFundamentalAnalysis(companyName);
          setFundamentalData(data);
        } catch (err) {
          setError("Erreur lors du chargement des données fondamentales.");
        }
      }
    };

    const fetchComprehensiveData = async () => {
      if (companyName) {
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
  }, [companyName]);

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
    if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
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
      document.addEventListener("keydown", handleKeyPress);
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopupOpen]);

  return (
    <div className="flex flex-col h-screen">
      {/* SideBar en haut, prenant 20% de la hauteur */}
      <div className="h-[20%] w-full bg-gray-800 text-white flex items-center justify-center shadow-lg">
        <SideBar />
      </div>

      {/* Contenu principal prenant 80% de la hauteur */}
      <div className="flex-grow w-[70%] p-6 overflow-y-auto bg-white"> {/* Adjusted width to 70% */}
        <h1 className="mb-6 text-3xl font-bold text-center">
          Financial Dashboard for {companyName}
        </h1>
        {error && <p className="mb-4 text-center text-red-500">{error}</p>}

        {/* Bouton Sentiment */}
        {chartData && (
          <button
            onClick={handleSentimentClick}
            className="px-4 py-2 mt-4 text-white bg-red-500 rounded"
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

          <div className="h-[70%]">
            <TabsContent value="technical" className="h-full">
              {chartData ? (
                <TechnicalAnalysisCharts data={chartData} />
              ) : (
                <p className="text-center">
                  Loading technical analysis data...
                </p>
              )}
            </TabsContent>
            <TabsContent value="fundamental" className="h-full">
              {fundamentalData ? (
                <FundamentalAnalysisTables data={fundamentalData} />
              ) : (
                <p className="text-center">
                  Loading fundamental analysis data...
                </p>
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
          </div>
        </Tabs>

        {/* Chat Widget */}
        <ChatWidget />
      </div>

      {/* Popup pour Sentiment */}
      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div
            ref={popupRef}
            className="h-2/3 rounded-3xl relative w-2/3 p-8 bg-white shadow-lg"
          >
            <h2 className="top-8 left-1/2 absolute text-5xl font-bold text-center text-red-500 transform -translate-x-1/2">
              Sentiment
            </h2>
            <button
              onClick={closePopup}
              className="top-4 right-4 absolute text-lg font-bold text-red-500"
            >
              &times;
            </button>

            <div className="flex items-center h-full mt-8">
              <div className="flex-1 pr-4 text-center">
                <h3 className="mb-2 text-xl font-bold">Report Sentiment</h3>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Vivamus lacinia odio vitae vestibulum vestibulum. Cras
                  venenatis euismod malesuada.
                </p>
              </div>
              <div className="h-2/3 w-1 mx-2 border-l-4 border-gray-700"></div>
              <div className="flex-1 pl-4 text-center">
                <h3 className="mb-2 text-xl font-bold">
                  Social Media Sentiment
                </h3>
                <p>
                  Donec vel mauris quam. Curabitur pellentesque enim at odio
                  facilisis, ut aliquet est pretium. Nullam sit amet eros
                  auctor, finibus odio eu, tincidunt est.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;