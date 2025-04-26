import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import TrackPlayer, { State, Track as TrackPlayerTrack, Event, useTrackPlayerEvents } from 'react-native-track-player';
import { AudioItem } from '../dto/AudioDTO';
import { setupPlayer, setupBackgroundMode as setupPlayerBackgroundMode, togglePlayback as togglePlayerPlayback, seekTo as seekToPosition, skipToNext as skipToNextTrack, skipToPrevious as skipToPreviousTrack, stopPlayer, resetPlayer, getProgress } from '../services/trackPlayerService';
import audioServiceProxy from '../proxy/audioServiceProxy';
import { ASSETS_BASE_URL } from '../config';
import NetInfo from '@react-native-community/netinfo';
import offlineAudioService from '../download/offlineAudioService';
import downloadService from '../download/downloadService';

interface PlaybackContextType {
  isPlaying: boolean;
  currentTrack: TrackPlayerTrack | null;
  currentTrackIndex: number;
  queuedTracks: TrackPlayerTrack[];
  categoryId: string | null;
  isPlayerReady: boolean;
  duration: number;
  position: number;
  isOfflineMode: boolean;
  playTrack: (categoryId: string, trackId: string, trackList?: AudioItem[]) => Promise<void>;
  togglePlayback: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  showMiniPlayer: boolean;
  isAudioPlayerActive: boolean;
  setAudioPlayerActive: (active: boolean) => void;
  stopPlayback: () => Promise<void>;
  setupBackgroundMode: () => Promise<void>;
}

const defaultContext: PlaybackContextType = {
  isPlaying: false,
  currentTrack: null,
  currentTrackIndex: -1,
  queuedTracks: [],
  categoryId: null,
  isPlayerReady: false,
  duration: 0,
  position: 0,
  isOfflineMode: false,
  playTrack: async () => {},
  togglePlayback: async () => {},
  skipToNext: async () => {},
  skipToPrevious: async () => {},
  seekTo: async () => {},
  showMiniPlayer: false,
  isAudioPlayerActive: false,
  setAudioPlayerActive: () => {},
  stopPlayback: async () => {},
  setupBackgroundMode: async () => {},
};

export const PlaybackContext = createContext<PlaybackContextType>(defaultContext);

export const usePlayback = () => useContext(PlaybackContext);

interface PlaybackProviderProps {
  children: ReactNode;
}

export const PlaybackProvider: React.FC<PlaybackProviderProps> = ({ children }) => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackPlayerTrack | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [queuedTracks, setQueuedTracks] = useState<TrackPlayerTrack[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isAudioPlayerActive, setIsAudioPlayerActive] = useState(false);

  // Initialize player
  useEffect(() => {
    let unmounted = false;

    const initializePlayer = async () => {
      try {
        const setup = await setupPlayer();
        if (!unmounted) {
          setIsPlayerReady(setup);
        }
      } catch (error) {
        console.error('Error initializing player:', error);
      }
    };

    initializePlayer();

    return () => {
      unmounted = true;
    };
  }, []);

  // Track player events
  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.type === Event.PlaybackState) {
      if (event.state === State.Playing) {
        setIsPlaying(true);
      } else if (event.state === State.Paused || event.state === State.Stopped) {
        setIsPlaying(false);
      }
    } else if (event.type === Event.PlaybackActiveTrackChanged) {
      try {
        // event.track là track object mới, event.index là index mới
        if (event.track) {
          setCurrentTrack(event.track);
          setCurrentTrackIndex(event.index ?? -1);
          // Sử dụng getProgress từ trackPlayerService
          const progress = await getProgress();
          setDuration(progress.duration);
        }
      } catch (error) {
        console.error('Error getting track info:', error);
      }
    }
  });

  // Update position periodically
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      interval = setInterval(async () => {
        try {
          // Sử dụng getProgress từ trackPlayerService
          const progress = await getProgress();
          setPosition(progress.position);
          
          // Cập nhật thêm duration nếu có thay đổi
          if (progress.duration !== duration) {
            setDuration(progress.duration);
          }
        } catch (error) {
          console.error('Error getting playback progress:', error);
        }
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  // Kiểm tra kết nối mạng
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOfflineMode(!state.isConnected);
    });

    // Kiểm tra ban đầu
    NetInfo.fetch().then(state => {
      setIsOfflineMode(!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Play a track and queue the category tracks
  const playTrack = async (catId: string, trackId: string, trackList?: AudioItem[]) => {
    try {
      if (!isPlayerReady) {
        return;
      }

      setCategoryId(catId);
      setShowMiniPlayer(true);

      // Nếu đang ở chế độ offline, ưu tiên phát từ cache
      if (isOfflineMode) {
        // Lấy danh sách track offline trong cùng category
        const offlineTracks = await offlineAudioService.getOfflineTracksByCategoryId(catId);
        
        if (offlineTracks.length > 0) {
          // Tạo danh sách AudioItem để phát
          const offlineAudioItems: AudioItem[] = offlineTracks.map(track => ({
            title: track.title,
            audio: [track.id],
            isDownloadable: true,
            path: track.path
          }));
          
          await prepareAndPlayTracks(offlineAudioItems, trackId);
          return;
        }
        
        const canPlayOffline = await downloadService.canPlayOffline(trackId);
        if (canPlayOffline) {
          const path = await downloadService.getOfflineFilePath(trackId);
          if (path) {
            const singleOfflineTrack: AudioItem = {
              title: 'Âm thanh đã tải',
              audio: [trackId],
              isDownloadable: true,
              path
            };
            await prepareAndPlayTracks([singleOfflineTrack], trackId);
            return;
          }
        }
      }
      if (trackList && trackList.length > 0) {
        await prepareAndPlayTracks(trackList, trackId);
        return;
      }

      // Otherwise fetch the tracks from the category
      try {
        const categoryData = await audioServiceProxy.getAudioById(catId);
        if (categoryData && categoryData.audios) {
          await prepareAndPlayTracks(categoryData.audios, trackId);
        }
      } catch (error) {
        // Nếu không thể lấy dữ liệu từ server, thử tìm trong cache offline
        console.error('Failed to fetch from server, trying offline cache:', error);
        const offlineTracks = await offlineAudioService.getAllOfflineTracks();
        
        if (offlineTracks.length > 0) {
          const offlineAudioItems: AudioItem[] = offlineTracks.map(track => ({
            title: track.title,
            audio: [track.id],
            isDownloadable: true,
            path: track.path
          }));
          
          await prepareAndPlayTracks(offlineAudioItems, trackId);
        } else {
          console.error('No offline tracks available');
        }
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  // Prepare and play tracks from a list
  const prepareAndPlayTracks = async (audioItems: AudioItem[], startTrackId: string) => {
    try {
      // Sử dụng resetPlayer từ trackPlayerService
      await resetPlayer();

      const tracks: TrackPlayerTrack[] = audioItems
        .filter(item => item.audio && item.audio.length > 0)
        .map(item => {
          const audioId = item.audio![0];
          const isOffline = item.isDownloadable && item.path;
          const audioUrl = isOffline && item.path ? item.path : `${ASSETS_BASE_URL}${audioId}`;
          
          // Nếu có đường dẫn offline, cập nhật thời gian phát gần nhất
          if (isOffline && item.path) {
            offlineAudioService.updateLastPlayedTime(audioId).catch(err => 
              console.error('Error updating last played time:', err)
            );
          }

          return {
            id: audioId,
            url: audioUrl,
            title: item.title,
            artist: 'Tô Sư Thiền',
          };
        });

      // Add all tracks to the queue
      if (tracks.length > 0) {
        await TrackPlayer.add(tracks);
        setQueuedTracks(tracks);

        // Find index of track to play and skip to it
        const trackIndex = tracks.findIndex(track => track.id === startTrackId);
        if (trackIndex !== -1) {
          await TrackPlayer.skip(trackIndex);
          setCurrentTrackIndex(trackIndex);
        }

        await TrackPlayer.play();
      }
    } catch (error) {
      console.error('Error preparing tracks:', error);
    }
  };

  // Toggle playback - sử dụng từ trackPlayerService
  const togglePlayback = async () => {
    try {
      if (!isPlayerReady) return;
      await togglePlayerPlayback();
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  // Skip to next track - sử dụng từ trackPlayerService
  const skipToNext = async () => {
    try {
      if (!isPlayerReady || queuedTracks.length <= 1) return;

      const queue = await TrackPlayer.getQueue();
      if (currentTrackIndex < queue.length - 1) {
        await skipToNextTrack();
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  };

  // Skip to previous track - sử dụng từ trackPlayerService
  const skipToPrevious = async () => {
    try {
      if (!isPlayerReady || queuedTracks.length <= 1) return;

      // If position is more than 3 seconds, restart current track
      const progress = await getProgress();
      if (progress.position > 3) {
        await seekToPosition(0);
        return;
      }

      // Otherwise, go to previous track
      if (currentTrackIndex > 0) {
        await skipToPreviousTrack();
      }
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  };

  // Seek to position - sử dụng từ trackPlayerService
  const seekTo = async (pos: number) => {
    try {
      if (!isPlayerReady) return;
      await seekToPosition(pos);
      setPosition(pos);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  // Stop playback - sử dụng từ trackPlayerService
  const stopPlayback = async () => {
    try {
      if (isPlayerReady) {
        await stopPlayer();
        setShowMiniPlayer(false);
        setCurrentTrack(null);
        setCurrentTrackIndex(-1);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  // Setup background mode - sử dụng từ trackPlayerService
  const setupBackgroundMode = async () => {
    try {
      if (isPlayerReady) {
        await setupPlayerBackgroundMode();
      }
    } catch (error) {
      console.error('Error setting up background mode:', error);
    }
  };

  const setAudioPlayerActive = (active: boolean) => {
    setIsAudioPlayerActive(active);
  };

  const value: PlaybackContextType = {
    isPlaying,
    currentTrack,
    currentTrackIndex,
    queuedTracks,
    categoryId,
    isPlayerReady,
    duration,
    position,
    isOfflineMode,
    playTrack,
    togglePlayback,
    skipToNext,
    skipToPrevious,
    seekTo,
    showMiniPlayer,
    isAudioPlayerActive,
    setAudioPlayerActive,
    stopPlayback,
    setupBackgroundMode,
  };

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
};
