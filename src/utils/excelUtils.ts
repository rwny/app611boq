import * as XLSX from 'xlsx';

/**
 * Processes Excel data to replace empty or null values with a placeholder
 * @param data The raw Excel data as an array of objects
 * @param placeholder The string to use for empty cells (default: '-')
 * @returns Processed data with no empty cells
 */
export const processExcelData = (data: any[], placeholder: string = '-'): any[] => {
  if (!data || !Array.isArray(data)) {
    console.warn('Invalid data provided to processExcelData');
    return [];
  }
  
  console.log('Processing Excel data for empty cells...');
  
  return data.map(row => {
    const processedRow = { ...row };
    
    // Process each key in the row
    Object.keys(processedRow).forEach(key => {
      const value = processedRow[key];
      
      // Check for various forms of emptiness
      const isEmpty = 
        value === '' || 
        value === null || 
        value === undefined ||
        value === 'undefined' ||
        value === 'null' ||
        (typeof value === 'string' && value.trim() === '') ||
        (typeof value === 'number' && isNaN(value));
        
      if (isEmpty) {
        console.log(`Replacing empty value in column "${key}"`);
        processedRow[key] = placeholder;
      } else {
        // Convert non-string/non-number values to strings for consistent handling
        if (typeof value !== 'string' && typeof value !== 'number') {
          processedRow[key] = String(value);
        }
      }
    });
    
    return processedRow;
  });
};

export const readExcelFile = async (filePath: string) => {
  try {
    console.log('Fetching Excel file from:', filePath);
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('Excel file fetched successfully, parsing data...');
    
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file contains no sheets');
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      throw new Error(`Could not access sheet: ${sheetName}`);
    }
    
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Successfully parsed Excel data: ${rawData.length} rows`);
    
    // Process the data to handle empty cells
    const processedData = processExcelData(rawData);
    return processedData;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error; // Re-throw to let the component handle it
  }
};