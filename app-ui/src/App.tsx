import React, { useState, useEffect } from "react";
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
  const [fundamentalData, setFundamentalData] =
    useState<FundamentalAnalysisResponse | null>(null);
  const [comprehensiveData, setComprehensiveData] =
    useState<ComprehensiveAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTechnicalData = async () => {
      try {
        const data = await getAnalysis("AMZN");
        setChartData(transformData(data));
      } catch (err) {
        setError("Erreur lors du chargement des données techniques.");
      }
    };

    const fetchFundamentalData = async () => {
      try {
        const data = await getFundamentalAnalysis("AMZN");
        setFundamentalData(data);
      } catch (err) {
        setError("Erreur lors du chargement des données fondamentales.");
      }
    };

    const fetchComprehensiveData = async () => {
      try {
        const data = await getComprehensiveAnalysis("AMZN");
        setComprehensiveData(data);
      } catch (err) {
        setError(
          "Erreur lors du chargement des données de l'analyse complète."
        );
      }
    };

    fetchTechnicalData();
    fetchFundamentalData();
    fetchComprehensiveData();
  }, []);

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

  return (
    <div className="w-[70vw] h-[100vh] bg-white shadow-lg rounded-lg p-6 overflow-y-auto mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Financial Dashboard
      </h1>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

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
    </div>
  );
};

export default App;
