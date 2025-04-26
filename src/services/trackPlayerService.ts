import TrackPlayer, { 
  Event, 
  RepeatMode, 
  Capability, 
  AppKilledPlaybackBehavior,
  State,
  IOSCategory,
  IOSCategoryOptions
} from 'react-native-track-player';
import { AppState } from 'react-native';

// Định nghĩa các track options
export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
  date?: string;
}

/**
 * Khởi tạo player theo tài liệu: https://rntp.dev/docs/intro
 */
export const setupPlayer = async () => {
  let isSetup = false;
  try {
    // Cố gắng thiết lập player
    await TrackPlayer.setupPlayer({
      minBuffer: 15,
      maxBuffer: 50,
      backBuffer: 30,
      waitForBuffer: true,
    });

    // Nếu không có lỗi, tiếp tục cấu hình
    await updatePlayerOptions();

    isSetup = true;
  } catch (error) {
    // Nếu lỗi là do player đã được khởi tạo, đánh dấu là đã setup
    if (error instanceof Error && 
        error.message.includes('The player has already been initialized')) {
      console.log('Player đã được khởi tạo trước đó');
      isSetup = true;
    } else {
      console.error('Error setting up the player:', error);
    }
  }
  return isSetup;
};

/**
 * Cập nhật các tùy chọn của player, bao gồm chế độ phát nền
 */
export const updatePlayerOptions = async (options = {}) => {
  try {
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      
      color: 0x8E6D5A, // Màu nâu đất phù hợp với thiền tông
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo,
      ],
      
      compactCapabilities: [
        Capability.Play, 
        Capability.Pause, 
        Capability.SkipToNext, 
        Capability.SkipToPrevious
      ],
      
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      
      progressUpdateEventInterval: 0.5,
      
      ...options
    });
  } catch (error) {
    console.error('Error updating player options:', error);
  }
};

/**
 * Cấu hình chế độ phát nền
 */
export const setupBackgroundMode = async () => {
  try {
    await updatePlayerOptions({
      // Có thể thêm cấu hình cụ thể cho background mode ở đây nếu cần
    });
  } catch (error) {
    console.error('Error setting up background mode:', error);
  }
};

export const addTracks = async (tracks: Track[]) => {
  await TrackPlayer.add(tracks);
};

export const playTrack = async (index: number) => {
  await TrackPlayer.skip(index);
  await TrackPlayer.play();
};

export const togglePlayback = async () => {
  const state = await TrackPlayer.getState();
  if (state === State.Playing) {
    await TrackPlayer.pause();
  } else {
    await TrackPlayer.play();
  }
};

export const seekTo = async (position: number) => {
  await TrackPlayer.seekTo(position);
};

export const skipToNext = async () => {
  await TrackPlayer.skipToNext();
};

export const skipToPrevious = async () => {
  await TrackPlayer.skipToPrevious();
};

export const resetPlayer = async () => {
  await TrackPlayer.reset();
};

export const stopPlayer = async () => {
  await TrackPlayer.stop();
};

export const getProgress = async () => {
  return await TrackPlayer.getProgress();
};

export const getPlaybackState = async () => {
  return await TrackPlayer.getPlaybackState();
};

export const PlaybackService = async function() {
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });
  
  // Xử lý seek từ notification và màn hình khóa
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });
  
  // Xử lý khi có interrupt (cuộc gọi, thông báo)
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    // Nếu đây là permanent (ví dụ có cuộc gọi), tạm dừng nhạc
    if (event.permanent) {
      await TrackPlayer.pause();
    }
    // Nếu đây là tạm thời và chỉ định tạm dừng
    else if (event.paused) {
      await TrackPlayer.pause();
    }
    // Nếu interrupt kết thúc, tiếp tục phát
    else {
      await TrackPlayer.pause();
    }
  });

  // Xử lý khi app chuyển background/foreground
  AppState.addEventListener('change', async (nextAppState) => {
    // Sử dụng getPlaybackState thay cho getState (deprecated)
    const playbackState = await TrackPlayer.getPlaybackState();
    
    if (nextAppState === 'active') {
      // Check trạng thái player từ playbackState.state
      if (playbackState.state !== State.Playing) {
        // Cập nhật UI khi trở lại từ background
        console.log('App trở lại foreground, trạng thái phát:', playbackState.state);
      }
    } else if (nextAppState === 'background') {
      console.log('App chuyển sang background, trạng thái phát:', playbackState.state);
      // Có thể thực hiện các hành động khi ứng dụng vào background
    }
  });
};