import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Linking,
  Platform,
  Clipboard,
  ActivityIndicator,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Card, Title, Paragraph, Text, Divider, Button, Appbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import AlertModal from '../../components/modals/AlertModal';
import { CenterDTO } from '../../dto/CenterDTO';
import centerServiceProxy from '../../proxy/centerServiceProxy';

const CenterListScreen = () => {
  const { width } = useWindowDimensions(); // Using useWindowDimensions for better responsive support
  const [centers, setCenters] = useState<CenterDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [numColumns, setNumColumns] = useState(getColumnCount(width));
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [alertButtons, setAlertButtons] = useState<{text: string, onPress: () => void, color?: string, mode?: 'text' | 'outlined' | 'contained'}[]>([]);
  
  // Function to determine column count based on screen width
  function getColumnCount(width: number): number {
    if (width >= 1024) return 3; // Large tablets/desktop: 3 columns
    if (width >= 768) return 2;  // Regular tablets: 2 columns
    return 1;                    // Phones: 1 column
  }
  
  // Fetch centers data on component mount
  useEffect(() => {
    loadCenters();
  }, []);
  
  // Function to load centers from service
  const loadCenters = async (forceFresh = false) => {
    try {
      setLoading(true);
      const data = forceFresh 
        ? await centerServiceProxy.getCentersFresh()
        : await centerServiceProxy.getCenters();
      
      setCenters(data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu trung tâm:', error);
      showAlert(
        'Lỗi tải dữ liệu',
        'Không thể tải danh sách trung tâm. Vui lòng thử lại sau.',
        'error',
        [{ text: 'Đóng', onPress: () => setAlertVisible(false) }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadCenters(true);
  };
  
  // Helper function to show alerts
  const showAlert = (
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error', 
    buttons: {text: string, onPress: () => void, color?: string, mode?: 'text' | 'outlined' | 'contained'}[]
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertButtons(buttons);
    setAlertVisible(true);
  };
  
  // Update layout when dimensions change
  useEffect(() => {
    const updateLayout = () => {
      const { width } = Dimensions.get('window');
      setNumColumns(getColumnCount(width));
    };
    
    // Set initial columns
    updateLayout();
    
    // Add listener for orientation changes
    const dimensionsListener = Dimensions.addEventListener('change', updateLayout);
    
    return () => {
      // Clean up listener (newer versions of React Native handle this automatically)
      if (dimensionsListener?.remove) {
        dimensionsListener.remove();
      }
    };
  }, []);
  
  // Function to handle phone call
  const handlePhoneCall = (phoneNumber: string) => {
    // Loại bỏ khoảng trắng và ký tự đặc biệt
    const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Thêm prefix +84 nếu số điện thoại bắt đầu bằng 0
    const formattedNumber = cleanNumber.startsWith('0') 
      ? `+84${cleanNumber.substring(1)}` 
      : cleanNumber;
    
    // Tạo URL điện thoại với định dạng đúng
    const phoneUrl = Platform.select({
      ios: `telprompt:${formattedNumber}`,
      android: `tel:${formattedNumber}`,
      default: `tel:${formattedNumber}`
    });
    
    if (phoneUrl) {
      console.log(`Thực hiện cuộc gọi đến: ${phoneUrl}`);
      
      // Thử mở URL trực tiếp
      Linking.openURL(phoneUrl)
        .then(() => console.log('Cuộc gọi đã được khởi tạo'))
        .catch(error => {
          console.error('Lỗi khi gọi điện:', error);
          
          showAlert(
            'Không thể gọi điện',
            'Không thể thực hiện cuộc gọi. Vui lòng kiểm tra thiết bị của bạn.',
            'error',
            [
              { 
                text: 'Sao chép số điện thoại', 
                onPress: () => {
                  if (formattedNumber) {
                    Clipboard.setString(formattedNumber);
                    showAlert(
                      'Đã sao chép',
                      'Số điện thoại đã được sao chép',
                      'success',
                      [{ text: 'Đóng', onPress: () => setAlertVisible(false) }]
                    );
                  }
                },
                mode: 'contained',
                color: '#4CAF50'
              },
              { 
                text: 'Đóng', 
                onPress: () => setAlertVisible(false),
                mode: 'text'
              }
            ]
          );
        });
    }
  };

  // Function to open location in Google Maps
  const openInMaps = (name: string, latitude: number, longitude: number) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q='
    });
    
    const latLng = `${latitude},${longitude}`;
    const label = encodeURIComponent(name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    if (url) {
      Linking.openURL(url)
        .catch(err => {
          console.error('An error occurred', err);
          
          // Fallback to Google Maps web URL if app isn't installed
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}&query_place_id=${label}`;
          Linking.openURL(googleMapsUrl)
            .catch(err => {
              // Hiển thị thông báo lỗi với AlertModal
              showAlert(
                'Thông báo',
                'Không thể mở bản đồ',
                'error',
                [{ text: 'Đóng', onPress: () => setAlertVisible(false) }]
              );
            });
        });
    }
  };

  const calculateItemWidth = () => {
    const margins = 32; // Total horizontal margins
    const gap = (numColumns - 1) * 16; // Gap between items
    
    return (width - margins - gap) / numColumns;
  };

  const renderItem = ({ item }: { item: CenterDTO }) => (
    <TouchableOpacity
      style={[
        styles.centerItem,
        { width: calculateItemWidth() }
      ]}
    >
      <Card style={styles.card}>
        <Card.Cover 
          source={{ uri: item.image }} 
          style={styles.cardImage} 
          resizeMode="cover"
        />
        <Card.Content style={styles.cardContent}>
          <Title style={styles.name} numberOfLines={2} ellipsizeMode="tail">{item.name}</Title>
          <Divider style={styles.divider} />
          
          {/* Địa chỉ với nút dẫn đường */}
          <View style={styles.infoRow}>
            <Icon name="location-outline" size={16} color="#666" style={styles.icon} />
            <Paragraph style={styles.infoText} numberOfLines={3} ellipsizeMode="tail">
              {item.address}
            </Paragraph>
          </View>
          
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => openInMaps(item.name, item.latitude, item.longitude)}
            activeOpacity={0.7}
          >
            <Icon name="navigate-outline" size={14} color="#1976D2" />
            <Text style={styles.mapButtonText}>Chỉ đường</Text>
          </TouchableOpacity>
          
          {/* Số điện thoại */}
          <TouchableOpacity 
            style={styles.phoneRow}
            onPress={() => handlePhoneCall(item.phone)}
            activeOpacity={0.7}
          >
            <Icon name="call-outline" size={16} color="#4CAF50" style={styles.icon} />
            <Text style={styles.phoneText}>
              {item.phone}
            </Text>
            <View style={styles.callNowButton}>
              <Text style={styles.callNowText}>Gọi ngay</Text>
            </View>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1976D2" barStyle="light-content" />
      <Appbar.Header style={styles.header}>
        <Appbar.Content 
          title="Danh Sách Thiền đường" 
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>
      
      <FlatList
        data={centers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={numColumns}
        key={numColumns.toString()} // Force re-render when columns change
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="alert-circle-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>Không có trung tâm nào</Text>
            <Button 
              mode="contained" 
              onPress={() => loadCenters(true)}
              style={styles.retryButton}
            >
              Thử lại
            </Button>
          </View>
        }
      />
      
      {/* Alert Modal */}
      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onDismiss={() => setAlertVisible(false)}
        type={alertType}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976D2',
    elevation: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#1976D2',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  centerItem: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 12,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    minHeight: 0,
  },
  divider: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'space-between',
  },
  icon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    flex: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  mapButtonText: {
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 4,
  },
  callNowButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  callNowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CenterListScreen;