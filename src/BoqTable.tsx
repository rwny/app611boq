import React, { useEffect, useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { readExcelFile } from './utils/excelUtils';
import './BoqTable.css';

interface BoqTableProps {
  searchTerm: string;
  reloadTrigger: number;
}

const BoqTable: React.FC<BoqTableProps> = ({ searchTerm, reloadTrigger }) => {
  const [data, setData] = useState<any[]>([]);
  const [columnWidths, setColumnWidths] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastLoaded, setLastLoaded] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Fuse.FuseResult<any>[]>([]);
  
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Add cache buster to URL to prevent caching
      const cacheBuster = new Date().getTime();
      const result = await readExcelFile(`/boq_all.xlsx?v=${cacheBuster}`);
      
      if (!result || result.length === 0) {
        console.warn("Excel data is empty or couldn't be loaded");
        setError("No data available. Please check Excel file.");
        setData([]);
        return;
      }
      
      setData(result);
      
      // Set initial column widths based on the data
      if (result.length > 0) {
        const headers = Object.keys(result[0]);
        const initialWidths: {[key: string]: string} = {};
        
        headers.forEach((header, index) => {
          if (index === 0) {
            initialWidths[header] = 'col-first';
          } 
          // Determine width based on header text or common sense for data types
          else if (header.length < 8) {
            initialWidths[header] = 'col-width-small';
          } else if (header.length < 15) {
            initialWidths[header] = 'col-width-medium';
          } else if (header.length < 25) {
            initialWidths[header] = 'col-width-large';
          } else {
            initialWidths[header] = 'col-width-xl';
          }
        });
        
        setColumnWidths(initialWidths);
      }
      
      // Set last loaded timestamp
      const now = new Date();
      setLastLoaded(now.toLocaleTimeString());
    } catch (error) {
      console.error('Error loading Excel file:', error);
      setError("Failed to load data. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Setup Fuse.js for fuzzy searching
  const fuse = useMemo(() => {
    if (!data.length) return null;
    
    // Get all the keys (column headers) from the first row
    const keys = Object.keys(data[0]).map((key, index) => ({
      name: key,
      // Give more weight to the second column (index 1)
      weight: index === 1 ? 3 : index === 0 ? 2 : 1
    }));
    
    return new Fuse(data, {
      keys,
      includeScore: true,
      threshold: 0.4, // Lower threshold = stricter matching (0 to 1)
      ignoreLocation: true,
      useExtendedSearch: true,
      findAllMatches: true,
      shouldSort: true, // Sort by relevance
      minMatchCharLength: 2,
      includeMatches: true // Include match info for highlighting
    });
  }, [data]);

  // Helper function to highlight matching text in dark red
  const highlightText = (text: string, indices: readonly [number, number][]): React.ReactNode => {
    if (!indices || indices.length === 0) return text;
    
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    
    indices.forEach(([startIdx, endIdx]) => {
      // Add text before the match
      if (startIdx > lastIndex) {
        result.push(text.substring(lastIndex, startIdx));
      }
      
      // Add highlighted text
      result.push(
        <span key={`${startIdx}-${endIdx}`} className="search-highlight">
          {text.substring(startIdx, endIdx + 1)}
        </span>
      );
      
      lastIndex = endIdx + 1;
    });
    
    // Add any remaining text
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }
    
    return result;
  };

  // Filter data using Fuse.js
  const filteredData = useMemo(() => {
    if (!searchTerm.trim() || !fuse) {
      setSearchResults([]);
      return data;
    }
    
    const results = fuse.search(searchTerm);
    setSearchResults(results);
    return results.map(result => result.item);
  }, [fuse, searchTerm, data]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);
  
  // Reload when the trigger changes
  useEffect(() => {
    if (reloadTrigger > 0) {
      fetchData();
    }
  }, [reloadTrigger]);

  // Send data info to parent via custom event
  // This comes AFTER filteredData is defined
  useEffect(() => {
    if (filteredData !== undefined) {
      const infoEvent = new CustomEvent('excel-info-updated', { 
        detail: {
          totalRows: data.length,
          filteredRows: filteredData.length,
          lastLoaded: lastLoaded
        }
      });
      document.dispatchEvent(infoEvent);
    }
  }, [data, filteredData, lastLoaded]);

  return (
    <div className="boq-container">      
      <div className="boq-table-container">
        {isLoading && <div className="loading-overlay"><div className="loading-spinner"></div></div>}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {!error && data.length > 0 && (
          <table className="boq-table">
            <thead>
              <tr>
                {Object.keys(data[0]).map((key, i) => {
                  // Apply same width classes to headers as we do to cells
                  const headerClass = 
                    i === 0 ? 'align-left col-first' : 
                    i === 1 ? 'col-second' : 
                    columnWidths[key];
                  
                  return (
                    <th key={key} className={headerClass}>{key}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => {
                // Find the matching result for this row to get highlight information
                const resultMatch = searchResults.find(result => result.item === row);
                
                return (
                <tr key={index}>
                  {Object.entries(row).map(([key, value], i) => {
                    // Enhanced empty value check
                    const isEmpty = 
                      value === undefined || 
                      value === null || 
                      value === '' || 
                      value === 'undefined' || 
                      value === 'null' ||
                      (typeof value === 'string' && value.trim() === '') ||
                      (typeof value === 'number' && isNaN(value));
                    
                    // Apply appropriate column classes
                    const columnClass = 
                      i === 0 ? 'align-left col-first' : 
                      i === 1 ? 'col-second' : 
                      columnWidths[key];
                      
                    // Find matches for this specific field/column if search term exists
                    let content = isEmpty ? '-' : value.toString();
                    if (searchTerm.trim() && resultMatch?.matches) {
                      // Find if this key/column has matches
                      const fieldMatch = resultMatch.matches.find(match => match.key === key);
                      if (fieldMatch && !isEmpty) {
                        // Use highlight function to render with highlighting
                        content = highlightText(content, fieldMatch.indices);
                      }
                    }
                    
                    return (
                      <td key={key} className={columnClass}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              )})}
            </tbody>
          </table>
        )}
        
        {!error && data.length === 0 && !isLoading && (
          <div className="no-data-message">
            <p>No data available. Please check if the Excel file exists and has data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoqTable;