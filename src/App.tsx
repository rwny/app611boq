import React, { useState, useCallback } from 'react';
import RightSidebar from './RightSidebar';
import BoqTable from './BoqTable';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Function to trigger a reload
  const triggerReload = useCallback(() => {
    setReloadTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="App">
      <div className="content">
        <BoqTable searchTerm={searchTerm} reloadTrigger={reloadTrigger} />
      </div>
      <RightSidebar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onReload={triggerReload} 
      />
    </div>
  );
}

export default App;
