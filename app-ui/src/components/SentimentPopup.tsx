import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Loader2, BarChart2, Shield, Target, DollarSign, Newspaper, Link } from 'lucide-react';

const SentimentPopup = ({ data, onClose, isLoading }) => {
  const sentimentData = data?.data?.sentiment_analysis;
  const companyName = data?.data?.company_name;
  const sources = data?.data?.news_sources;
  const financialData = data?.data?.market_metrics?.current;
  const articles = data?.data?.recent_articles || [];
  // Modified Articles Section
  const NewsArticlesSection = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Source Articles</h3>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          {articles.length > 0 ? (
            articles.map((article, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4"
                >
                  <div className="flex-shrink-0 mt-1">
                    <Link className="w-4 h-4 text-blue-600 group-hover:text-blue-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-blue-600 group-hover:text-blue-800 mb-1 line-clamp-2">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="uppercase bg-gray-100 px-2 py-0.5 rounded">
                        {article.source}
                      </span>
                      <span>{article.published}</span>
                    </div>
                  </div>
                </a>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-gray-500">
              No articles available
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toUpperCase()) {
      case 'POSITIVE':
        return 'text-green-600';
      case 'NEGATIVE':
        return 'text-red-600';
      case 'NEUTRAL':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toUpperCase()) {
      case 'POSITIVE':
        return <TrendingUp className="w-8 h-8 text-green-600" />;
      case 'NEGATIVE':
        return <TrendingDown className="w-8 h-8 text-red-600" />;
      default:
        return <AlertCircle className="w-8 h-8 text-yellow-600" />;
    }
  };

  const formatNumber = (number) => {
    if (number >= 1e12) return `$${(number / 1e12).toFixed(2)}T`;
    if (number >= 1e9) return `$${(number / 1e9).toFixed(2)}B`;
    if (number >= 1e6) return `$${(number / 1e6).toFixed(2)}M`;
    return `$${number.toFixed(2)}`;
  };

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Analyzing Market Sentiment</h3>
      <div className="space-y-2 text-center">
        <p className="text-gray-600">Processing data from multiple sources:</p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            GNews ({sources?.gnews || 0})
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
            Yahoo ({sources?.yahoo_finance || 0})
          </div>
          <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
            News API ({sources?.newsapi || 0})
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-4/5 max-w-5xl h-4/5 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {!isLoading && getSentimentIcon(sentimentData?.combined_analysis?.overall_recommendation)}
              <h2 className="text-2xl font-bold text-gray-800">
                Market Analysis: {companyName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100%-4rem)]">
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              {/* Financial Data from Yahoo Finance */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Sentiments based on social and financial data</h3>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-500">Financial Sentiment</h3>
                    </div>
                    <p className={`text-lg font-bold ${getSentimentColor(sentimentData?.financial_sentiment?.overall)}`}>
                      {sentimentData?.financial_sentiment?.overall}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Newspaper className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-500">News Sentiment</h3>
                    </div>
                    <p className={`text-lg font-bold ${getSentimentColor(sentimentData?.news_sentiment?.overall)}`}>
                      {sentimentData?.news_sentiment?.overall}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-500">Recommendation</h3>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {sentimentData?.combined_analysis?.overall_recommendation}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-500">Confidence</h3>
                    </div>
                    <p className="text-lg font-bold text-gray-800">
                      {sentimentData?.combined_analysis?.confidence}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Key Financial Metrics</h3>
                  <span className="text-sm text-gray-500">(Source: Yahoo Finance)</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Market Cap</h4>
                    <p className="text-lg font-bold text-gray-800">{formatNumber(financialData?.market_cap)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">P/E Ratio</h4>
                    <p className="text-lg font-bold text-gray-800">{financialData?.pe_ratio?.toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Current Price</h4>
                    <p className="text-lg font-bold text-gray-800">${financialData?.current_price}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">52-Week Range</h4>
                    <p className="text-sm text-gray-800">
                      ${financialData?.fifty_two_week_low} - ${financialData?.fifty_two_week_high}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Analysis Summary</h3>
                <p className="text-gray-600 bg-white p-4 rounded-lg border border-gray-200">
                  {sentimentData?.combined_analysis?.summary}
                </p>
              </div>

              {/* Source Analysis */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Source Sentiment Analysis</h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Yahoo Finance</h4>
                      <p className={`font-medium ${getSentimentColor(sentimentData?.news_sentiment?.source_analysis?.yahoo_finance)}`}>
                        {sentimentData?.news_sentiment?.source_analysis?.yahoo_finance}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">News API</h4>
                      <p className={`font-medium ${getSentimentColor(sentimentData?.news_sentiment?.source_analysis?.newsapi)}`}>
                        {sentimentData?.news_sentiment?.source_analysis?.newsapi}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">GNews</h4>
                      <p className={`font-medium ${getSentimentColor(sentimentData?.news_sentiment?.source_analysis?.gnews)}`}>
                        {sentimentData?.news_sentiment?.source_analysis?.gnews}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combined Market Perception, Risk Assessment in one row */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Market Perception */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Market Perception</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-gray-500">Overall Market View:</span>
                    <span className={`font-medium ${getSentimentColor(sentimentData?.news_sentiment?.market_perception)}`}>
                      {sentimentData?.news_sentiment?.market_perception}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Notable Events</h4>
                    <ul className="space-y-2">
                      {sentimentData?.news_sentiment?.notable_events?.map((event, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-gray-600">{event}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Risk Assessment</h3>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-500">Risk Level:</span>
                    <span className="ml-2 font-medium text-orange-500">
                      {sentimentData?.combined_analysis?.risk_assessment?.risk_level}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {sentimentData?.combined_analysis?.risk_assessment?.key_risks.map((risk, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span className="text-sm text-gray-600">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Topics */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">News Topics & Trends</h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {sentimentData?.news_sentiment?.key_topics?.map((topic, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <NewsArticlesSection />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentimentPopup;