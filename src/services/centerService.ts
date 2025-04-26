import { API_CENTER_URL, ASSETS_BASE_URL } from '../config';
import { CenterDTO } from '../dto/CenterDTO';



export const fetchCenters = async (): Promise<CenterDTO[]> => {
  try {
    const response = await fetch(API_CENTER_URL);
    
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data?.items?.length) {
      return [];
    }
    
    return data.items.map((item: any) => {
      let imageUrl = null;
      if (item.data.image?.iv?.[0]) {
        imageUrl = `${ASSETS_BASE_URL}${item.data.image.iv[0]}`;
      }
      
      const latitude = item.data.location?.iv?.latitude || 0;
      const longitude = item.data.location?.iv?.longitude || 0;
      
      return {
        id: item.id || '',
        name: item.data.name?.iv || 'Không có tên',
        address: item.data.address?.iv || 'Không có địa chỉ',
        phone: item.data.phone?.iv || 'Không có số điện thoại',
        latitude,
        longitude,
        image: imageUrl,
        createdAt: item.created,
        updatedAt: item.lastModified
      };
    });
    
  } catch (error) {
    console.error('Error fetching centers:', error);
    throw error;
  }
};