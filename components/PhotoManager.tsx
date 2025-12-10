import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Trash2 } from 'lucide-react';

const PhotoManager: React.FC = () => {
  const { isPhotoManagerOpen, setPhotoManagerOpen, photos, removePhoto, removeAllPhotos } = useApp();

  if (!isPhotoManagerOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-10">
      <div className="w-full max-w-4xl h-[80vh] flex flex-col gap-6 relative">
        <h2 className="text-3xl font-['Cinzel'] text-[#d4af37] text-center tracking-widest border-b border-[#d4af37]/30 pb-4">
          PHOTO GALLERY
        </h2>
        
        <div className="flex-1 overflow-y-auto p-6 border border-[#d4af37]/20 bg-[#111]/50 rounded-lg flex flex-wrap gap-6 justify-center content-start">
          {photos.length === 0 ? (
            <div className="text-gray-500 italic mt-20">No photos uploaded yet.</div>
          ) : (
            photos.map(photo => (
              <div key={photo.id} className="relative group w-24 h-24 border border-[#d4af37] hover:scale-110 transition-transform duration-200">
                <img src={photo.data} alt="memory" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -top-3 -right-3 bg-red-900 text-white rounded-full p-1 border border-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-center gap-4">
          <button 
            onClick={() => { if(confirm('Clear all photos?')) removeAllPhotos(); }}
            className="px-6 py-2 border border-red-800 text-red-400 hover:bg-red-900/20 rounded font-bold text-sm tracking-wider flex items-center gap-2"
          >
            <Trash2 size={16} /> CLEAR ALL
          </button>
          <button 
            onClick={() => setPhotoManagerOpen(false)}
            className="px-8 py-2 border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black rounded font-bold text-sm tracking-wider"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoManager;