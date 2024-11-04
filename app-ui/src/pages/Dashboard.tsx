import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tab";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import TechnicalAnalysisCharts from "../components/TechnicalAnalysisCharts";
import FundamentalAnalysisTables from "../components/FundamentalAnalysisTables";
import ComprehensiveAnalysisDetails from "../components/ComprehensiveAnalysisDetails";
import ChatWidget from "../components/chatWidget";
import SentimentPopup from "@/components/SentimentPopup";
import { TrendingUp, ChartBar, BarChart3, FileText, Download } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getAnalysis,
  getFundamentalAnalysis,
  ApiResponse,
  getSentimentAnalysis,
  // getAnnualReportSummary,
  FundamentalAnalysisResponse,
} from "../services/apiService";
import {
  getComprehensiveAnalysis,
  ComprehensiveAnalysisResponse,
} from "../services/comprehensiveAnalysisService";
import logo from "../assets/logo.webp";

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
  const [companyLongName, setCompanyLongName] = useState<string>("");
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [fundamentalData, setFundamentalData] =
    useState<FundamentalAnalysisResponse | null>(null);
  const [comprehensiveData, setComprehensiveData] =
    useState<ComprehensiveAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isLoadingSentiment, setIsLoadingSentiment] = useState(false);
  const [showAnnualReport, setShowAnnualReport] = useState(false);
  const [annualReportData, setAnnualReportData] = useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCompanyLongName = async () => {
      if (companyName) {
        try {
          const data = await getComprehensiveAnalysis(companyName);
          setCompanyLongName(data.analysis.info.longName || companyName);
        } catch (err) {
          console.error("Error fetching company long name:", err);
          setCompanyLongName(companyName);
        }
      }
    };

    fetchCompanyLongName();
  }, [companyName]);

  useEffect(() => {
    const fetchTechnicalData = async () => {
      if (companyName) {
        try {
          const data = await getAnalysis(companyName);
          setChartData(transformData(data));
        } catch (err) {
          setError("Error loading technical data.");
        }
      }
    };

    const fetchFundamentalData = async () => {
      if (companyName) {
        try {
          const data = await getFundamentalAnalysis(companyName);
          setFundamentalData(data);
        } catch (err) {
          setError("Error loading fundamental data.");
        }
      }
    };

    const fetchComprehensiveData = async () => {
      if (companyName) {
        try {
          const data = await getComprehensiveAnalysis(companyName);
          setComprehensiveData(data);
        } catch (err) {
          setError("Error loading comprehensive analysis data.");
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
        const sentiment = await getSentimentAnalysis(companyName, companyLongName);
        setSentimentData(sentiment);
      } catch (err) {
        setError("Error loading sentiment data.");
      } finally {
        setIsLoadingSentiment(false);
      }
    }
  };

  const handleAnnualReportClick = async () => {
    setShowAnnualReport(true);
    setIsLoadingReport(true);
    
    if (companyName) {
      try {
        // const summary = await getAnnualReportSummary(companyName);
        // setAnnualReportData(summary);
      } catch (err) {
        setError("Error loading annual report summary.");
      } finally {
        setIsLoadingReport(false);
      }
    }
  };

  const downloadAsPDF = () => {
    if (!annualReportData) return;

    const element = document.createElement("a");
    const file = new Blob([annualReportData], { type: "application/pdf" });
    element.href = URL.createObjectURL(file);
    element.download = `${companyName}_annual_report_summary.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container px-6 mx-auto">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <Link to="/home" className="flex items-center space-x-4">
              <img src={logo} alt="App Logo" className="w-auto h-12" />
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                STOCK OVERFLOW
              </span>
            </Link>

            {/* Company Name */}
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-800">
                {companyLongName || "Loading..."}
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={handleAnnualReportClick}
                className="inline-flex items-center justify-center px-5 py-3 space-x-3 text-white transition-all duration-300 bg-green-600 rounded-lg shadow-lg hover:bg-green-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <FileText className="w-5 h-5" />
                <span className="text-lg font-medium">Annual Report</span>
              </Button>

              <Button
                onClick={handleSentimentClick}
                className="inline-flex items-center justify-center px-5 py-3 space-x-3 text-white transition-all duration-300 bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="text-lg font-medium">Market Sentiment</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="container px-6 mx-auto mt-4">
          <div className="px-6 py-3 border-l-4 border-red-500 bg-red-50">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container flex-1 px-6 py-6 mx-auto">
        <Card className="h-full bg-white rounded-lg shadow">
          <CardContent className="h-full p-0">
            <Tabs defaultValue="technical" className="w-full h-full">
              <div className="border-b border-gray-200">
                <TabsList className="flex p-4 space-x-1">
                  <TabsTrigger
                    value="comprehensive"
                    className="inline-flex items-center px-4 py-2 transition-colors duration-150 rounded-lg hover:bg-gray-100"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Comprehensive Analysis
                  </TabsTrigger>
                  <TabsTrigger
                    value="fundamental"
                    className="inline-flex items-center px-4 py-2 transition-colors duration-150 rounded-lg hover:bg-gray-100"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Fundamental Analysis
                  </TabsTrigger>
                  <TabsTrigger
                    value="technical"
                    className="inline-flex items-center px-4 py-2 transition-colors duration-150 rounded-lg hover:bg-gray-100"
                  >
                    <ChartBar className="w-4 h-4 mr-2" />
                    Technical Analysis
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 h-[calc(100%-64px)] overflow-y-auto">
                <TabsContent value="technical" className="h-full mt-0">
                  {chartData ? (
                    <TechnicalAnalysisCharts data={chartData} />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-gray-500">Loading technical analysis...</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="fundamental" className="h-full mt-0">
                  {fundamentalData ? (
                    <FundamentalAnalysisTables data={fundamentalData} />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-gray-500">Loading fundamental analysis...</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="comprehensive" className="h-full mt-0">
                  {comprehensiveData ? (
                    <ComprehensiveAnalysisDetails data={comprehensiveData} />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <p className="text-gray-500">Loading comprehensive analysis...</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Chat Widget */}
      <ChatWidget />

      {/* Sentiment Popup */}
      {isPopupOpen && (
        <SentimentPopup
          data={sentimentData}
          onClose={closePopup}
          isLoading={isLoadingSentiment}
        />
      )}

      {/* Annual Report Dialog */}
      <Dialog open={showAnnualReport} onOpenChange={setShowAnnualReport}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Annual Report Summary - {companyLongName}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {isLoadingReport ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading annual report summary...</p>
              </div>
            ) : (
              <>
                <div className="prose max-w-none">
                  <pre className="text-sm whitespace-pre-wrap">{annualReportData}</pre>
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={downloadAsPDF}
                    className="inline-flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;