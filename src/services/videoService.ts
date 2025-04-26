
import { API_VIDEO_URL } from '../config';
import {VideoColection,VideoColectionDetail} from '../dto'


export const fetchVideoCategorys = async (): Promise<VideoColection[]> => {
  try {    
    const response = await fetch(API_VIDEO_URL);
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const data = await response.json();
    // Transform API data to include id, name, and audios
    if (data && data.items) {
      return data.items.map((item: any) => ({
        id: item.id,
        name: item.data.name.iv,
        description: item.data.description.iv,
      }));
    }
    
    return [];
  } catch (error) {
    throw error;
  }
};

export const fetchVideoCategoryById = async (id: string): Promise<VideoColectionDetail | null> => {
  try {
    const url = `${API_VIDEO_URL}/${id}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    const item = await response.json();
    
    return {
      id: item.id,
      videos:item.data.videos.iv||[]
    };
  } catch (error) {
    return null;
  }
};

export default {
  fetchVideoCategorys,
  fetchVideoCategoryById
};