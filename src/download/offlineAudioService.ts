import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_AUDIO_KEY = 'offline_audio_tracks';
const OFFLINE_CATEGORIES_KEY = 'offline_audio_categories';

interface SavedTrackInfo {
  id: string;
  categoryId: string;
  path: string;
  title: string;
  lastPlayedAt?: number;
}

const offlineAudioService = {
  /**
   * Lưu thông tin bài hát đã tải xuống vào danh sách offline
   */
  async saveTrackToOfflineList(trackId: string, categoryId: string, path: string, title: string): Promise<void> {
    try {
      // Lấy danh sách hiện tại
      const savedTracksJson = await AsyncStorage.getItem(OFFLINE_AUDIO_KEY);
      let savedTracks: SavedTrackInfo[] = savedTracksJson ? JSON.parse(savedTracksJson) : [];
      
      // Kiểm tra xem track đã tồn tại chưa
      const existingIndex = savedTracks.findIndex(track => track.id === trackId);
      
      if (existingIndex !== -1) {
        // Cập nhật thông tin nếu đã tồn tại
        savedTracks[existingIndex] = {
          ...savedTracks[existingIndex],
          path,
          title,
          categoryId
        };
      } else {
        // Thêm mới nếu chưa tồn tại
        savedTracks.push({
          id: trackId,
          categoryId,
          path,
          title,
          lastPlayedAt: Date.now()
        });
      }
      
      // Lưu lại danh sách
      await AsyncStorage.setItem(OFFLINE_AUDIO_KEY, JSON.stringify(savedTracks));
      
      // Cập nhật danh sách danh mục
      await this.updateOfflineCategoryList(categoryId);
    } catch (error) {
      console.error('Error saving track to offline list:', error);
    }
  },
  
  /**
   * Lấy danh sách tất cả bài hát đã tải xuống
   */
  async getAllOfflineTracks(): Promise<SavedTrackInfo[]> {
    try {
      const savedTracksJson = await AsyncStorage.getItem(OFFLINE_AUDIO_KEY);
      if (!savedTracksJson) return [];
      
      const savedTracks: SavedTrackInfo[] = JSON.parse(savedTracksJson);
      
      // Kiểm tra từng file có tồn tại không
      const validatedTracks: SavedTrackInfo[] = [];
      
      for (const track of savedTracks) {
        const exists = await ReactNativeBlobUtil.fs.exists(track.path);
        if (exists) {
          validatedTracks.push(track);
        }
      }
      
      // Nếu có tracks bị mất, cập nhật lại danh sách
      if (validatedTracks.length !== savedTracks.length) {
        await AsyncStorage.setItem(OFFLINE_AUDIO_KEY, JSON.stringify(validatedTracks));
      }
      
      return validatedTracks;
    } catch (error) {
      console.error('Error getting offline tracks:', error);
      return [];
    }
  },
  
  /**
   * Lấy danh sách bài hát đã tải xuống theo danh mục
   */
  async getOfflineTracksByCategoryId(categoryId: string): Promise<SavedTrackInfo[]> {
    try {
      const allTracks = await this.getAllOfflineTracks();
      return allTracks.filter(track => track.categoryId === categoryId);
    } catch (error) {
      console.error('Error getting offline tracks by category:', error);
      return [];
    }
  },
  
  /**
   * Xóa bài hát khỏi danh sách offline
   */
  async removeTrackFromOfflineList(trackId: string): Promise<boolean> {
    try {
      const savedTracksJson = await AsyncStorage.getItem(OFFLINE_AUDIO_KEY);
      if (!savedTracksJson) return false;
      
      let savedTracks: SavedTrackInfo[] = JSON.parse(savedTracksJson);
      const trackToRemove = savedTracks.find(track => track.id === trackId);
      
      if (!trackToRemove) return false;
      
      // Xóa file
      if (trackToRemove.path) {
        const exists = await ReactNativeBlobUtil.fs.exists(trackToRemove.path);
        if (exists) {
          await ReactNativeBlobUtil.fs.unlink(trackToRemove.path);
        }
      }
      
      // Cập nhật danh sách
      savedTracks = savedTracks.filter(track => track.id !== trackId);
      await AsyncStorage.setItem(OFFLINE_AUDIO_KEY, JSON.stringify(savedTracks));
      
      return true;
    } catch (error) {
      console.error('Error removing track from offline list:', error);
      return false;
    }
  },
  
  /**
   * Cập nhật danh sách danh mục có nhạc offline
   */
  async updateOfflineCategoryList(categoryId: string): Promise<void> {
    try {
      const categoriesJson = await AsyncStorage.getItem(OFFLINE_CATEGORIES_KEY);
      let categories: string[] = categoriesJson ? JSON.parse(categoriesJson) : [];
      
      // Kiểm tra danh mục đã có trong danh sách chưa
      if (!categories.includes(categoryId)) {
        categories.push(categoryId);
        await AsyncStorage.setItem(OFFLINE_CATEGORIES_KEY, JSON.stringify(categories));
      }
      
      // Kiểm tra và làm sạch danh sách nếu không còn bài hát nào
      const tracks = await this.getOfflineTracksByCategoryId(categoryId);
      if (tracks.length === 0) {
        categories = categories.filter(id => id !== categoryId);
        await AsyncStorage.setItem(OFFLINE_CATEGORIES_KEY, JSON.stringify(categories));
      }
    } catch (error) {
      console.error('Error updating offline category list:', error);
    }
  },
  
  /**
   * Lấy danh sách danh mục có nhạc offline
   */
  async getOfflineCategories(): Promise<string[]> {
    try {
      const categoriesJson = await AsyncStorage.getItem(OFFLINE_CATEGORIES_KEY);
      if (!categoriesJson) return [];
      
      return JSON.parse(categoriesJson);
    } catch (error) {
      console.error('Error getting offline categories:', error);
      return [];
    }
  },
  
  /**
   * Kiểm tra xem ứng dụng có đang offline không
   */
  async isOfflineMode(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return !netInfo.isConnected;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  },
  
  /**
   * Cập nhật thời gian phát gần nhất
   */
  async updateLastPlayedTime(trackId: string): Promise<void> {
    try {
      const savedTracksJson = await AsyncStorage.getItem(OFFLINE_AUDIO_KEY);
      if (!savedTracksJson) return;
      
      let savedTracks: SavedTrackInfo[] = JSON.parse(savedTracksJson);
      const index = savedTracks.findIndex(track => track.id === trackId);
      
      if (index !== -1) {
        savedTracks[index].lastPlayedAt = Date.now();
        await AsyncStorage.setItem(OFFLINE_AUDIO_KEY, JSON.stringify(savedTracks));
      }
    } catch (error) {
      console.error('Error updating last played time:', error);
    }
  }
};

export default offlineAudioService;
