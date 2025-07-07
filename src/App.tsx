import React, { useEffect, useState } from 'react';
import { ProviderTable } from './components/ProviderTable';
import { ColumnSelector } from './components/ColumnSelector';
import { TableHeader } from './components/TableHeader';
import { mockData } from './utils/data';
import { processNaturalLanguageSearch } from './utils/searchProcessor';
import { SqlModal } from './components/SqlModal';
import { generateSql } from './utils/sqlGenerator';
import { Bot, Lightbulb, X, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

export function App() {
  const [data] = useState(mockData);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [demoHidden, setDemoHidden] = useState(false);

  // Demo suggestions for users - Wayfinders pattern
  const demoQuestions = [
    "Which providers have recently attested?",
    "Show me providers in California",
    "Find specialists by type",
    "Who needs to update their attestation?"
  ];

  // Modified allColumns to include isAlwaysVisible property
  const allColumns = [{
    id: 'firstName',
    Header: 'Provider First Name',
    accessor: 'firstName',
    isVisible: true,
    isAlwaysVisible: true
  }, {
    id: 'lastName',
    Header: 'Provider Last Name',
    accessor: 'lastName',
    isVisible: true,
    isAlwaysVisible: true
  }, {
    id: 'npi',
    Header: 'NPI',
    accessor: 'npi',
    isVisible: true,
    isAlwaysVisible: true
  }, {
    id: 'attestationStatus',
    Header: 'Attestation Status',
    accessor: 'attestationStatus',
    isVisible: false,
    isAlwaysVisible: false
  }, {
    id: 'lastAttestationDate',
    Header: 'Last Attestation Date',
    accessor: 'lastAttestationDate',
    isVisible: false,
    isAlwaysVisible: false
  }, {
    id: 'specialty',
    Header: 'Specialty',
    accessor: 'specialty',
    isVisible: false,
    isAlwaysVisible: false
  }, {
    id: 'primaryPracticeState',
    Header: 'Primary Practice State',
    accessor: 'primaryPracticeState',
    isVisible: false,
    isAlwaysVisible: false
  }, {
    id: 'otherPracticeStates',
    Header: 'Other Practice State(s)',
    accessor: 'otherPracticeStates',
    isVisible: false,
    isAlwaysVisible: false
  }];

  const [visibleColumns, setVisibleColumns] = useState(allColumns);

  // Initialize from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryFromUrl = urlParams.get('q');
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
      const result = processNaturalLanguageSearch(queryFromUrl, data);
      setSearchResult(result);
      setIsFirstVisit(false);
      setShowDemo(false);
    }
  }, [data]);

  // Listen for browser back/forward events
  useEffect(() => {
    const handlePopState = (event) => {
      const urlParams = new URLSearchParams(window.location.search);
      const queryFromUrl = urlParams.get('q') || '';
      
      setSearchQuery(queryFromUrl);
      if (queryFromUrl) {
        const result = processNaturalLanguageSearch(queryFromUrl, data);
        setSearchResult(result);
        setShowDemo(false);
        setIsFirstVisit(false);
      } else {
        setSearchResult(null);
        setShowDemo(true);
        setIsFirstVisit(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [data]);

  // Update column visibility based on search results and filters
  useEffect(() => {
    if (searchResult && searchResult.relevantColumns) {
      setVisibleColumns(visibleColumns.map(column => ({
        ...column,
        isVisible: column.isAlwaysVisible || searchResult.relevantColumns?.includes(column.accessor) || false
      })));
    }
  }, [searchResult]);

  const toggleColumnVisibility = columnId => {
    setVisibleColumns(visibleColumns.map(column => column.id === columnId ? {
      ...column,
      isVisible: !column.isVisible
    } : column));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const result = processNaturalLanguageSearch(query, data);
    setSearchResult(result);
    setIsFirstVisit(false);
    
    // Update browser URL and history
    const url = new URL(window.location);
    if (query) {
      url.searchParams.set('q', query);
      setShowDemo(false);
    } else {
      url.searchParams.delete('q');
      setShowDemo(true);
    }
    window.history.pushState({ query }, '', url);
    
    // Hide demo after first search to reduce clutter
    if (query.length > 0) {
      setShowDemo(false);
    }
  };

  const handleDemoClick = (question: string) => {
    handleSearch(question);
  };

  const handleFollowUpClick = (question: string) => {
    handleSearch(question);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchResult(null);
    setShowDemo(true);
    setIsFirstVisit(true);
    setDemoHidden(false);
    
    // Update browser URL
    const url = new URL(window.location);
    url.searchParams.delete('q');
    window.history.pushState({}, '', url);
  };

  const handleHideDemo = () => {
    setDemoHidden(true);
    setShowDemo(false);
  };

  const handleShowDemo = () => {
    setDemoHidden(false);
    setShowDemo(true);
  };

  const displayData = searchResult?.filteredData || data;
  const currentSql = generateSql(searchQuery, displayData === data ? {} : {
    attestationStatus: searchQuery
  }, searchResult?.sort || {
    key: null,
    direction: 'asc'
  });

  return <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* CAQH Logo - using image file */}
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/Caqh_logo (1).png" 
                alt="CAQH Logo" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  // Fallback to SVG if image not found
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              {/* Fallback SVG Logo */}
              <div className="w-10 h-10 bg-white rounded-lg p-2 flex items-center justify-center shadow-sm" style={{display: 'none'}}>
                <svg viewBox="0 0 100 40" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="40" rx="4" fill="#1e40af"/>
                  <text x="50" y="25" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">CAQH</text>
                  <circle cx="15" cy="12" r="3" fill="#60a5fa" opacity="0.8"/>
                  <circle cx="85" cy="28" r="2" fill="#60a5fa" opacity="0.6"/>
                  <rect x="75" y="8" width="3" height="8" rx="1.5" fill="#60a5fa" opacity="0.7"/>
                </svg>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="text-2xl font-bold hover:text-blue-200 transition-colors cursor-pointer"
            >
              Provider Data Portal
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Provider Search Results
            </h2>
            <p className="text-gray-500">
              Generated today at {new Date().toLocaleTimeString()}
            </p>
          </div>

          {/* Demo/Help Section - Wayfinders & Nudges patterns */}
          {(showDemo || isFirstVisit) && !demoHidden && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">AI-Powered Provider Search</h3>
                  <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                <button 
                  onClick={handleHideDemo}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-blue-700 mb-3">
                Ask any question about providers in natural language and get instant results. Try these examples:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {demoQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleDemoClick(question)}
                    className="text-left p-3 bg-white border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between group"
                  >
                    <span>"{question}"</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show Demo Button when hidden */}
          {demoHidden && (
            <div className="mb-6">
              <button
                onClick={handleShowDemo}
                className="flex items-center px-4 py-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Show AI Search Examples
              </button>
            </div>
          )}

          <div className="mb-4 flex flex-wrap justify-between items-center">
            <div className="flex space-x-4 mb-2 md:mb-0">
              <ColumnSelector columns={visibleColumns} toggleColumnVisibility={toggleColumnVisibility} />
              <button onClick={() => setIsSqlModalOpen(true)} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                View SQL
              </button>
            </div>
            
            {/* AI Search Input - Identifiers pattern */}
            <div className="relative flex-1 max-w-xl ml-4">
              <div className="relative">
                <div className="absolute left-3 top-2.5 flex items-center space-x-1">
                  <Bot className="w-5 h-5 text-blue-500" />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <input 
                  type="text" 
                  placeholder="Ask any questions" 
                  className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gradient-to-r from-white to-blue-50" 
                  value={searchQuery} 
                  onChange={e => handleSearch(e.target.value)} 
                />
              </div>
              {!searchQuery && demoHidden && (
                <button
                  onClick={handleShowDemo}
                  className="absolute right-2 top-2.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                >
                  Show examples
                </button>
              )}
            </div>
          </div>

          {/* AI Response Section */}
          {searchResult?.description && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg">
              <div className="flex items-start space-x-2 mb-2">
                <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    {searchResult.description}
                  </p>
                  {searchResult.response && (
                    <p className="text-sm text-blue-700 mb-3">
                      {searchResult.response}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Follow-up Questions - Follow up pattern */}
              {searchResult.followUpQuestions && searchResult.followUpQuestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                    Try asking:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchResult.followUpQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleFollowUpClick(question)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-full hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md group"
                      >
                        "{question}"
                        <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <ProviderTable data={displayData} columns={visibleColumns.filter(col => col.isVisible)} initialSort={searchResult?.sort} />
        </div>
      </main>
      <SqlModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} sql={currentSql} />
    </div>;
}