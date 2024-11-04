import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const handleSearch = () => {
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm.length === 0) {
      setError('Please enter a valid company name.');
      return;
    }
    setError('');
    navigate(`/tech-analysis/${trimmedSearchTerm}`);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex items-center justify-center h-screen"> {/* Center content */}
      <div className="flex flex-col items-center w-full"> {/* Take full width */}
        <h1 className="text-7xl font-bold mb-10">Search for a Company</h1>
        <div className="bg-white w-2/3 mx-auto shadow-md rounded-lg overflow-hidden flex"> {/* Center input container */}
          <input
            type="text"
            placeholder="Type the company name..."
            className="px-8 py-5 border-0 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="bg-indigo-500 text-white px-6 py-4 text-xl"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default Search;
