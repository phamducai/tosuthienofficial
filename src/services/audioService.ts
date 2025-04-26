import { AudioCollection, AudioCollectionDetail } from '../dto/AudioDTO';
import {API_AUDIO_URL} from '../config'
// Base API URL

const FILTER_URL = `${API_AUDIO_URL}?$filter=data/category/iv eq`;

export const fetchAudioCategory = async (params: string | null): Promise<AudioCollection[]> => {  
  try {
    const url = `${FILTER_URL} ${params === null ? null : `'${params}'&$orderby=created asc`}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.items) {
      return data.items.map((item: any) => ({
        id: item.id,
        name: item.data.name.iv,
        isCategory: item.data.isCategory.iv,
        description: item.data.description.iv,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching audio collections:', error);
    throw error;
  }
};

export const fetchAudioById = async (id: string): Promise<AudioCollectionDetail | null> => {
  try {
    const url = `${API_AUDIO_URL}/${id}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const item = await response.json();
    return {
      id: item.id,
      name: item.data.name.iv,
      audios: item.data.audios?.iv || [],
      isCategory: item.data.isCategory?.iv,
    };
  } catch (error) {
    console.error(`Error fetching audio collection with ID ${id}:`, error);
    return null;
  }
};

export default {
  fetchAudioCategory,
  fetchAudioById
};