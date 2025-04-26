import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import bookServiceProxy from '../proxy/bookServiceProxy';

const BASE_URL = 'https://cms.tosu-thien.com/api/assets/tosuthien/';

// Tạo tên file từ ID
const createFileName = (id: string) => {
  return `${id}.pdf`;
};

// Tải sách
export const downloadBook = async (bookId: string, firstChapterId: string): Promise<string> => {
  if (!bookId || !firstChapterId) {
    throw new Error('ID sách hoặc ID chương không hợp lệ');
  }

  try {
    console.log(`Bắt đầu tải sách: ${bookId}`);
    const downloadUrl = `${BASE_URL}${firstChapterId}`;
    const safeFileName = createFileName(bookId);
    const { dirs } = ReactNativeBlobUtil.fs;
    
    let filePath: string;
    if (Platform.OS === 'android') {
      filePath = `${dirs.CacheDir}/${safeFileName}`;
    } else {
      filePath = `${dirs.DocumentDir}/${safeFileName}`;
    }
    
    const fileExists = await ReactNativeBlobUtil.fs.exists(filePath);
    if (fileExists) {
      await ReactNativeBlobUtil.fs.unlink(filePath);
    }
    
    const res = await ReactNativeBlobUtil
      .config({
        fileCache: true,
        path: filePath
      })
      .fetch('GET', downloadUrl, {
        'Accept': 'application/pdf',
        'User-Agent': 'tosuthien-app'
      });
    
    console.log('Tải xuống sách hoàn tất, đang kiểm tra file...');
    const status = res.info().status;
    
    if (status !== 200) {
      console.error(`Lỗi tải xuống sách. Status code: ${status}`);
      throw new Error(`Tải sách thất bại với status code ${status}`);
    }
    
    const stats = await ReactNativeBlobUtil.fs.stat(filePath);
    console.log(`Tải xuống thành công: ${filePath}, kích thước: ${stats.size} bytes`);
    
    await updateBookDownloadStatus(bookId, filePath);
    
    return filePath;
  } catch (error) {
    console.error('Lỗi khi tải sách:', error);
    throw error;
  }
};

export const updateBookDownloadStatus = async (bookId: string, filePath: string): Promise<void> => {
  try {
    await bookServiceProxy.updateBookDownloadStatus(bookId, true, filePath);
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái tải xuống:', error);
    throw error;
  }
};

// Xóa sách đã tải
export const removeDownloadedBook = async (bookId: string): Promise<void> => {
  try {
    const book = await bookServiceProxy.getBookById(bookId);
    
    if (book && book.path) {
      const fileExists = await ReactNativeBlobUtil.fs.exists(book.path);
      if (fileExists) {
        await ReactNativeBlobUtil.fs.unlink(book.path);
        console.log(`Đã xóa file: ${book.path}`);
      }
    }
    await bookServiceProxy.updateBookDownloadStatus(bookId, false);
  } catch (error) {
    console.error('Lỗi khi xóa sách:', error);
    throw error;
  }
};

// Kiểm tra sách đã tải chưa
export const isBookDownloaded = async (bookId: string): Promise<boolean> => {
  try {
    const book = await bookServiceProxy.getBookById(bookId);
    
    if (!book || !book.path) {
      return false;
    }
    
    return await ReactNativeBlobUtil.fs.exists(book.path);
  } catch (error) {
    console.error('Lỗi khi kiểm tra sách đã tải:', error);
    return false;
  }
};

export default {
  downloadBook,
  removeDownloadedBook,
  isBookDownloaded,
  updateBookDownloadStatus
};
