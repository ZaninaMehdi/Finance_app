import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tab";
import TechnicalAnalysisCharts from "../components/TechnicalAnalysisCharts";
import FundamentalAnalysisTables from "../components/FundamentalAnalysisTables";
import ComprehensiveAnalysisDetails from "../components/ComprehensiveAnalysisDetails";
import ChatWidget from "../components/chatWidget";
import SentimentPopup from "@/components/SentimentPopup";
import {
  getAnalysis,
  getFundamentalAnalysis,
  ApiResponse,
  getSentimentAnalysis, // Added import

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
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isLoadingSentiment, setIsLoadingSentiment] = useState(false);
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

  const handleSentimentClick = async () => {
    setIsPopupOpen(true);
    setIsLoadingSentiment(true);
    
    if (companyName) {
      try {
        const sentiment = await getSentimentAnalysis("tinker", companyName);
        setSentimentData(sentiment);
      } catch (err) {
        setError("Erreur lors du chargement des données de sentiment.");
      } finally {
        setIsLoadingSentiment(false);
      }
    }
  };

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
        <SentimentPopup
          data={sentimentData}
          onClose={closePopup}
          isLoading={isLoadingSentiment}
        />
      )}
    </div>
  );
};

export default Dashboard;
