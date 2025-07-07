import React, { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';

export const ColumnSelector = ({
  columns,
  toggleColumnVisibility
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = event => {
      if (isOpen && !event.target.closest('.column-selector')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return <div className="relative column-selector">
      <button 
        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="w-4 h-4 mr-2" />
        <span className="font-semibold">Identifiers</span>
        <span className="ml-2 text-blue-200">({columns.filter(col => col.isVisible).length})</span>
      </button>
      {isOpen && <div className="absolute left-0 z-10 mt-2 w-72 origin-top-left rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200">
          <div className="py-2">
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Choose Data Columns</h4>
              <p className="text-xs text-gray-500">Select which provider information to display in your results</p>
            </div>
            {columns.map(column => <div 
                key={column.id} 
                className={`flex items-center px-4 py-3 text-sm cursor-pointer transition-colors duration-150 hover:bg-gray-50 ${
                  column.isVisible 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : ''
                }`}
                onClick={() => toggleColumnVisibility(column.id)}
              >
                <div className={`w-4 h-4 mr-3 rounded border-2 flex items-center justify-center transition-colors ${
                  column.isVisible 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}>
                  {column.isVisible && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-sm ${column.isVisible ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                    {column.Header}
                  </span>
                  {column.id === 'firstName' && (
                    <p className="text-xs text-gray-500 mt-0.5">Provider's first name</p>
                  )}
                  {column.id === 'lastName' && (
                    <p className="text-xs text-gray-500 mt-0.5">Provider's last name</p>
                  )}
                  {column.id === 'npi' && (
                    <p className="text-xs text-gray-500 mt-0.5">National Provider Identifier</p>
                  )}
                  {column.id === 'attestationStatus' && (
                    <p className="text-xs text-gray-500 mt-0.5">Current attestation status</p>
                  )}
                  {column.id === 'lastAttestationDate' && (
                    <p className="text-xs text-gray-500 mt-0.5">Most recent attestation date</p>
                  )}
                  {column.id === 'specialty' && (
                    <p className="text-xs text-gray-500 mt-0.5">Medical specialty or area of practice</p>
                  )}
                  {column.id === 'primaryPracticeState' && (
                    <p className="text-xs text-gray-500 mt-0.5">Main state of practice</p>
                  )}
                  {column.id === 'otherPracticeStates' && (
                    <p className="text-xs text-gray-500 mt-0.5">Additional states of practice</p>
                  )}
                </div>
                {column.isAlwaysVisible && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
                    Required
                  </span>
                )}
              </div>)}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-600 text-center">
                ✨ Tip: Columns are automatically selected based on your search queries
              </p>
            </div>
          </div>
        </div>}
    </div>;
};