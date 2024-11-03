// src/components/FundamentalAnalysisTables.tsx
import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface Metric {
  value: number | null;
  period: string;
}

interface FundamentalAnalysisData {
  company: string;
  analysis: {
    growth_metrics: {
      time_series: string[];
      metrics: {
        revenue_growth: Metric[];
        net_income_growth: Metric[];
        eps_growth: Metric[];
        operating_income_growth: Metric[];
      };
    };
    profitability_metrics: {
      time_series: string[];
      metrics: {
        gross_margin: Metric[];
        operating_margin: Metric[];
        net_margin: Metric[];
        roa: Metric[];
        roe: Metric[];
        roic: Metric[];
      };
    };
    efficiency_metrics: {
      time_series: string[];
      metrics: {
        asset_turnover: Metric[];
        inventory_turnover: Metric[];
        receivables_turnover: Metric[];
        payables_turnover: Metric[];
      };
    };
  };
}

interface FundamentalAnalysisTablesProps {
  data: FundamentalAnalysisData;
}

const FundamentalAnalysisTables: React.FC<FundamentalAnalysisTablesProps> = ({
  data,
}) => {
  const formatValue = (value: number | null) =>
    value !== null && !isNaN(value) ? value.toFixed(2) : "N/A";

  const renderMetricAccordion = (metricName: string, metrics: Metric[]) => (
    <AccordionItem key={metricName} value={metricName}>
      <AccordionTrigger>
        <h4 className="text-lg font-semibold">{metricName}</h4>
      </AccordionTrigger>
      <AccordionContent>
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md mt-2">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-left font-medium text-gray-600">
                Period
              </th>
              <th className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-left font-medium text-gray-600">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <tr
                key={index}
                className={`${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                } hover:bg-gray-100`}
              >
                <td className="px-4 py-2 border-b border-gray-200">
                  {metric.period.split(" ")[0]}
                </td>{" "}
                {/* Removes the "00:00:00" */}
                <td className="px-4 py-2 border-b border-gray-200">
                  {formatValue(metric.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AccordionContent>
    </AccordionItem>
  );

  const { growth_metrics, profitability_metrics, efficiency_metrics } =
    data.analysis;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">
        Fundamental Analysis Tables for {data.company}
      </h2>

      {/* Growth Metrics */}
      <h3 className="text-xl font-semibold mb-4">Growth Metrics</h3>
      <Accordion type="single" collapsible>
        {renderMetricAccordion(
          "Revenue Growth",
          growth_metrics.metrics.revenue_growth
        )}
        {renderMetricAccordion(
          "Net Income Growth",
          growth_metrics.metrics.net_income_growth
        )}
        {renderMetricAccordion("EPS Growth", growth_metrics.metrics.eps_growth)}
        {renderMetricAccordion(
          "Operating Income Growth",
          growth_metrics.metrics.operating_income_growth
        )}
      </Accordion>

      {/* Profitability Metrics */}
      <h3 className="text-xl font-semibold mb-4">Profitability Metrics</h3>
      <Accordion type="single" collapsible>
        {renderMetricAccordion(
          "Gross Margin",
          profitability_metrics.metrics.gross_margin
        )}
        {renderMetricAccordion(
          "Operating Margin",
          profitability_metrics.metrics.operating_margin
        )}
        {renderMetricAccordion(
          "Net Margin",
          profitability_metrics.metrics.net_margin
        )}
        {renderMetricAccordion(
          "Return on Assets (ROA)",
          profitability_metrics.metrics.roa
        )}
        {renderMetricAccordion(
          "Return on Equity (ROE)",
          profitability_metrics.metrics.roe
        )}
        {renderMetricAccordion(
          "Return on Invested Capital (ROIC)",
          profitability_metrics.metrics.roic
        )}
      </Accordion>

      {/* Efficiency Metrics */}
      <h3 className="text-xl font-semibold mb-4">Efficiency Metrics</h3>
      <Accordion type="single" collapsible>
        {renderMetricAccordion(
          "Asset Turnover",
          efficiency_metrics.metrics.asset_turnover
        )}
        {renderMetricAccordion(
          "Inventory Turnover",
          efficiency_metrics.metrics.inventory_turnover
        )}
        {renderMetricAccordion(
          "Receivables Turnover",
          efficiency_metrics.metrics.receivables_turnover
        )}
        {renderMetricAccordion(
          "Payables Turnover",
          efficiency_metrics.metrics.payables_turnover
        )}
      </Accordion>
    </div>
  );
};

export default FundamentalAnalysisTables;
