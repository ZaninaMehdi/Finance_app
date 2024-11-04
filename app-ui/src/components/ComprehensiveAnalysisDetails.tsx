import React, { useState } from "react";
import { Pie } from "react-chartjs-2";
import { ComprehensiveAnalysisResponse } from "../services/comprehensiveAnalysisService";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ComprehensiveAnalysisDetailsProps {
  data: ComprehensiveAnalysisResponse;
}

// Fonction pour formater les grands nombres en K, M, B
const formatNumber = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + "B";
  } else if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + "M";
  } else if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(2) + "K";
  } else {
    return value.toFixed(2);
  }
};

const formatValue = (value: any) =>
  value === null || value === undefined || isNaN(value)
    ? "N/A"
    : typeof value === "number"
    ? formatNumber(value)
    : value;

const getPeriodLabel = (period: string) => {
  switch (period) {
    case "0m":
      return "Current Month";
    case "-1m":
      return "One Month Ago";
    case "-2m":
      return "Two Months Ago";
    case "-3m":
      return "Three Months Ago";
    default:
      return period;
  }
};

const renderPieChart = (recommendation: any) => {
  const chartData = {
    labels: ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"],
    datasets: [
      {
        label: "Recommendations",
        data: [
          recommendation.strongBuy,
          recommendation.buy,
          recommendation.hold,
          recommendation.sell,
          recommendation.strongSell,
        ],
        backgroundColor: [
          "#4CAF50",
          "#8BC34A",
          "#FFC107",
          "#FF9800",
          "#F44336",
        ],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="md:w-1/4 w-1/2 p-2" key={recommendation.period}>
      <h4 className="font-semibold text-center">
        {getPeriodLabel(recommendation.period)}
      </h4>
      <Pie data={chartData} />
    </div>
  );
};

const renderMetricAccordion = (
  metricName: string,
  items: { index: string; [key: string]: any }[]
) => (
  <AccordionItem key={metricName} value={metricName}>
    <AccordionTrigger>
      <h4 className="text-lg font-semibold">{metricName}</h4>
    </AccordionTrigger>
    <AccordionContent>
      <table className="min-w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-md">
        <thead>
          <tr>
            <th className="px-4 py-2 font-medium text-left text-gray-600 bg-gray-100 border-b border-gray-200">
              Metric
            </th>
            {Object.keys(items[0] || {})
              .filter((key) => key !== "index")
              .map((date) => (
                <th
                  key={date}
                  className="px-4 py-2 font-medium text-left text-gray-600 bg-gray-100 border-b border-gray-200"
                >
                  {date.split(" ")[0]} {/* Removes the " 00:00:00" */}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="px-4 py-2 font-semibold border-b border-gray-200">
                {item.index}
              </td>
              {Object.keys(item)
                .filter((key) => key !== "index")
                .map((key) => (
                  <td key={key} className="px-4 py-2 border-b border-gray-200">
                    {formatValue(item[key])}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </AccordionContent>
  </AccordionItem>
);

const ComprehensiveAnalysisDetails: React.FC<
  ComprehensiveAnalysisDetailsProps
> = ({ data }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const info = data.analysis.info;

  const handleShowMore = () => setIsPopupOpen(true);
  const handleClosePopup = () => setIsPopupOpen(false);

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Comprehensive Analysis</h2>
      <div className="bg-gray-50 p-4 mb-4 border border-gray-200 rounded-lg">
        <h3 className="text-xl font-semibold">Company Information</h3>
        <p>
          <strong>Name:</strong> {info.longName}
        </p>
        <p>
          <strong>Sector:</strong> {info.sectorDisp}
        </p>
        <p>
          <strong>Industry:</strong> {info.industryDisp}
        </p>
        <p>
          <strong>Current Price:</strong> ${formatValue(info.currentPrice)}
        </p>
        <p>
          <strong>Volume:</strong> {formatValue(info.volume)}
        </p>
        <p>
          <strong>Market Cap:</strong> {formatValue(info.marketCap)}
        </p>

        {/* Button to show more details */}
        <button
          onClick={handleShowMore}
          className="hover:bg-blue-600 px-4 py-2 mt-4 text-white bg-blue-500 rounded"
        >
          Afficher plus de détails
        </button>
      </div>

      {/* Popup with detailed information */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative p-8 bg-white rounded-lg shadow-lg w-3/4 max-h-[80vh] overflow-y-auto">
            <button
              onClick={handleClosePopup}
              className="top-4 right-4 absolute text-lg font-bold text-red-500"
            >
              &times;
            </button>
            <h3 className="mb-4 text-2xl font-semibold">
              Détails complets de l'entreprise
            </h3>

            {/* Display all info attributes here */}
            <div className="grid grid-cols-2 gap-4">
              <p>
                <strong>Nom:</strong> {info.longName}
              </p>
              <p>
                <strong>Secteur:</strong> {info.sectorDisp}
              </p>
              <p>
                <strong>Industrie:</strong> {info.industryDisp}
              </p>
              <p>
                <strong>Adresse:</strong> {info.address1}, {info.city},{" "}
                {info.state}, {info.zip}, {info.country}
              </p>
              <p>
                <strong>Téléphone:</strong> {info.phone}
              </p>
              <p>
                <strong>Site Web:</strong>{" "}
                <a
                  href={info.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {info.website}
                </a>
              </p>
              <p>
                <strong>Prix actuel:</strong> ${formatValue(info.currentPrice)}
              </p>
              <p>
                <strong>Volume:</strong> {formatValue(info.volume)}
              </p>
              <p>
                <strong>Capitalisation boursière:</strong>{" "}
                {formatValue(info.marketCap)}
              </p>
              <p>
                <strong>Employés:</strong> {formatValue(info.fullTimeEmployees)}
              </p>
              <p>
                <strong>Dividende:</strong> {formatValue(info.dividendRate)}
              </p>
              <p>
                <strong>Rendement des dividendes:</strong>{" "}
                {formatValue(info.dividendYield)}
              </p>
              <p>
                <strong>Ratio de distribution:</strong>{" "}
                {formatValue(info.payoutRatio)}
              </p>
              <p>
                <strong>Beta:</strong> {info.beta}
              </p>
              <p>
                <strong>PE Trailing:</strong> {info.trailingPE}
              </p>
              <p>
                <strong>PE Forward:</strong> {info.forwardPE}
              </p>
              <p>
                <strong>52-Week High:</strong>{" "}
                {formatValue(info.fiftyTwoWeekHigh)}
              </p>
              <p>
                <strong>52-Week Low:</strong>{" "}
                {formatValue(info.fiftyTwoWeekLow)}
              </p>
              <p>
                <strong>Valeur comptable:</strong> {formatValue(info.bookValue)}
              </p>
              <p>
                <strong>Prix/Valeur comptable:</strong>{" "}
                {formatValue(info.priceToBook)}
              </p>
              <p>
                <strong>Revenu total:</strong> {formatValue(info.totalRevenue)}
              </p>
              <p>
                <strong>Marge brute:</strong> {info.grossMargins}
              </p>
              <p>
                <strong>Marge opérationnelle:</strong> {info.operatingMargins}
              </p>
              <p>
                <strong>Retour sur les actifs:</strong> {info.returnOnAssets}
              </p>
              <p>
                <strong>Retour sur les capitaux propres:</strong>{" "}
                {info.returnOnEquity}
              </p>
              <p>
                <strong>Dette totale:</strong> {formatValue(info.totalDebt)}
              </p>
              <p>
                <strong>Dette/Capitaux propres:</strong> {info.debtToEquity}
              </p>
              <p>
                <strong>Cashflow opérationnel:</strong>{" "}
                {formatValue(info.operatingCashflow)}
              </p>
              <p>
                <strong>Free Cashflow:</strong> {formatValue(info.freeCashflow)}
              </p>
              <p>
                <strong>Actions en circulation:</strong>{" "}
                {formatValue(info.sharesOutstanding)}
              </p>
              <p>
                <strong>Actions flottantes:</strong>{" "}
                {formatValue(info.floatShares)}
              </p>
              <p>
                <strong>Ratio de short:</strong> {info.shortRatio}
              </p>
              <p>
                <strong>Recommandation moyenne:</strong>{" "}
                {info.recommendationMean}
              </p>
              <p>
                <strong>Prix cible haut:</strong>{" "}
                {formatValue(info.targetHighPrice)}
              </p>
              <p>
                <strong>Prix cible bas:</strong>{" "}
                {formatValue(info.targetLowPrice)}
              </p>
              <p>
                <strong>Prix cible moyen:</strong>{" "}
                {formatValue(info.targetMeanPrice)}
              </p>
              <p>
                <strong>Prix cible médian:</strong>{" "}
                {formatValue(info.targetMedianPrice)}
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="mt-4">
        <h3 className="text-xl font-semibold">Recommendations</h3>
        <div className="flex flex-wrap">
          {data.analysis.recommendations.map((recommendation) =>
            renderPieChart(recommendation)
          )}
        </div>
      </section>

      <section className="mt-4">
        <Accordion type="single" collapsible>
          {renderMetricAccordion("Financials", data.analysis.financials)}
        </Accordion>
      </section>

      <section className="mt-4">
        <Accordion type="single" collapsible>
          {renderMetricAccordion("Balance Sheet", data.analysis.balance_sheet)}
        </Accordion>
      </section>

      <section className="mt-4">
        <Accordion type="single" collapsible>
          {renderMetricAccordion("Cash Flow", data.analysis.cashflow)}
        </Accordion>
      </section>
    </div>
  );
};

export default ComprehensiveAnalysisDetails;
