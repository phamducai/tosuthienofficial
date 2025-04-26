import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  useWindowDimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  Card,
  Title,
  Text,
  Button,
  Appbar,
  Paragraph,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoStackParamList } from '../../types/navigation';
import { VideoColection } from '../../dto/VideoDTO';
import videoServiceProxy from '../../proxy/videoServiceProxy';

type VideoCategoriesNavigationProp = StackNavigationProp<VideoStackParamList, 'VideoCategories'>;

// Zen-inspired color palette
const ZEN_COLORS = {
  primary: '#4A593D',    // Forest green - represents trees and nature
  secondary: '#8E6D57',  // Earth brown - represents earth and stability
  accent1: '#D0C3B6',    // Soft beige - represents sand in zen gardens
  accent2: '#5D7874',    // Slate blue - represents water and tranquility
  accent3: '#9C5F41',    // Terracotta - represents clay and pottery
  background: '#F5F3EF',  // Ivory - represents simplicity and clean space
  text: '#3A3A3A',       // Dark gray - represents balance and mindfulness
};

// Mảng màu nền cho card
const CARD_COLORS = [
  'rgba(74, 89, 61, 0.8)',    // Forest green
  'rgba(142, 109, 87, 0.8)',  // Earth brown
  'rgba(93, 120, 116, 0.8)',  // Slate blue
  'rgba(156, 95, 65, 0.8)',   // Terracotta
  'rgba(112, 114, 105, 0.8)'  // Stone gray
];

// Chiều cao cố định cho tất cả các card
const FIXED_CARD_HEIGHT = 80;

const VideoCategoriesScreen = () => {
  const navigation = useNavigation<VideoCategoriesNavigationProp>();
  const [categories, setCategories] = useState<VideoColection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Không cần thay đổi numColumns, luôn giữ là 1
  const numColumns = 1;

  // Fetch video categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Function to load video categories
  const loadCategories = async (forceFresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = forceFresh 
        ? await videoServiceProxy.getVideoCategorysFresh() 
        : await videoServiceProxy.getVideoCategorys();
      
      setCategories(data);
    } catch (err) {
      setError('Không thể tải danh sách bài giảng. Xin thử lại sau.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle category selection
  const handleCategoryPress = (category: VideoColection) => {
    navigation.navigate('VideoList', { 
      categoryId: category.id,
      categoryName: category.name 
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories(true);
  };

  // Render item cho FlatList theo dạng card list
  const renderCategoryItem = ({ item, index }: { item: VideoColection; index: number }) => {
    const cardColor = CARD_COLORS[index % CARD_COLORS.length];
    
    return (
      <TouchableOpacity 
        style={styles.categoryItemList}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.cardList}>
          <View style={styles.cardContent}>
            <View style={[styles.categoryIconContainer, { backgroundColor: cardColor }]}>
              <Icon 
                name={index % 5 === 0 ? 'leaf-outline' : 
                      index % 5 === 1 ? 'flower-outline' :
                      index % 5 === 2 ? 'water-outline' :
                      index % 5 === 3 ? 'sunny-outline' : 'moon-outline'} 
                size={24} 
                color="white" 
              />
            </View>

            <View style={styles.textContainer}>
              <Title style={styles.categoryTitleList} numberOfLines={1} ellipsizeMode="tail">
                {item.name}
              </Title>
              {item.description ? (
                <Paragraph style={styles.categoryDescriptionList} numberOfLines={1} ellipsizeMode="tail">
                  {item.description}
                </Paragraph>
              ) : (
                <Paragraph style={styles.categoryDescriptionList}>Thư viện pháp âm</Paragraph>
              )}
            </View>

            <View style={styles.arrowContainer}>
              <Icon name="chevron-forward" size={20} color={ZEN_COLORS.primary} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Loading indicator
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color="white" />
          <Appbar.Content title="Thư Viện Pháp Âm" titleStyle={styles.appBarTitle} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ZEN_COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải bài giảng Pháp...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="white" />
        <Appbar.Content title="Thư Viện Pháp Âm" titleStyle={styles.appBarTitle} />
      </Appbar.Header>

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="leaf-outline" size={60} color={ZEN_COLORS.secondary} />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => loadCategories(true)}
            style={styles.retryButton}
            color={ZEN_COLORS.primary}
          >
            Thử lại
          </Button>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="flower-outline" size={60} color={ZEN_COLORS.secondary} />
          <Text style={styles.emptyText}>Chưa có bài giảng Pháp nào</Text>
          <Button 
            mode="contained" 
            onPress={() => loadCategories(true)}
            style={styles.retryButton}
            color={ZEN_COLORS.primary}
          >
            Thử lại
          </Button>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          numColumns={numColumns}
          key={`list-${numColumns}`}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEN_COLORS.background,
  },
  appBar: {
    backgroundColor: ZEN_COLORS.primary,
    elevation: 2,
  },
  appBarTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  // Styles cho card list
  categoryItemList: {
    marginBottom: 12,
    width: '100%',
    height: FIXED_CARD_HEIGHT,
  },
  cardList: {
    width: '100%',
    height: FIXED_CARD_HEIGHT,
    elevation: 2,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 12,
  },
  categoryTitleList: {
    fontSize: 15,
    fontWeight: 'bold',
    color: ZEN_COLORS.text,
    marginBottom: 2,
    lineHeight: 20,
  },
  categoryDescriptionList: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    margin: 0,
  },
  arrowContainer: {
    padding: 4,
  },
  // Styles cho loading và error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: ZEN_COLORS.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: ZEN_COLORS.text,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: ZEN_COLORS.text,
    textAlign: 'center',
  },
});

export default VideoCategoriesScreen;