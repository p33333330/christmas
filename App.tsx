import React, { useState, useEffect } from 'react';
import ThreeCanvas from './components/ThreeCanvas';
import UIOverlay from './components/UIOverlay';
import DraggableTitle from './components/DraggableTitle';
import PhotoManager from './components/PhotoManager';
import { AppProvider } from './context/AppContext';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading sequence
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppProvider>
      <div className="relative w-full h-screen bg-black overflow-hidden select-none font-serif text-[#d4af37]">
        {/* Loading Screen */}
        <div 
          className={`absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center transition-opacity duration-700 pointer-events-none ${loading ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="w-10 h-10 border border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
          <div className="mt-5 text-xs tracking-[0.2em] font-['Cinzel'] text-[#d4af37]">INITIALIZING LUXURY ENGINE</div>
        </div>

        {/* 3D Scene Layer */}
        <div className="absolute inset-0 z-0">
          <ThreeCanvas />
        </div>

        {/* Title Layer */}
        <DraggableTitle />

        {/* UI Layer */}
        <UIOverlay />

        {/* Modals */}
        <PhotoManager />
      </div>
    </AppProvider>
  );
};

export default App;