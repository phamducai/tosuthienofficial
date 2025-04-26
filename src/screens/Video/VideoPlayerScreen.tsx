import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { VideoStackParamList } from '../../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Title, IconButton, useTheme, Surface, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useUIControl } from '../../context/UIControlContext';
import Orientation from 'react-native-orientation-locker';

type VideoPlayerRouteProp = RouteProp<VideoStackParamList, 'VideoPlayer'>;
type VideoPlayerNavigationProp = StackNavigationProp<VideoStackParamList, 'VideoPlayer'>;

const { width: screenWidth } = Dimensions.get('window');

const VideoPlayerScreen = () => {
  const route = useRoute<VideoPlayerRouteProp>();
  const navigation = useNavigation<VideoPlayerNavigationProp>();
  const theme = useTheme();
  const { videoId, videoTitle, videoDescription = '' } = route.params;
  const { setFullScreenMode } = useUIControl();
  
  // State for video player
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Khóa hướng màn hình khi component mount
  useEffect(() => {
    // Khóa hướng màn hình ở chế độ dọc khi vào màn hình
    Orientation.lockToPortrait();
    
    // Cleanup khi component unmount
    return () => {
      // Mở khóa hướng màn hình khi rời khỏi màn hình
      Orientation.unlockAllOrientations();
      // Đảm bảo UI được khôi phục
      setFullScreenMode(false);
      StatusBar.setHidden(false);
    };
  }, [setFullScreenMode]);

  // Handle video state change
  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    } else if (state === 'playing') {
      setLoading(false);
    } else if (state === 'paused') {
      setPlaying(false);
    }
  }, []);

  // Error handler
  const onError = useCallback(() => {
    setVideoError(true);
    setLoading(false);
  }, []);

  // Handle fullscreen change
  const onFullScreenChange = useCallback((fullScreen: boolean) => {
    console.log('Fullscreen status changed:', fullScreen);
    setIsFullscreen(fullScreen);
    
    // Use the UIControlContext to hide bottom tab and mini player when in fullscreen
    setFullScreenMode(fullScreen);
    
    // Handle status bar visibility
    StatusBar.setHidden(fullScreen);
    
    // Xử lý hướng màn hình theo trạng thái fullscreen
    if (fullScreen) {
      // Cho phép xoay ngang khi ở chế độ fullscreen
      Orientation.unlockAllOrientations();
    } else {
      // Khóa lại ở chế độ dọc khi thoát fullscreen
      Orientation.lockToPortrait();
    }
  }, [setFullScreenMode]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={isFullscreen} />
      
      {/* Header (visible only when not in fullscreen) */}
      {!isFullscreen && (
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            iconColor={theme.colors.onSurface}
          />
          <Title numberOfLines={1} style={styles.headerTitle}>{videoTitle}</Title>
          <View style={{ width: 40 }} />
        </View>
      )}
      
      {/* YouTube Player Container */}
      <View style={styles.videoContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Đang tải video...</Text>
          </View>
        )}
        
        <YoutubePlayer
          height={screenWidth * 0.5625} // 16:9 aspect ratio
          width={screenWidth}
          play={playing}
          videoId={videoId}
          onChangeState={onStateChange}
          onError={onError}
          onFullScreenChange={onFullScreenChange}
          forceAndroidAutoplay={true}
          initialPlayerParams={{
            rel: false,
            showClosedCaptions: true,
            modestbranding: true,
          }}
        />
      </View>
      
      {/* Video error message */}
      {videoError && (
        <Surface style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>
            Không thể phát video này. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.
          </Text>
        </Surface>
      )}
      
      {/* Video info (visible only when not in fullscreen) */}
      {!isFullscreen && !videoError && (
        <ScrollView style={styles.contentContainer}>
          <Surface style={styles.videoInfoCard}>
            <Title style={styles.videoTitle}>{videoTitle}</Title>
            
            <Divider style={styles.divider} />
            
            {videoDescription ? (
              <Text style={styles.videoDescription}>{videoDescription}</Text>
            ) : (
              <Text style={styles.noDescription}>Không có mô tả.</Text>
            )}
          </Surface>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    textAlign: 'center',
  },
  videoContainer: {
    backgroundColor: '#000',
    width: '100%',
    position: 'relative',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#666',
  },
  contentContainer: {
    flex: 1,
  },
  videoInfoCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  videoTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  videoDescription: {
    fontSize: 14,
    color: '#555',
    marginVertical: 8,
    lineHeight: 20,
  },
  noDescription: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  relatedCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default VideoPlayerScreen;