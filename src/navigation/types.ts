// Định nghĩa loại màn hình cho navigation
export type ScreenType = 'Home' | 'Audio' | 'Book' | 'Video' | 'Center';

// Định nghĩa loại tham số cho các stack
export type RootStackParamList = {
  Home: undefined;
  AudioStack: undefined;
  BookStack: undefined;
  VideoStack: undefined;
  CenterStack: undefined;
};

export type AudioStackParamList = {
  AudioMain: undefined;
};

export type BookStackParamList = {
  BookMain: undefined;
  BookDetail: { bookId: string };
};

export type VideoStackParamList = {
  VideoMain: undefined;
};

export type CenterStackParamList = {
  CenterMain: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
};