// Interface for simplified audio collection data
export interface AudioCollection {
    id: string;
    name: string;
    isCategory?: boolean;
    description: string;
  }
  
  // Interface for audio item in collection detail
  export interface AudioItem {
    audio: string[];
    title: string;
    isDownloadable?: boolean;
    path?: string;
  }
  
  // Interface for detailed audio collection data
  export interface AudioCollectionDetail {
    id: string;
    name: string;
    audios: AudioItem[];
    isCategory?: boolean;
  }