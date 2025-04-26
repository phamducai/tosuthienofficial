import { AudioCollection, AudioCollectionDetail } from '../dto/AudioDTO';
import * as audioService from '../services/audioService';
import { BaseServiceProxy } from './BaseServiceProxy';

class AudioServiceProxy extends BaseServiceProxy {
  async getAudioCategory(categoryId: string | null): Promise<AudioCollection[]> {
    const cacheKey = `${categoryId}`;
    
    try {
      const cachedData = await this.getFromCache<AudioCollection[]>(cacheKey);
      if (cachedData) {
        console.log('Lấy category từ cache:', cacheKey);
        return cachedData;
      }
      const data = await audioService.fetchAudioCategory(categoryId);
      await this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      return audioService.fetchAudioCategory(categoryId);
    }
  }
  
  async getAudioCategoryFresh(categoryId: string | null): Promise<AudioCollection[]> {
    const cacheKey = `${categoryId}`;
    try {
      const data = await audioService.fetchAudioCategory(categoryId);
      await this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      const cachedData = await this.getFromCache<AudioCollection[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      return audioService.fetchAudioCategory(categoryId);
    }
  }
  
  async getAudioById(categoryId: string): Promise<AudioCollectionDetail | null> {
    const cacheKey = `${categoryId}`;
    try {
      const cachedData = await this.getFromCache<AudioCollectionDetail>(cacheKey);
      if (cachedData) {
        return cachedData;
      } 
      const data = await audioService.fetchAudioById(categoryId);
      if (data) {
        await this.saveToCache(cacheKey, data);
      }
      return data;
    } catch (error) {
      return audioService.fetchAudioById(categoryId);
    }
  }
  
  async getAudioByIdFresh(categoryId: string): Promise<AudioCollectionDetail | null> {
    const cacheKey = `${categoryId}`;
    const cachedData = await this.getFromCache<AudioCollectionDetail>(cacheKey);
    try {
      const newData = await audioService.fetchAudioById(categoryId);
      if (newData && cachedData && cachedData.audios) {
        newData.audios = newData.audios.map(newAudio => {
          const cachedAudio = cachedData.audios.find(cached => 
            cached.audio && 
            cached.audio.length > 0 && 
            newAudio.audio && 
            newAudio.audio.length > 0 &&
            cached.audio[0] === newAudio.audio[0]
          );
          if (cachedAudio && cachedAudio.isDownloadable) {
            return {
              ...newAudio,
              isDownloadable: true,
              path: cachedAudio.path
            };
          }
          return newAudio;
        });
      }
      if (newData) {
        await this.saveToCache(cacheKey, newData);
      }
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData;
      }
      return audioService.fetchAudioById(categoryId);
    }
  }
  
  async clearCache(): Promise<void> {
    await this.clearAllCache();
  }
}

export const audioServiceProxy = new AudioServiceProxy();
export default audioServiceProxy;
