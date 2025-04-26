import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Easing,
  Dimensions,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AudioCollection } from '../../dto/AudioDTO';
import audioServiceProxy from '../../proxy/audioServiceProxy';
import Icon from 'react-native-vector-icons/Ionicons';
import { AlertModal } from '../../components/modals';
import { AudioStackParamList } from '../../types/navigation';

type AudioCategoriesNavigationProp = StackNavigationProp<AudioStackParamList, 'AudioCategories'>;

const { width, height } = Dimensions.get('window');

// Mảng màu cho các card - Màu sắc thanh tịnh, hài hòa phù hợp với Thiền tông và Phật pháp
const CARD_COLORS = [
  '#8E6D5A',  // Nâu đất - màu áo thiền
  '#5B7C5B',  // Xanh lá nhạt - màu của sự thanh tịnh
  '#7D6B94',  // Tím nhạt - màu của sự tĩnh tâm
  '#6D5C7A',  // Tím xanh - màu của giác ngộ 
  '#6A7B98',  // Xám xanh - màu của bầu trời thanh bình
  '#A17C51',  // Vàng đất - màu của Phật giáo
  '#7E7250',  // Màu lúa - biểu tượng cho sự bình dị
  '#836953',  // Màu gỗ - biểu tượng của sự vững chãi
  '#596C8E',  // Xanh nước biển - biểu tượng của sự sâu thẳm
];

// Icons cho các danh mục phù hợp với Thiền tông và Phật pháp - hướng tới giải thoát
const CATEGORY_ICONS = [
  'flower-outline',        // Hoa sen - biểu tượng của sự thuần khiết vươn lên từ bùn lầy
  'flame-outline',         // Ngọn lửa - biểu tượng của ánh sáng trí tuệ Phật pháp
  'prism-outline',         // Lăng kính - biểu tượng của sự nhìn thấu suốt vạn pháp
  'star-outline',          // Ngôi sao - biểu tượng chỉ đường trong đêm tối của vô minh
  'moon-outline',          // Mặt trăng - biểu tượng của sự tĩnh lặng, thanh tịnh
  'water-outline',         // Nước - biểu tượng của tâm không dao động
  'leaf-outline',          // Lá bồ đề - biểu tượng của sự giác ngộ
  'infinite-outline',      // Vô hạn - biểu tượng của con đường giải thoát
  'earth-outline',         // Trái đất - biểu tượng của sự bao dung, rộng lớn 
  'cloud-outline',         // Mây - biểu tượng của sự không chấp thủ, đến rồi đi
  'sunny-outline',         // Mặt trời - biểu tượng của trí tuệ soi sáng
];

// Thiết lập kích thước card đơn giản
const CARD_HEIGHT = 100; // Giảm xuống để vừa vặn hơn trên các màn hình nhỏ

const AudioCategoriesScreen = () => {
  const [categories, setCategories] = useState<AudioCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<AudioCategoriesNavigationProp>();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  // Modal states
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    loadCategories();
  }, [currentCategoryId]);
  
  // Animation khi lần đầu tải danh mục
  useEffect(() => {
    if (!loading && categories.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        })
      ]).start();
    }
  }, [loading, categories.length]);

  const loadCategories = async (forceRefresh = false) => {
    try {
      setLoading(true);
      // Reset animation values
      fadeAnim.setValue(0);
      translateY.setValue(20);
      
      // Fetch categories từ proxy - sử dụng hàm Fresh khi kéo để refresh
      const data = forceRefresh 
        ? await audioServiceProxy.getAudioCategoryFresh(currentCategoryId) 
        : await audioServiceProxy.getAudioCategory(currentCategoryId);
      
      setCategories(data);
    } catch (err) {
      console.error('Failed to load audio categories:', err);
      setErrorModal({
        visible: true,
        title: 'Lỗi',
        message: 'Không thể tải danh mục âm thanh. Vui lòng thử lại sau.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const navigateToAudioList = (categoryId: string, categoryName: string, isCategory?: boolean) => {
    console.log(`Navigating to AudioList with categoryId: ${categoryId}, categoryName: ${categoryName}, isCategory: ${isCategory}`);
    if (isCategory) {
      setCurrentCategoryId(categoryId);
    } else {
      navigation.navigate('AudioList', { categoryId, categoryName });
    }
  };

  // Tách CategoryItem thành một functional component riêng để sử dụng hooks
  const CategoryItem = React.memo(({ item, index, onPress }: { 
    item: AudioCollection; 
    index: number; 
    onPress: (id: string, name: string, isCategory?: boolean) => void; 
  }) => {
    // Sử dụng màu và icon khác nhau cho mỗi danh mục
    const cardColor = CARD_COLORS[index % CARD_COLORS.length];
    const iconName = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
    
    // Animation delay dựa trên index để mỗi item xuất hiện tuần tự
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const itemTranslateY = useRef(new Animated.Value(20)).current;
    
    useEffect(() => {
      const delay = index * 100; // Mỗi item sẽ xuất hiện sau một khoảng thời gian
      
      Animated.parallel([
        Animated.timing(itemFadeAnim, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(itemTranslateY, {
          toValue: 0,
          duration: 400,
          delay,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        })
      ]).start();
    }, [index]);
    
    return (
      <Animated.View
        style={{
          opacity: itemFadeAnim,
          transform: [{ translateY: itemTranslateY }]
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onPress(item.id, item.name, item.isCategory)}
          style={styles.cardTouchable}
        >
          <View 
            style={[
              styles.cardContent, 
              { 
                backgroundColor: cardColor,
                height: CARD_HEIGHT 
              }
            ]}
          >
            <View style={styles.iconContainer}>
              <Icon name={iconName} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.categoryName} numberOfLines={1} ellipsizeMode="tail">
                {item.name}
              </Text>
              {item.description && (
                <Text style={styles.categoryDescription} numberOfLines={2} ellipsizeMode="tail">
                  {item.description || ""}
                </Text>
              )}
            </View>
            <Icon name="chevron-forward-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  });
  
  // Render mỗi danh mục với hiệu ứng và giao diện đẹp hơn
  const renderItem = ({item, index}: {item: AudioCollection; index: number}) => {
    return <CategoryItem item={item} index={index} onPress={navigateToAudioList} />;
  };

  const handleRetry = () => {
    setCurrentCategoryId(null);
    loadCategories(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8E6D5A" />
      </View>
    );
  }

  const navigateToOfflineAudio = () => {
    navigation.navigate('OfflineAudio');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          {currentCategoryId ? (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setCurrentCategoryId(null)}
            >
              <Icon name="arrow-back-outline" size={22} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Quay lại danh mục chính</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.titleContainer}>
              <Icon name="leaf-outline" size={22} color="#FFFFFF" style={styles.headerIcon} />
              <Text style={styles.headerTitle}>Danh Mục Pháp Âm</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.offlineButton}
            onPress={navigateToOfflineAudio}
          >
            <Icon name="download-outline" size={20} color="#FFFFFF" />
            <Text style={styles.offlineButtonText}>Đã tải</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {categories.length === 0 && !loading ? (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerContainer}>
            <Image 
              source={require('../../assets/logo-tosuthien.png')} 
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>Chưa có danh mục nào</Text>
            <Text style={styles.emptySubText}>Không tìm thấy dữ liệu cho danh mục này</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={handleRetry}
            >
              <Text style={styles.retryText}>Tải lại</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadCategories(true);
          }}
        />
      )}
      
      {/* Error Modal */}
      <AlertModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onDismiss={() => setErrorModal({ ...errorModal, visible: false })}
        buttons={[
          {
            text: 'Thử lại',
            onPress: () => {
              setErrorModal({ ...errorModal, visible: false });
              handleRetry();
            },
            mode: 'contained'
          }
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#8E6D5A',
    paddingTop: Math.min(8, height * 0.01),
    paddingBottom: Math.min(16, height * 0.02),
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Math.min(12, height * 0.015),
    paddingHorizontal: Math.min(16, width * 0.04),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: Math.min(20, width * 0.05),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.min(20, width * 0.05),
    paddingVertical: Math.min(20, height * 0.03),
  },
  emptyImage: {
    width: Math.min(120, width * 0.3),
    height: Math.min(120, width * 0.3),
    tintColor: '#8E6D5A',
    marginBottom: 20,
  },
  listContent: {
    padding: Math.min(16, width * 0.04),
    paddingBottom: Math.min(32, height * 0.04),
  },
  cardTouchable: {
    marginBottom: Math.min(16, height * 0.02),
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    height: CARD_HEIGHT,
    backgroundColor: '#fff', // Thêm background color để tránh hiện tượng nhấp nháy
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: Math.min(16, width * 0.04),
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconContainer: {
    width: Math.min(40, width * 0.10),
    height: Math.min(40, width * 0.10),
    borderRadius: Math.min(20, width * 0.05),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.min(10, width * 0.025),
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  categoryName: {
    fontSize: Math.min(16, width * 0.04),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: Math.min(13, width * 0.033),
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: Math.min(16, width * 0.038),
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 6,
  },
  emptyText: {
    fontSize: Math.min(18, width * 0.045),
    fontWeight: 'bold',
    color: '#5B4B3E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: Math.min(14, width * 0.035),
    color: '#6E6259',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8E6D5A',
    paddingVertical: Math.min(12, height * 0.015),
    paddingHorizontal: Math.min(24, width * 0.06),
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: Math.min(15, width * 0.038),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: Math.min(16, width * 0.04),
    color: '#FFFFFF',
    fontWeight: '500',
    flexShrink: 1, 
  },
  offlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Math.min(8, height * 0.01),
    paddingHorizontal: Math.min(12, width * 0.03),
    borderRadius: 20,
  },
  offlineButtonText: {
    marginLeft: 6,
    fontSize: Math.min(14, width * 0.035),
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default AudioCategoriesScreen;