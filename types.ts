export interface TextStyleConfig {
  fontFamily: string;
  spacing: string;
  shadow: string;
  transform: string;
  weight: string;
}

export interface TextConfig {
  line1: string;
  line2: string;
  fontKey: string;
  size: number;
  color: string;
}

export interface StoredPhoto {
  id: string;
  data: string; // Base64
}

export enum AppMode {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  FOCUS = 'FOCUS',
}

export interface HandState {
  detected: boolean;
  x: number;
  y: number;
}

export const FONT_STYLES: Record<string, TextStyleConfig> = {
  'style1': { fontFamily: "'Ma Shan Zheng', cursive", spacing: "4px", shadow: "2px 2px 8px rgba(180,50,50,0.8)", transform: "none", weight: "normal" },
  'style2': { fontFamily: "'Cinzel', serif", spacing: "6px", shadow: "0 0 20px rgba(255,215,0,0.5)", transform: "uppercase", weight: "700" },
  'style3': { fontFamily: "'Great Vibes', cursive", spacing: "1px", shadow: "0 0 15px rgba(255,200,255,0.7)", transform: "none", weight: "normal" },
  'style4': { fontFamily: "'Monoton', cursive", spacing: "1px", shadow: "0 0 10px #fff, 0 0 20px #f0f", transform: "uppercase", weight: "normal" },
  'style5': { fontFamily: "'Abril Fatface', cursive", spacing: "0px", shadow: "0 5px 15px rgba(0,0,0,0.8)", transform: "none", weight: "normal" }
};
