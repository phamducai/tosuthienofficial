export type ScreenType = 'Home' | 'Audio' | 'Book' | 'Video' | 'Center';

export type RootStackParamList = {
  Home: undefined;
  HomeScreen: undefined;
  AudioStack: undefined;
  BookStack: undefined;
  VideoStack: undefined;
  CenterStack: undefined;
};

export type AudioStackParamList = {
  AudioCategories: undefined;
  AudioList: {
    categoryId: string;
    categoryName: string;
  };
  AudioPlayer: {
    trackId: string;
    trackTitle: string;
    trackUrl: string;
    trackArtist?: string;
    trackArtwork?: string;
    categoryId?: string;
    isPlaybackInitiated?: boolean; 
  };
  OfflineAudio: undefined;
};

export type BookStackParamList = {
  BookList: undefined;
  BookDetail: {
    bookId: string;
  };
};

export type VideoStackParamList = {
  VideoCategories: undefined;
  VideoList: {
    categoryId: string;
    categoryName: string;
  };
  VideoPlayer: {
    videoId: string;
    videoTitle: string;
    videoDescription?: string;
  };
};

export type CenterStackParamList = {
  CenterList: undefined;
};
