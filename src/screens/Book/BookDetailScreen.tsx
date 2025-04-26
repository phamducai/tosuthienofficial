import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BookStackParamList } from '../../navigation/types';
import Pdf from 'react-native-pdf';
import Icon from 'react-native-vector-icons/Ionicons';
import bookServiceProxy from '../../proxy/bookServiceProxy';

type BookDetailScreenRouteProp = RouteProp<BookStackParamList, 'BookDetail'>;
type BookDetailScreenNavigationProp = StackNavigationProp<BookStackParamList, 'BookDetail'>;

interface BookDetailScreenProps {
  route: BookDetailScreenRouteProp;
  navigation: BookDetailScreenNavigationProp;
}

const BookDetailScreen: React.FC<BookDetailScreenProps> = ({ route, navigation }) => {
  // Sử dụng useWindowDimensions để tự động cập nhật khi xoay màn hình
  const { width, height } = useWindowDimensions();
  const { bookId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookPath, setBookPath] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Lấy thông tin sách
  useEffect(() => {
    const loadBook = async () => {
      try {
        setLoading(true);
        console.log(bookId);
        const book = await bookServiceProxy.getBookById(bookId);
        
        if (!book) {
          setError('Không tìm thấy thông tin sách');
          setLoading(false);
          return;
        }

        if (!book.isDownload || !book.path) {
          setError('Sách chưa được tải xuống');
          setLoading(false);
          return;
        }
        
        setBookPath(book.path);
        if (book.pageCurrent && book.pageCurrent > 0) {
          setCurrentPage(book.pageCurrent);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading book:', err);
        setError('Có lỗi khi tải sách');
        setLoading(false);
      }
    };
    
    loadBook();
  }, [bookId]);

  const onChangePage = async(page : number) => {
    console.log(page);
    try {
      await bookServiceProxy.updateBookCurrentPage(bookId, page);
    } catch (error) {
      console.error('Error saving current page:', error);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar hidden={true} />
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải sách...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar hidden={true} />
        <Icon name="alert-circle-outline" size={50} color="#ff0000" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Trở về</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <View style={styles.pdfContainer}>
        {bookPath && (
          <Pdf
            source={{ uri: `file://${bookPath}` }}
            onPageChanged={onChangePage}
            onLoadComplete={(numberOfPages: number) => {
              setPageCount(numberOfPages);
            }}
            onError={(error) => {
              console.log('PDF error:', error);
              setError('Lỗi khi hiển thị PDF');
            }}
            style={[styles.pdf, { width, height }]}
            enablePaging={true}
            horizontal={true}
            page={currentPage}
            spacing={0}
            fitPolicy={0} // Đảm bảo PDF vừa với khung hình
            renderActivityIndicator={() => <ActivityIndicator color="#0066cc" />}
            minScale={1.0}
            maxScale={4.0}
            scale={1.0}
          />
        )}
      </View>
      <TouchableOpacity 
        style={[
          styles.simpleBackButton,
          // Điều chỉnh vị trí nút dựa trên hướng màn hình
          width > height ? styles.backButtonLandscape : styles.backButtonPortrait
        ]} 
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Thêm thông tin trang hiện tại */}
      {pageCount > 0 && (
        <View style={styles.pageInfo}>
          <Text style={styles.pageInfoText}>{currentPage}/{pageCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0066cc',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#F8F5E6',
  },
  pdf: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  simpleBackButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  backButtonPortrait: {
    top: 20,
    left: 20,
  },
  backButtonLandscape: {
    top: 10,
    left: 10,
  },
  pageInfo: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pageInfoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  }
});

export default BookDetailScreen;