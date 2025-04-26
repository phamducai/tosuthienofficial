import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  ToastAndroid,
  Platform,
  SectionList,
  useWindowDimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BookStackParamList } from '../../types/navigation';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import bookServiceProxy from '../../proxy/bookServiceProxy';
import downloadBookService from '../../download/downloadBookService';
import { SimplifiedBookDTO } from '../../dto/BookDTO';
import bookCoverImage from '../../assets/book-covers.png';
import ConfirmModal from '../../components/modals/ConfirmModal';

type BookListNavigationProp = StackNavigationProp<BookStackParamList, 'BookList'>;

// Định nghĩa các section
type BookSection = {
  title: string;
  data: SimplifiedBookDTO[][];
};

const BookListScreen = () => {
  const navigation = useNavigation<BookListNavigationProp>();
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  
  // Tính toán số cột dựa trên kích thước màn hình
  const columnNum = useMemo(() => {
    // Điều chỉnh số cột theo kích thước màn hình
    if (screenWidth >= 600) return 3;     // Màn hình lớn/tablet
    if (screenWidth >= 400) return 2;     // Màn hình điện thoại vừa và lớn
    return 1;                             // Màn hình nhỏ
  }, [screenWidth]);
  
  // Tính toán kích thước cho mỗi item
  const itemDimensions = useMemo(() => {
    const padding = 16;                   // Padding của container
    const margin = 8;                     // Margin giữa các item
    const availableWidth = screenWidth - (padding * 2);
    const itemWidth = (availableWidth - (margin * 2 * columnNum)) / columnNum;
    const itemHeight = itemWidth * 1.5;
    
    return { itemWidth, itemHeight, padding, margin };
  }, [screenWidth, columnNum]);
  
  const [books, setBooks] = useState<SimplifiedBookDTO[]>([]);
  const [bookSections, setBookSections] = useState<BookSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{id: string, title: string, firstChapterId: string | null} | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{id: string, title: string} | null>(null);

  // Phân loại sách thành các section
  const categorizeBooks = useCallback((bookList: SimplifiedBookDTO[]) => {
    if (!bookList || !Array.isArray(bookList)) {
      console.error('bookList không phải là mảng:', bookList);
      setBookSections([]);
      return;
    }

    const downloadedBooks = bookList.filter(book => book.isDownload);
    const notDownloadedBooks = bookList.filter(book => !book.isDownload);
    
    // Chia thành các hàng có n item (n = columnNum)
    const downloadedRows: SimplifiedBookDTO[][] = [];
    const notDownloadedRows: SimplifiedBookDTO[][] = [];
    
    for (let i = 0; i < downloadedBooks.length; i += columnNum) {
      downloadedRows.push(downloadedBooks.slice(i, i + columnNum));
    }
    
    for (let i = 0; i < notDownloadedBooks.length; i += columnNum) {
      notDownloadedRows.push(notDownloadedBooks.slice(i, i + columnNum));
    }
    
    // Chỉ tạo section khi có sách
    const sections: BookSection[] = [];
    
    // Thêm section sách đã tải nếu có
    if (downloadedBooks.length > 0) {
      sections.push({
        title: 'Đã tải xuống',
        data: downloadedRows
      });
    }
    
    // Thêm section thư viện sách nếu có
    if (notDownloadedBooks.length > 0) {
      sections.push({
        title: 'Thư viện sách',
        data: notDownloadedRows
      });
    }
    
    setBookSections(sections);
  }, [columnNum]);

  // Tải danh sách sách
  const loadBooks = useCallback(async (fresh = false) => {
    try {
      const booksData = fresh 
        ? await bookServiceProxy.getBooksFresh()
        : await bookServiceProxy.getBooks();
      
      setBooks(booksData || []);
      categorizeBooks(booksData || []);
    } catch (err) {
      console.error('Error fetching books:', err);
      setBooks([]);
      setBookSections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categorizeBooks]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadBooks(true);
      }
    }, [loadBooks, loading])
  );

  // Xử lý refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBooks(true);
  }, [loadBooks]);

  // Thông báo
  const showToast = useCallback((message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      console.log(message);
    }
  }, []);

  const handleDownload = useCallback(async (bookId: string, title: string, firstChapterId: string | null) => {
    if (downloading[bookId] || !firstChapterId) return;

    try {
      setDownloading(prev => ({ ...prev, [bookId]: true }));
      showToast(`Đang tải xuống "${title}"`);      
      await downloadBookService.downloadBook(bookId, firstChapterId);
      loadBooks();
      showToast(`Đã tải xuống "${title}"`);
    } catch (err) {
      console.error('Error downloading book:', err);
      showToast('Lỗi khi tải xuống sách');
    } finally {
      setDownloading(prev => ({ ...prev, [bookId]: false }));
    }
  }, [downloading, loadBooks, showToast]);

  const handleRemoveDownload = useCallback((bookId: string, title: string) => {
    setBookToDelete({ id: bookId, title });
    setDeleteModalVisible(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!bookToDelete) return;
    
    try {
      await downloadBookService.removeDownloadedBook(bookToDelete.id);
      loadBooks();
      showToast(`Đã xóa "${bookToDelete.title}" khỏi thiết bị`);
    } catch (err) {
      console.error('Error removing book:', err);
      showToast('Lỗi khi xóa sách');
    } finally {
      setDeleteModalVisible(false);
      setBookToDelete(null);
    }
  }, [bookToDelete, loadBooks, showToast]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
    setBookToDelete(null);
  }, []);

  const navigateToBookDetail = useCallback((id: string, firstChapterId: string | null, isDownloaded: boolean) => {
    if (isDownloaded) {
      if (firstChapterId) {
        navigation.navigate('BookDetail', { bookId: id });
      } else {
        showToast('Sách này không có nội dung');
      }
    } else {
      const book = books.find(b => b.id === id);
      if (book) {
        setSelectedBook({
          id: book.id,
          title: book.title,
          firstChapterId: book.firstChapterId
        });
        setDownloadModalVisible(true);
      }
    }
  }, [navigation, showToast, books]);

  const handleConfirmDownload = useCallback(() => {
    if (selectedBook && selectedBook.firstChapterId) {
      handleDownload(selectedBook.id, selectedBook.title, selectedBook.firstChapterId);
      setDownloadModalVisible(false);
    } else {
      showToast('Không thể tải sách này');
      setDownloadModalVisible(false);
    }
  }, [selectedBook, handleDownload, showToast]);

  const handleCancelDownload = useCallback(() => {
    setDownloadModalVisible(false);
  }, []);

  const renderBookItem = useCallback((item: SimplifiedBookDTO) => {
    if (!item) return null;
    
    const { itemWidth, itemHeight } = itemDimensions;
    const isDownloaded = !!item.isDownload;
    const isDownloading = !!downloading[item.id];
    
    // Tính toán phần trăm tiến độ đọc
    let readingProgress = 0;
    if (isDownloaded && item.pageCurrent && item.pageTotal && item.pageTotal > 0) {
      readingProgress = Math.min(Math.round((item.pageCurrent / item.pageTotal) * 100), 100);
    }
  
    return (
      <TouchableOpacity
        style={[
          styles.bookItem,
          { width: itemWidth, height: itemHeight, marginHorizontal: itemDimensions.margin }
        ]}
        onPress={() => navigateToBookDetail(item.id, item.firstChapterId, isDownloaded)}
        activeOpacity={0.7}
        disabled={isDownloading}
      >
        <ImageBackground
          source={bookCoverImage}
          style={[styles.bookCover, isDownloaded && styles.downloadedBook]}
          resizeMode="cover"
          imageStyle={{ opacity: 0.7 }}
        >
          <TouchableOpacity
            style={styles.actionBadge}
            onPress={(e) => {
              e.stopPropagation();
              isDownloaded 
                ? handleRemoveDownload(item.id, item.title)
                : handleDownload(item.id, item.title, item.firstChapterId);
            }}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isDownloaded ? (
              <Icon name="cloud-done" size={20} color="#fff" />
            ) : (
              <Icon name="cloud-download-outline" size={20} color="#fff" />
            )}
          </TouchableOpacity>
  
          <View style={styles.titleContainer}>
            <Text style={styles.titleText} numberOfLines={2}>
              {item.title}
            </Text>
            
            {/* Hiển thị tiến độ đọc cho sách đã tải */}
            {isDownloaded && item.pageCurrent && item.pageTotal && (
              <View style={styles.progressContainer}>
                <View style={styles.circularProgressContainer}>
                  <View style={styles.circularProgressBackground} />
                  <View 
                    style={[
                      styles.circularProgressFill,
                      { 
                        width: `${readingProgress}%`,
                        backgroundColor: readingProgress >= 100 ? '#2196F3' : '#4CAF50' 
                      }
                    ]} 
                  />
                  <View style={styles.progressTextContainer}>
                    <Text style={styles.progressPercentage}>
                      {readingProgress}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.progressText}>
                  Trang {item.pageCurrent}/{item.pageTotal}
                </Text>
              </View>
              )}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  }, [navigateToBookDetail, downloading, handleDownload, handleRemoveDownload, itemDimensions]);

  const renderRow = useCallback(({ item }: { item: SimplifiedBookDTO[] }) => {
    const itemsToRender = [...item];
    // Đảm bảo đủ số lượng item trên mỗi hàng
    while (itemsToRender.length < columnNum) {
      itemsToRender.push(null as any);
    }
    
    return (
      <View style={[styles.row, { paddingHorizontal: itemDimensions.padding }]}>
        {itemsToRender.map((book, index) => (
          <React.Fragment key={book ? book.id : `empty-${index}`}>
            {book ? renderBookItem(book) : <View style={{ width: itemDimensions.itemWidth, marginHorizontal: itemDimensions.margin }} />}
          </React.Fragment>
        ))}
      </View>
    );
  }, [renderBookItem, columnNum, itemDimensions]);

  const renderSectionHeader = useCallback(({ section }: { section: BookSection }) => {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    );
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <SectionList
        sections={bookSections}
        keyExtractor={(item, index) => `section-${index}`}
        renderItem={renderRow}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />

      {/* Modal xác nhận tải sách */}
      <ConfirmModal
        visible={downloadModalVisible}
        title="Tải sách về máy"
        message={`Bạn cần tải "${selectedBook?.title || 'Sách'}" về máy trước khi đọc offline.`}
        confirmText="Tải xuống"
        cancelText="Hủy"
        onConfirm={handleConfirmDownload}
        onCancel={handleCancelDownload}
        onDismiss={handleCancelDownload}
        icon="cloud-download-outline"
      />

      {/* Modal xác nhận xóa sách */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Xóa sách"
        message={`Bạn có chắc chắn muốn xóa "${bookToDelete?.title || 'Sách'}" khỏi thiết bị?`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        onDismiss={handleCancelDelete}
        dangerous={true}
        icon="trash-outline"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 90,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  bookItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eaeaea',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  bookCover: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  downloadedBook: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  titleContainer: {
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  titleText: {
    color: '#b02525',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  circularProgressContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  circularProgressBackground: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  circularProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0, // This will be dynamically set based on progress
    height: 40,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    backgroundColor: '#4CAF50',
  },
  progressTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});

export default BookListScreen;