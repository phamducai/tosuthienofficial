import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
import { VideoDTO, VideoColectionDetail } from '../../dto/VideoDTO';
import videoServiceProxy from '../../proxy/videoServiceProxy';

type VideoListNavigationProp = StackNavigationProp<VideoStackParamList, 'VideoList'>;
type VideoListRouteProp = RouteProp<VideoStackParamList, 'VideoList'>;

const { width } = Dimensions.get('window');

const VideoListScreen = () => {
  const navigation = useNavigation<VideoListNavigationProp>();
  const route = useRoute<VideoListRouteProp>();
  const { categoryId, categoryName } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState('');
  const [videoDetail, setVideoDetail] = useState<VideoColectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryId) {
      loadVideoDetails(categoryId);
    }
    if (categoryName) {
      navigation.setOptions({ title: categoryName });
    }
  }, [categoryId, categoryName, navigation]);

  const loadVideoDetails = async (id: string, forceFresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const details = await videoServiceProxy.getVideoCategoryById(id);
      if (details) {
        setVideoDetail(details);
      } else {
        setError('Không thể tải thông tin video. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error fetching video details:', err);
      setError('Đã xảy ra lỗi khi tải dữ liệu video.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    if (categoryId) {
      setRefreshing(true);
      loadVideoDetails(categoryId, true);
    }
  };

  // Handle search query change
  const onChangeSearch = (query: string) => setSearchQuery(query);

  // Filter videos based on search query
  const filteredVideos = videoDetail?.videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Generate YouTube thumbnail URL from video ID
  const getYouTubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  // Open YouTube video
  const openYouTubeVideo = (videoId: string, title: string, description?: string) => {
    // Instead of linking to YouTube, navigate to our VideoPlayer screen
    navigation.navigate('VideoPlayer', { 
      videoId: videoId,
      videoTitle: title,
      videoDescription: description || ''
    });
  };

  // Render a video item
  const renderVideoItem = ({ item }: { item: VideoDTO }) => (
    <TouchableOpacity 
      style={styles.videoItem}
      onPress={() => openYouTubeVideo(item.videoId, item.title, item.description)}
      activeOpacity={0.7}
    >
      <Card style={styles.videoCard}>
        <View style={styles.videoCardContent}>
          <View style={styles.thumbnailContainer}>
            <Image 
              source={{ uri: getYouTubeThumbnail(item.videoId) }} 
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.playButtonOverlay}>
              <Icon name="play-circle" size={40} color="white" />
            </View>
          </View>
          
          {/* Video information */}
          <View style={styles.videoInfo}>
            <Title style={styles.videoTitle} numberOfLines={2}>{item.title}</Title>
            {item.description && (
              <Paragraph style={styles.videoDescription} numberOfLines={2}>
                {item.description}
              </Paragraph>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Đang tải danh sách video...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content 
          title={categoryName || "Danh Sách Video"} 
          titleStyle={styles.appBarTitle} 
        />
      </Appbar.Header>
      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => categoryId && loadVideoDetails(categoryId, true)}
            style={styles.retryButton}
          >
            Thử lại
          </Button>
        </View>
      ) : filteredVideos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="videocam-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>
            {searchQuery ? `Không tìm thấy video cho "${searchQuery}"` : "Không có video nào trong danh mục này"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVideos}
          keyExtractor={item => item.videoId}
          renderItem={renderVideoItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  appBar: {
    backgroundColor: '#1976D2',
    elevation: 4,
  },
  appBarTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1976D2',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: '80%',
  },
  clearSearchButton: {
    marginTop: 16,
    borderColor: '#1976D2',
  },
  listContent: {
    padding: 16,
  },
  videoItem: {
    marginBottom: 16,
  },
  videoCard: {
    width: '100%',
    elevation: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 120,
    height: 90,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  videoInfo: {
    flex: 1,
    padding: 12,
  },
  videoTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

export default VideoListScreen;
