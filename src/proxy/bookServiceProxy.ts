import { SimplifiedBookDTO } from '../dto/BookDTO';
import bookService from '../services/bookService';
import { BaseServiceProxy } from './BaseServiceProxy';

class BookServiceProxy extends BaseServiceProxy {
  async getBooks(): Promise<SimplifiedBookDTO[]> {
    const cacheKey = 'all_books';
    try {
      const cachedData = await this.getFromCache<SimplifiedBookDTO[]>(cacheKey);
      if (cachedData && Array.isArray(cachedData)) {
        return cachedData;
      }
      
      const freshData = await bookService.fetchBooks();
      if (!freshData || !Array.isArray(freshData)) {
        console.error('fetchBooks returned invalid data:', freshData);
        return [];
      }
      
      await this.saveToDirectCache(cacheKey, freshData);
      return freshData;
    } catch (error) {
      console.error('Error in getBooks:', error);
      return [];
    }
  }

  async getBooksFresh(): Promise<SimplifiedBookDTO[]> {
    const cacheKey = 'all_books';
    let cachedData: SimplifiedBookDTO[] | null = null;
    
    try {
      cachedData = await this.getFromCache<SimplifiedBookDTO[]>(cacheKey);
      const newData = await bookService.fetchBooks();
      
      if (!newData || !Array.isArray(newData)) {
        console.error('fetchBooks returned invalid data:', newData);
        return cachedData && Array.isArray(cachedData) ? cachedData : [];
      }
      
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        console.log('Merging fresh data with cache');
        const mergedData = newData.map(newBook => {
        const cachedBook = cachedData && cachedData.find(cached => cached.id === newBook.id);
          if (cachedBook && cachedBook.isDownload === true) {
            return {
              ...newBook,
              isDownload: true,
              path: cachedBook.path,
              pageCurrent:cachedBook.pageCurrent
            };
          }
          return newBook;
        });
        await this.saveToDirectCache(cacheKey, mergedData);
        return mergedData;
      }
      
      await this.saveToDirectCache(cacheKey, newData);
      return newData;
    } catch (error) {
      console.error('Error in getBooksFresh:', error);
      if (cachedData && Array.isArray(cachedData)) {
        return cachedData;
      }
      return [];
    }
  }

  async getBookById(id: string): Promise<SimplifiedBookDTO | null> {
    if (!id) {
      console.error('Invalid book ID');
      return null;
    }
    
    try {
      const cacheKey = 'all_books';
      // First check if the book exists in the cache
      const cachedData = await this.getFromCache<SimplifiedBookDTO[]>(cacheKey);
      
      console.log(cacheKey);
      if (cachedData && Array.isArray(cachedData)) {
        const cachedBook = cachedData.find(book => book.id === id);
        if (cachedBook) {
          return cachedBook;
        }
      }
      const books = await this.getBooks();
      return books.find(book => book.id === id) || null;
    } catch (error) {
      return null;
    }
  }

  async updateBookDownloadStatus(bookId: string, isDownloaded: boolean, filePath?: string): Promise<boolean> {
    if (!bookId) {
      console.error('Invalid book ID');
      return false;
    }
    
    try {
      const cacheKey = 'all_books';
      const books = await this.getFromCache<SimplifiedBookDTO[]>(cacheKey);
      
      if (!books) {
        return false;
      }
      
      const updatedBooks = books.map(book => {
        if (book.id === bookId) {
          return {
            ...book,
            isDownload: isDownloaded,
            path: isDownloaded ? (filePath || book.path) : null,
            pageCurrent:book.pageCurrent
          };
        }
        return book;
      });
      
      await this.saveToDirectCache(cacheKey, updatedBooks);
      return true;
    } catch (error) {
      console.error(`Error updating download status for book ${bookId}:`, error);
      return false;
    }
  }

  async getAllDownloadedBooks(): Promise<SimplifiedBookDTO[]> {
    try {
      const books = await this.getBooks();
      return books.filter(book => book.isDownload === true);
    } catch (error) {
      console.error('Error getting downloaded books:', error);
      return [];
    }
  }

  async clearCache(): Promise<boolean> {
    try {
      await this.clearCacheByKey('all_books');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }
  
  async updateBookCurrentPage(bookId: string, pageNumber: number): Promise<boolean> {
    if (!bookId) {
      console.error('Invalid book ID');
      return false;
    }
    
    try {
      const cacheKey = 'all_books';
      const books = await this.getFromCache<SimplifiedBookDTO[]>(cacheKey);
      
      if (!books) {
        return false;
      }
      
      const updatedBooks = books.map(book => {
        if (book.id === bookId) {
          return {
            ...book,
            pageCurrent: pageNumber
          };
        }
        return book;
      });
      
      await this.saveToDirectCache(cacheKey, updatedBooks);
      return true;
    } catch (error) {
      console.error(`Error updating current page for book ${bookId}:`, error);
      return false;
    }
  }
}

const bookServiceProxy = new BookServiceProxy();
export default bookServiceProxy;
