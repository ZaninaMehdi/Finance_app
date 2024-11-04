import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './SideBar';
import { uploadPdfForSummary } from '@/services/uploadService';

const Search = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSearch = async () => {
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm.length === 0) {
      setError('Please enter a valid company name.');
      return;
    }
    setError('');
    
    try {
      // Format the search term
      const formatString = (input: string): string => {
        return input
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-');
      };
      
      const formattedSearchTerm = formatString(trimmedSearchTerm);
      
      // If there's a file, upload it first
      if (file) {
        setIsUploading(true);
        try {
          const response = await uploadPdfForSummary(file, formattedSearchTerm);
          console.log('Upload response:', response);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          setError('Failed to upload file. Please try again.');
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
  
      // Proceed with navigation regardless of file upload
      navigate(`/tech-analysis/${trimmedSearchTerm}`);
      
    } catch (error) {
      console.error('Error during search process:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError('');
    } else {
      setError("Please upload a valid PDF file");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected");
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      // await new Promise(resolve => setTimeout(resolve, 1000));
      setIsUploading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setIsUploading(false);
    }
  };

  return (<div>
    <Sidebar></Sidebar>
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Introduction Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Financial Analysis Dashboard</h1>
            <div className="prose text-gray-600">
              <p className="mb-4">
                Choose your analysis path:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    📄 Document-Enhanced Analysis
                  </h3>
                  <p className="text-sm text-blue-700">
                    Upload your PDF documents to unlock AI-powered insights. Our system will analyze your documents alongside market data for comprehensive intelligence with your personal AI Chat.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    📊 Standard Market Analysis
                  </h3>
                  <p className="text-sm text-green-700">
                    Proceed without document upload to access our suite of financial metrics, including market sentiment analysis and performance graphs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Upload PDF Document (Recommended)
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="flex-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                    !file || isUploading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white"></div>
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                      </svg>
                      Upload
                    </div>
                  )}
                </button>
              </div>
              {file && !isUploading && (
                <div className="text-sm text-green-600">
                  ✓ {file.name} selected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Search Company
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Enter company name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium min-w-[120px] justify-center bg-blue-600 text-white hover:bg-blue-700"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    Search
                  </div>
                </button>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Search;