import React, { useState, useEffect } from 'react';
import './App.css';

interface RightSidebarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onReload: () => void;
}

interface ExcelInfo {
  totalRows: number;
  filteredRows: number;
  lastLoaded: string;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ 
  searchTerm, 
  setSearchTerm,
  onReload 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [excelInfo, setExcelInfo] = useState<ExcelInfo>({
    totalRows: 0,
    filteredRows: 0,
    lastLoaded: ''
  });

  // Listen for Excel info updates
  useEffect(() => {
    const handleExcelInfoUpdate = (event: CustomEvent<ExcelInfo>) => {
      setExcelInfo(event.detail);
    };

    // Add event listener
    document.addEventListener(
      'excel-info-updated', 
      handleExcelInfoUpdate as EventListener
    );

    // Clean up
    return () => {
      document.removeEventListener(
        'excel-info-updated', 
        handleExcelInfoUpdate as EventListener
      );
    };
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    onReload();
    // Reset loading state after a short delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const searchExamples = [
    "คอนกรีต", 
    "ขนาด 4 นิ้ว",
    "ผนัง",
    "ไฟฟ้า 220V",
    "สีทา"
  ];

  const handleExampleClick = (example: string) => {
    setSearchTerm(example);
  };

  return (
    <div className="right-sidebar">
      <h3>Search BOQ</h3>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search terms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <button 
          className="search-help-button"
          onClick={() => setShowSearchHelp(!showSearchHelp)}
        >
          ?
        </button>
      </div>
      
      {showSearchHelp && (
        <div className="search-help">
          <h4>Search Tips</h4>
          <ul>
            <li>Search is powered by Fuse.js for fuzzy matching</li>
            <li>Partial words will match similar terms</li>
            <li>Results are sorted by relevance</li>
            <li>First column has higher priority in search results</li>
          </ul>
        </div>
      )}

      {searchTerm && (
        <div className="search-info">
          <p>Searching for: <strong>{searchTerm}</strong></p>
          <button onClick={() => setSearchTerm('')}>Clear</button>
        </div>
      )}

      <div className="search-examples">
        <p>Try searching for:</p>
        <div className="example-tags">
          {searchExamples.map((example, index) => (
            <span 
              key={index} 
              className="example-tag"
              onClick={() => handleExampleClick(example)}
            >
              {example}
            </span>
          ))}
        </div>
      </div>
      
      <div className="sidebar-footer">
        <div className="excel-info">
          {excelInfo.totalRows > 0 && (
            <div className="info-row">
              <span>Total: {excelInfo.totalRows} rows</span>
              <span>Showing: {excelInfo.filteredRows}</span>
            </div>
          )}
          {excelInfo.lastLoaded && (
            <div className="last-loaded">Updated: {excelInfo.lastLoaded}</div>
          )}
        </div>
        
        <button 
          className="reload-button" 
          onClick={handleReload}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Reload Excel File'}
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;