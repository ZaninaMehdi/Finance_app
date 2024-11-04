import React, { useState } from 'react';
import { uploadPdfForSummary } from '@/services/uploadService';
import { useNavigate, Link } from 'react-router-dom';
import logo from "../assets/logo.webp";
import { uploadPdfForSummary } from '@/services/uploadService';

const Search = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header with Logo */}
      <header className="bg-white border-b border-gray-200">
        <div className="container px-6 mx-auto">
          <div className="flex items-center h-20">
            <Link to="/search" className="flex items-center space-x-4">
              <img src={logo}  alt="Stock Overflow Logo" className="w-auto h-12" />
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                STOCK OVERFLOW
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl px-4 pt-20 mx-auto sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Financial Analysis Made Simple
          </h1>
          <p className="max-w-md mx-auto mt-3 text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Discover comprehensive financial insights powered by AI. Search any company to get started with your custom-made AI Chat.
          </p>

          {/* Main Search Bar */}
          <div className="max-w-xl mx-auto mt-10">
            <div className="flex overflow-hidden rounded-lg shadow-lg">
              <input
                type="text"
                placeholder="Enter company ticker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-6 py-4 text-lg focus:outline-none"
              />
              <button
                onClick={handleSearch}
                className="px-8 text-white transition duration-150 ease-in-out bg-blue-600 hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>

          {error && (
            <div className="max-w-xl mx-auto mt-4">
              <div className="p-4 rounded-md bg-red-50">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Optional Upload Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 mx-auto text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showUpload ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              )}
            </svg>
            {showUpload ? 'Hide PDF Upload' : 'Enhance your analysis with a PDF document'}
          </button>

          {showUpload && (
            <div className="p-6 mt-4 bg-white rounded-lg shadow-sm">
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
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full animate-spin border-t-white"></div>
                        Uploading...
                      </div>
                    ) : (
                      'Upload'
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;