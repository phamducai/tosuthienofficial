import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASSETS_BASE_URL } from '../config';
import { Platform } from 'react-native';
import { AudioCollectionDetail } from '../dto/AudioDTO';
import offlineAudioService from './offlineAudioService';


const getAudioCacheKey = (categoryId: string) => `${categoryId}`;

const downloadService = {
  async downloadAudio(id: string, categoryId: string, title: string = ''): Promise<string> {
    // Kiểm tra id không được null hoặc rỗng
    if (!id) {
      console.error('Không thể tải xuống audio: ID không hợp lệ');
      throw new Error('ID không hợp lệ');
    }
    
    try {
      console.log(`Bắt đầu tải: ${title || id}`);
      const correctUrl = `${ASSETS_BASE_URL}${id}`;
      const safeFileName = `${id}.mp3`;
      const { dirs } = ReactNativeBlobUtil.fs;
      
      // Chọn thư mục lưu trữ (sẽ bị xóa khi gỡ ứng dụng)
      let savePath: string;
      if (Platform.OS === 'android') {
        savePath = `${dirs.CacheDir}/${safeFileName}`;
      } else {
        savePath = `${dirs.DocumentDir}/${safeFileName}`;
      }
      const fileExists = await ReactNativeBlobUtil.fs.exists(savePath);
      if (fileExists) {
        await ReactNativeBlobUtil.fs.unlink(savePath);
      } 
      const res = await ReactNativeBlobUtil
        .config({
          fileCache: true,
          path: savePath
        })
        .fetch('GET', correctUrl, {
          'Accept': 'audio/mpeg, audio/*',
          'User-Agent': 'tosuthien-app'
        });
      
      const status = res.info().status;
      if (status !== 200) {
        throw new Error(`Server returned status code ${status}`);
      }
      
      // Kiểm tra kích thước file
      const fileStats = await ReactNativeBlobUtil.fs.stat(savePath);
      if (!fileStats || fileStats.size === 0) {
        if (await ReactNativeBlobUtil.fs.exists(savePath)) {
          await ReactNativeBlobUtil.fs.unlink(savePath);
        }
        throw new Error('File có kích thước 0 byte');
      }      
      await this.updateAudioDownloadStatus(id, categoryId, true, savePath);
      await offlineAudioService.saveTrackToOfflineList(id, categoryId, savePath, title);
      return savePath;
    } catch (error) {
      throw error;
    }
  },

  async updateAudioDownloadStatus(id: string, categoryId: string, isDownloaded: boolean, path?: string): Promise<void> {
    if (!id) {
      return;
    }
    
    try {
      const cacheKey = getAudioCacheKey(categoryId);
      const cachedItemString = await AsyncStorage.getItem(cacheKey);
      if (!cachedItemString) return;
      
      try {
        const { data } = JSON.parse(cachedItemString);
        const audioDetail: AudioCollectionDetail = data;
        
        if (!audioDetail?.audios?.length) return;
        audioDetail.audios = audioDetail.audios.map(item => {
          if (item.audio?.length > 0 && item.audio[0] === id) {
            return {
              ...item,
              isDownloadable: isDownloaded,
              path: isDownloaded ? path : '',
            };
          }
          return item;
        });
        
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: audioDetail }));
      } catch (parseError) {
        console.error('Error parsing cached item:', parseError);
      }
    } catch (error) {
      console.error('Error updating audio download status:', error);
    }
  },
  
  async removeDownloadedAudio(id: string, categoryId: string): Promise<void> {
    if (!id) {
      throw new Error('ID không hợp lệ');
    }
    
    try {
      const filePath = await this.getOfflineFilePath(id);
      if (filePath && await ReactNativeBlobUtil.fs.exists(filePath)) {
        try {
          await ReactNativeBlobUtil.fs.unlink(filePath);
        } catch (unlinkError) {
          throw unlinkError;
        }
      }
      
      await AsyncStorage.removeItem(`offline_path_${id}`);
      
      await offlineAudioService.removeTrackFromOfflineList(id);
      const cacheKey = getAudioCacheKey(categoryId);
      const cachedItemString = await AsyncStorage.getItem(cacheKey);
      if (!cachedItemString) return;
      
      try {
        const { data } = JSON.parse(cachedItemString);
        const audioDetail: AudioCollectionDetail = data;        
        if (audioDetail?.audios?.length) {
          audioDetail.audios = audioDetail.audios.map(item => {
            if (item.audio?.[0] === id) {
              return { ...item, isDownloadable: false, path: '' };
            }
            return item;
          });
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: audioDetail }));
        }
      } catch (parseError) {
        console.error('Error parsing cached item during removal:', parseError);
      }
    } catch (error) {
      throw error;
    }
  },
  
  async canPlayOffline(id: string): Promise<boolean> {
    if (!id) {
      return false;
    }
    
    try {
      const cachePath = await AsyncStorage.getItem(`offline_path_${id}`);
      
      if (cachePath) {
        const exists = await ReactNativeBlobUtil.fs.exists(cachePath);
        if (exists) return true;
        await AsyncStorage.removeItem(`offline_path_${id}`);
      }
      
      const offlineTracks = await offlineAudioService.getAllOfflineTracks();
      const track = offlineTracks.find(track => track.id === id);
      
      if (!track) return false;
      const exists = await ReactNativeBlobUtil.fs.exists(track.path);      
      if (exists) {
        await AsyncStorage.setItem(`offline_path_${id}`, track.path);
      }
      return exists;
    } catch (error) {
      return false;
    }
  },
  
  async getOfflineFilePath(id: string): Promise<string | null> {
    if (!id) {
      return null;
    }
    
    try {
      const cachePath = await AsyncStorage.getItem(`offline_path_${id}`);
      
      if (cachePath) {
        const exists = await ReactNativeBlobUtil.fs.exists(cachePath);
        if (exists) return cachePath;
        await AsyncStorage.removeItem(`offline_path_${id}`);
      }
      
      const offlineTracks = await offlineAudioService.getAllOfflineTracks();
      const track = offlineTracks.find(track => track.id === id);
      
      if (!track) return null;
      const exists = await ReactNativeBlobUtil.fs.exists(track.path);
      
      if (!exists) {
        await offlineAudioService.removeTrackFromOfflineList(id);
        return null;
      }
      await AsyncStorage.setItem(`offline_path_${id}`, track.path);
      
      return track.path;
    } catch (error) {
      console.error('Error getting offline file path:', error);
      return null;
    }
  },
  
  async getAllDownloadedTracks(): Promise<{ id: string, title: string, categoryId: string, path: string }[]> {
    try {
      const offlineTracks = await offlineAudioService.getAllOfflineTracks();
      const validTracks = [];
      for (const track of offlineTracks) {
        if (!track.id) {
          continue;
        }
        
        const exists = await ReactNativeBlobUtil.fs.exists(track.path);
        if (exists) {
          validTracks.push(track);
          await AsyncStorage.setItem(`offline_path_${track.id}`, track.path);
        } else {
          await offlineAudioService.removeTrackFromOfflineList(track.id);
          await AsyncStorage.removeItem(`offline_path_${track.id}`);
        }
      }
      
      return validTracks;
    } catch (error) {
      return [];
    }
  },
  
  async getUsedStorageSize(): Promise<number> {
    try {
      const offlineTracks = await this.getAllDownloadedTracks();
      let totalSize = 0;
      
      for (const track of offlineTracks) {
        try {
          const stats = await ReactNativeBlobUtil.fs.stat(track.path);
          totalSize += stats.size || 0;
        } catch (e) {
        }
      }      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }
};

export default downloadService;