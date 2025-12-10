import React from 'react';
import { Settings, Maximize, Eye, EyeOff, Camera, Upload, Trash2, Music, Hand } from 'lucide-react';
import { useApp } from '../context/AppContext';
import WebcamPreview from './WebcamPreview';

const UIOverlay: React.FC = () => {
  const {
    textConfig, setTextConfig,
    uiVisible, toggleUI,
    cameraVisible, toggleCamera,
    setPhotoManagerOpen, addPhoto,
    bgmPlaying, toggleBgm, bgmVolume, setBgmVolume, handleMusicUpload,
    threeApi
  } = useApp();

  const handleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  const handleParticleUpdate = () => {
    const treeSlider = document.getElementById('slider-tree') as HTMLInputElement;
    const dustSlider = document.getElementById('slider-dust') as HTMLInputElement;
    if (threeApi.current && treeSlider && dustSlider) {
      threeApi.current.rebuildParticles(parseInt(treeSlider.value), parseInt(dustSlider.value));
    }
  };

  return (
    <>
      {/* Top Right Controls */}
      <div className="absolute top-5 right-5 z-50 flex flex-col gap-2 items-end">
        <button onClick={handleFullscreen} className="elegant-btn">
          <Maximize size={14} className="mr-2" /> FULLSCREEN
        </button>
        <button onClick={toggleUI} className="elegant-btn">
          {uiVisible ? <EyeOff size={14} className="mr-2" /> : <Eye size={14} className="mr-2" />} 
          {uiVisible ? 'HIDE UI' : 'SHOW UI'}
        </button>
      </div>

      {/* Main UI Container */}
      <div className={`absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Left Sidebar Container */}
        <div className="absolute top-5 left-5 w-[220px] flex flex-col gap-4 pointer-events-auto">
          
          {/* Settings Panel */}
          <div className="glass-panel p-4 flex flex-col gap-3">
            <div className="panel-header flex items-center gap-2"><Settings size={10} /> CUSTOMIZATION</div>
            
            <div className="flex flex-col gap-2">
              <input 
                type="text" className="input-dark" placeholder="Line 1" 
                value={textConfig.line1} onChange={e => setTextConfig({...textConfig, line1: e.target.value})}
              />
              <input 
                type="text" className="input-dark" placeholder="Line 2"
                value={textConfig.line2} onChange={e => setTextConfig({...textConfig, line2: e.target.value})}
              />
            </div>

            <div className="control-row">
              <span className="control-label">Typography</span>
              <select 
                className="input-dark w-full" 
                value={textConfig.fontKey} onChange={e => setTextConfig({...textConfig, fontKey: e.target.value})}
              >
                <option value="style1">Ma Shan Zheng (Calligraphy)</option>
                <option value="style2">Cinzel (Classic)</option>
                <option value="style3">Great Vibes (Elegant)</option>
                <option value="style4">Monoton (Neon)</option>
                <option value="style5">Abril Fatface (Bold)</option>
              </select>
            </div>

            <div className="control-row">
              <span className="control-label">Size</span>
              <input 
                type="range" min="50" max="250" className="slider" 
                value={textConfig.size} onChange={e => setTextConfig({...textConfig, size: parseInt(e.target.value)})}
              />
            </div>

            <div className="control-row">
              <span className="control-label">Color</span>
              <input 
                type="color" className="w-full h-6 bg-transparent cursor-pointer"
                value={textConfig.color} onChange={e => setTextConfig({...textConfig, color: e.target.value})}
              />
            </div>

            <div className="panel-header mt-2">AUDIO</div>
            <button onClick={toggleBgm} className={`elegant-btn w-full justify-center ${bgmPlaying ? 'border-green-500/50 text-green-400' : ''}`}>
               <Music size={14} className="mr-2" /> {bgmPlaying ? 'PAUSE MUSIC' : 'PLAY MUSIC'}
            </button>
            <div className="control-row">
               <span className="control-label">Volume: {bgmVolume}%</span>
               <input type="range" min="0" max="100" className="slider" value={bgmVolume} onChange={e => setBgmVolume(parseInt(e.target.value))} />
            </div>

            <div className="panel-header mt-2">PARTICLES</div>
            <div className="control-row">
              <span className="control-label">Tree Density</span>
              <input id="slider-tree" type="range" min="500" max="3000" defaultValue="1500" className="slider" />
            </div>
            <div className="control-row">
              <span className="control-label">Star Dust</span>
              <input id="slider-dust" type="range" min="500" max="5000" defaultValue="2500" className="slider" />
            </div>
            <button onClick={handleParticleUpdate} className="elegant-btn w-full justify-center mt-1">
              REBUILD SCENE
            </button>
          </div>

          {/* Gesture Guide */}
          <div className="glass-panel p-2 grid grid-cols-2 gap-2 opacity-90">
            <div className="gesture-item"><span className="text-xl">✊</span><span className="text-[10px]">FOCUS</span></div>
            <div className="gesture-item"><span className="text-xl">✋</span><span className="text-[10px]">SCATTER</span></div>
            <div className="gesture-item"><span className="text-xl">👌</span><span className="text-[10px]">GRAB</span></div>
            <div className="gesture-item"><Hand size={18} /><span className="text-[10px]">ROTATE</span></div>
          </div>
        </div>

        {/* Bottom Left Media */}
        <div className="absolute bottom-5 left-5 w-[160px] flex flex-col gap-2 pointer-events-auto">
          <label className="elegant-btn justify-center cursor-pointer">
            <Upload size={14} className="mr-2" /> UPLOAD PHOTOS
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => {
              if(e.target.files) Array.from(e.target.files).forEach(f => addPhoto(f));
            }} />
          </label>
          <button onClick={() => setPhotoManagerOpen(true)} className="elegant-btn justify-center">
            <Trash2 size={14} className="mr-2" /> MANAGE PHOTOS
          </button>
          <label className="elegant-btn justify-center cursor-pointer">
            <Music size={14} className="mr-2" /> UPLOAD MP3
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
              if(e.target.files?.[0]) handleMusicUpload(e.target.files[0]);
            }} />
          </label>
          <button onClick={toggleCamera} className="elegant-btn justify-center">
            <Camera size={14} className="mr-2" /> WEBCAM
          </button>
        </div>
      </div>

      {/* Webcam Preview */}
      <WebcamPreview visible={cameraVisible && uiVisible} />
      
      {/* Gesture Status Text */}
      <div id="gesture-hint-text" className="absolute bottom-4 w-full text-center pointer-events-none text-[#d4af37]/70 text-[10px] uppercase tracking-widest z-10 shadow-black drop-shadow-md">
        Initializing AI...
      </div>

      <style>{`
        .elegant-btn {
          background: rgba(10, 10, 10, 0.85); border: 1px solid rgba(212, 175, 55, 0.4); 
          color: #d4af37; padding: 8px 12px; cursor: pointer; 
          text-transform: uppercase; letter-spacing: 1px; font-size: 10px;
          transition: all 0.2s; display: inline-flex; align-items: center;
          backdrop-filter: blur(4px); border-radius: 2px;
          font-family: 'Songti SC', sans-serif;
        }
        .elegant-btn:hover { background: #d4af37; color: #000; border-color: #d4af37; }
        .glass-panel {
          background: rgba(5, 5, 5, 0.85); border: 1px solid rgba(212, 175, 55, 0.2);
          backdrop-filter: blur(8px); border-radius: 4px;
        }
        .panel-header {
          color: #888; border-bottom: 1px solid rgba(255,255,255,0.1); 
          padding-bottom: 4px; margin-bottom: 2px; font-size: 10px; letter-spacing: 2px;
          font-family: 'Cinzel', serif; font-weight: bold;
        }
        .input-dark {
          background: rgba(255,255,255,0.05); border: 1px solid #444; color: #eebb66;
          padding: 4px 8px; font-size: 11px; outline: none; transition: 0.2s; border-radius: 2px;
        }
        .input-dark:focus { border-color: #d4af37; background: rgba(255,255,255,0.1); }
        .control-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 2px; }
        .control-label { color: #aaa; font-size: 9px; uppercase; letter-spacing: 1px; }
        .slider { -webkit-appearance: none; width: 100%; height: 2px; background: rgba(255,255,255,0.15); outline: none; margin-top: 6px; }
        .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; background: #d4af37; border-radius: 50%; cursor: pointer; border: 1px solid #000; }
        .gesture-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.2);
          padding: 8px; border-radius: 4px; color: #d4af37;
        }
      `}</style>
    </>
  );
};

export default UIOverlay;