import { API_BOOK_URL } from '../config';
import { SimplifiedBookDTO } from '../dto/BookDTO';


export const fetchBooks = async (): Promise<SimplifiedBookDTO[]> => {
  try {
    
    const response = await fetch(API_BOOK_URL);
    
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data && data.items) {
      return data.items.map((item: any) => ({
        id: item.id,
        title: item.data.title.iv,
        description: item.data.description.iv,
        firstChapterId: item.data.book.iv && item.data.book.iv.length > 0 ? item.data.book.iv[0] : null,
        isDownload: false,
        path: null,
        pageCurrent:1,
        pageTotal:item.data.pageTotal.iv
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

export default {
  fetchBooks,
};