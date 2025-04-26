import { CenterDTO } from '../dto/CenterDTO';
import * as centerService from '../services/centerService';
import { BaseServiceProxy } from './BaseServiceProxy';

class CenterServiceProxy extends BaseServiceProxy {
  private CENTERS_CACHE_KEY = 'all_centers';

  /**
   * Lấy danh sách trung tâm từ cache, nếu không có thì gọi API
   */
  async getCenters(): Promise<CenterDTO[]> {
    try {
      // Thử lấy từ cache trước
      const cachedData = await this.getFromCache<CenterDTO[]>(this.CENTERS_CACHE_KEY);
      if (cachedData && Array.isArray(cachedData)) {
        console.log('Lấy danh sách trung tâm từ cache');
        return cachedData;
      }
      
      const freshData = await centerService.fetchCenters();
      if (freshData && Array.isArray(freshData)) {
        await this.saveToCache(this.CENTERS_CACHE_KEY, freshData);
        return freshData;
      }
      
      return [];
    } catch (error) {
      console.error('Lỗi khi lấy danh sách trung tâm:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách trung tâm mới từ API và cập nhật cache
   */
  async getCentersFresh(): Promise<CenterDTO[]> {
    try {
      const freshData = await centerService.fetchCenters();
      
      if (freshData && Array.isArray(freshData)) {
        await this.saveToCache(this.CENTERS_CACHE_KEY, freshData);
        return freshData;
      }
      
      return [];
    } catch (error) {
      const cachedData = await this.getFromCache<CenterDTO[]>(this.CENTERS_CACHE_KEY);
      if (cachedData && Array.isArray(cachedData)) {
        return cachedData;
      }
      
      return [];
    }
  }


  async clearCache(): Promise<void> {
    try {
      await this.clearCacheByKey(this.CENTERS_CACHE_KEY);
    } catch (error) {
      console.error('Lỗi khi xóa cache trung tâm:', error);
    }
  }
}

const centerServiceProxy = new CenterServiceProxy();
export default centerServiceProxy;
