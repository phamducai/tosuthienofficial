import { VideoColection, VideoColectionDetail } from '../dto/VideoDTO';
import * as videoService from '../services/videoService';
import { BaseServiceProxy } from './BaseServiceProxy';
import AsyncStorage from '@react-native-async-storage/async-storage';

class VideoServiceProxy extends BaseServiceProxy {
  
  async getVideoCategorys(): Promise<VideoColection[]> {
    const cacheKey = 'video_categories';
    
    try {
      const cachedData = await this.getFromCache<VideoColection[]>(cacheKey);
      if (cachedData && Array.isArray(cachedData)) {
        return cachedData;
      }
      const data = await videoService.fetchVideoCategorys();
      await this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Lỗi khi lấy danh mục video:', error);
      return videoService.fetchVideoCategorys();
    }
  }
  
  async getVideoCategorysFresh(): Promise<VideoColection[]> {
    const cacheKey = 'video_categories';
    
    try {
      const data = await videoService.fetchVideoCategorys();
      
      await this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Lỗi khi lấy danh mục video mới:', error);
      
      const cachedData = await this.getFromCache<VideoColection[]>(cacheKey);
      if (cachedData && Array.isArray(cachedData)) {
        return cachedData;
      }
      
      return [];
    }
  }
  
  async getVideoCategoryById(categoryId: string): Promise<VideoColectionDetail | null> {
    const cacheKey = `${categoryId}`;
    try {
      const cachedData = await this.getFromCache<VideoColectionDetail>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      const data = await videoService.fetchVideoCategoryById(categoryId);
      if (data) {
        await this.saveToCache(cacheKey, data);
      }
      return data;
    } catch (error) {
      return videoService.fetchVideoCategoryById(categoryId);
    }
  }
  

  async getVideoByIdFresh(categoryId: string): Promise<VideoColectionDetail | null> {
    const cacheKey = categoryId;
    
    try {
      const data = await videoService.fetchVideoCategoryById(categoryId);
      
      if (data) {
        await this.saveToCache(cacheKey, data);
      }
      
      return data;
    } catch (error) {      
      const cachedData = await this.getFromCache<VideoColectionDetail>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      return null;
    }
  }
  
  async clearVideoCache(): Promise<void> {
    const cacheKey='video_categories'
    try {
      const keys = await AsyncStorage.getAllKeys();
      const videoKeys = keys.filter((key: string) => 
        key.startsWith(cacheKey)
      );
      
      if (videoKeys.length > 0) {
        await AsyncStorage.multiRemove(videoKeys);
      }      
    } catch (error) {
      console.error('Lỗi khi xóa cache video:', error);
    }
  }
  
  async clearAllCache(): Promise<void> {
    try {
      await this.clearVideoCache();
    } catch (error) {
      console.error('Lỗi khi xóa tất cả cache:', error);
    }
  }
}

const videoServiceProxy = new VideoServiceProxy();
export default videoServiceProxy;
