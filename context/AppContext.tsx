import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TextConfig, StoredPhoto, FONT_STYLES } from '../types';
import { loadPhotos, savePhoto, deletePhoto, clearPhotos, initDB } from '../services/db';

interface AppContextType {
  textConfig: TextConfig;
  setTextConfig: (config: TextConfig) => void;
  uiVisible: boolean;
  toggleUI: () => void;
  cameraVisible: boolean;
  toggleCamera: () => void;
  photos: StoredPhoto[];
  addPhoto: (file: File) => void;
  removePhoto: (id: string) => void;
  removeAllPhotos: () => void;
  isPhotoManagerOpen: boolean;
  setPhotoManagerOpen: (open: boolean) => void;
  threeApi: React.MutableRefObject<any>; // Reference to Three.js engine methods
  bgmPlaying: boolean;
  toggleBgm: () => void;
  bgmVolume: number;
  setBgmVolume: (vol: number) => void;
  handleMusicUpload: (file: File) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textConfig, setTextConfigState] = useState<TextConfig>({
    line1: "Merry",
    line2: "Christmas",
    fontKey: "style1",
    size: 100,
    color: "#fceea7"
  });

  const [uiVisible, setUiVisible] = useState(true);
  const [cameraVisible, setCameraVisible] = useState(true);
  const [isPhotoManagerOpen, setPhotoManagerOpen] = useState(false);
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(50);
  
  const threeApi = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  useEffect(() => {
    // Initialize DB and Load Config
    initDB().then(async () => {
      const loadedPhotos = await loadPhotos();
      setPhotos(loadedPhotos);
      
      const savedText = localStorage.getItem('v16_text_config');
      if (savedText) {
        setTextConfigState(JSON.parse(savedText));
      }
    });

    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    return () => {
      audioRef.current.pause();
    };
  }, []);

  const setTextConfig = (config: TextConfig) => {
    setTextConfigState(config);
    localStorage.setItem('v16_text_config', JSON.stringify(config));
  };

  const toggleUI = () => setUiVisible(!uiVisible);
  const toggleCamera = () => setCameraVisible(!cameraVisible);

  const addPhoto = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const id = await savePhoto(base64);
      if (id) {
        const newPhoto = { id, data: base64 };
        setPhotos(prev => [...prev, newPhoto]);
        // Notify Three.js scene
        if (threeApi.current?.addPhotoTexture) {
          threeApi.current.addPhotoTexture(base64, id);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = async (id: string) => {
    await deletePhoto(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (threeApi.current?.removePhoto) {
      threeApi.current.removePhoto(id);
    }
  };

  const removeAllPhotos = async () => {
    await clearPhotos();
    setPhotos([]);
    if (threeApi.current?.clearPhotos) {
      threeApi.current.clearPhotos();
    }
  };

  const toggleBgm = () => {
    if (!audioRef.current.src) return;
    if (bgmPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
    setBgmPlaying(!bgmPlaying);
  };

  const setVolume = (val: number) => {
    setBgmVolume(val);
    audioRef.current.volume = val / 100;
  };

  const handleMusicUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    audioRef.current.src = url;
    audioRef.current.play().then(() => setBgmPlaying(true));
  };

  return (
    <AppContext.Provider value={{
      textConfig, setTextConfig,
      uiVisible, toggleUI,
      cameraVisible, toggleCamera,
      photos, addPhoto, removePhoto, removeAllPhotos,
      isPhotoManagerOpen, setPhotoManagerOpen,
      threeApi,
      bgmPlaying, toggleBgm,
      bgmVolume, setBgmVolume: setVolume,
      handleMusicUpload
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
