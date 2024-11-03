// src/components/TechnicalAnalysisCharts.tsx
import React from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./TechnicalAnalysisCharts.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  Date: string[];
  Close: number[];
  Volume: number[];
  RSI: number[];
  MACD: number[];
  MACD_hist: number[];
}

interface TechnicalAnalysisChartsProps {
  data: ChartData;
}

const TechnicalAnalysisCharts: React.FC<TechnicalAnalysisChartsProps> = ({
  data,
}) => {
  return (
    <div className="chart-container">
      <h2>Technical Analysis Charts</h2>

      {/* Close Price Chart */}
      <div className="chart-item">
        <Line
          data={{
            labels: data.Date,
            datasets: [
              {
                label: "Close Price",
                data: data.Close,
                borderColor: "blue",
                fill: false,
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>

      {/* Volume Chart */}
      <div className="chart-item">
        <Line
          data={{
            labels: data.Date,
            datasets: [
              {
                label: "Volume",
                data: data.Volume,
                borderColor: "orange",
                fill: false,
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>

      {/* RSI Chart */}
      <div className="chart-item">
        <Line
          data={{
            labels: data.Date,
            datasets: [
              {
                label: "RSI",
                data: data.RSI,
                borderColor: "green",
                fill: false,
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>

      {/* MACD Chart */}
      <div className="chart-item">
        <Line
          data={{
            labels: data.Date,
            datasets: [
              {
                label: "MACD",
                data: data.MACD,
                borderColor: "purple",
                fill: false,
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>

      {/* MACD Histogram Chart */}
      <div className="chart-item">
        <Bar
          data={{
            labels: data.Date,
            datasets: [
              {
                label: "MACD Histogram",
                data: data.MACD_hist,
                backgroundColor: "red",
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>
    </div>
  );
};

export default TechnicalAnalysisCharts;
