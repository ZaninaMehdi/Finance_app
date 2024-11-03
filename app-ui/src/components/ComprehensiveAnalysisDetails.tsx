import React from "react";
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

// Mettre à jour formatValue pour utiliser formatNumber pour les nombres
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
    <div className="w-1/2 md:w-1/4 p-2" key={recommendation.period}>
      <h4 className="text-center font-semibold">
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
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md mt-2">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-left font-medium text-gray-600">
              Metric
            </th>
            {Object.keys(items[0] || {})
              .filter((key) => key !== "index")
              .map((date) => (
                <th
                  key={date}
                  className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-left font-medium text-gray-600"
                >
                  {date.split(" ")[0]} {/* Removes the " 00:00:00" */}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="px-4 py-2 border-b border-gray-200 font-semibold">
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
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Comprehensive Analysis</h2>
      <p>
        <strong>Company:</strong> {data.company}
      </p>

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
