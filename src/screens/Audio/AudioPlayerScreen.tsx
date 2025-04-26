import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  SafeAreaView,
  Animated,
  Easing,
  StatusBar,
  ImageBackground,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { AudioStackParamList } from '../../types/navigation';
import { colors } from '../../theme/theme';
import { usePlayback } from '../../context/PlaybackContext';
import Orientation from 'react-native-orientation-locker';

type AudioPlayerRouteProp = RouteProp<AudioStackParamList, 'AudioPlayer'>;
const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(width * 0.7, height * 0.4);

const DEFAULT_ARTWORK = require('../../assets/logo-tosuthien.png');

// Artwork rotation component for better separation of concerns
const RotatingArtwork = React.memo(({ 
  artwork, 
  isLocalImage, 
  isPlaying 
}: { 
  artwork: any, 
  isLocalImage: boolean, 
  isPlaying: boolean 
}) => {
  const spinValueRef = useRef(new Animated.Value(0));
  const spinValue = spinValueRef.current;
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  const spinAnimationRef = useRef<Animated.CompositeAnimation>();

  useEffect(() => {
    if (isPlaying) {
      if (spinAnimationRef.current) {
        spinAnimationRef.current.stop();
      }
      
      spinAnimationRef.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      
      spinAnimationRef.current.start();
    } else {
      spinValue.stopAnimation();
    }
    
    return () => {
      if (spinAnimationRef.current) {
        spinAnimationRef.current.stop();
      }
    };
  }, [isPlaying]);

  return (
    <View style={styles.artworkContainer}>
      <Animated.View style={[styles.rotatingContainer, { transform: [{ rotate: spin }] }]}>
        {isLocalImage ? (
          <ImageBackground 
            source={artwork}
            style={styles.artwork}
            imageStyle={styles.artworkImage}
            resizeMode="contain"
          >
            <View style={styles.artworkOverlay} />
          </ImageBackground>
        ) : (
          <Image 
            source={artwork}
            style={styles.artwork} 
            resizeMode="cover"
          />
        )}
      </Animated.View>
    </View>
  );
});

const AudioPlayerScreen = () => {
  const route = useRoute<AudioPlayerRouteProp>();
  const navigation = useNavigation();
  
  const { 
    isPlaying, 
    currentTrack, 
    duration, 
    position, 
    togglePlayback, 
    skipToNext, 
    skipToPrevious,
    seekTo,
    queuedTracks,
    currentTrackIndex,
    playTrack,
    isOfflineMode,
    setAudioPlayerActive,
    stopPlayback
  } = usePlayback();
  
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  
  // Khóa màn hình ở chế độ dọc khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      // Khóa hướng màn hình ở chế độ dọc (PORTRAIT)
      Orientation.lockToPortrait();
      
      // Khi rời khỏi màn hình, mở khóa hướng màn hình
      return () => {
        Orientation.unlockAllOrientations();
      };
    }, [])
  );
  
  // Initialize player on mount
  useEffect(() => {
    (async () => {
      const { trackId, categoryId, isPlaybackInitiated } = route.params;
      
      try {
        setIsLoadingTrack(true);
        setAudioPlayerActive(true);
        
        if (!isPlaybackInitiated && trackId && (!currentTrack || currentTrack.id !== trackId)) {
          await playTrack(categoryId || 'default', trackId);
        }
        setShowPlayer(true);
      } catch (error) {
        console.error('Lỗi khởi tạo phát nhạc:', error);
      } finally {
        setIsLoadingTrack(false);
      }
    })();
    
    return () => {
      setAudioPlayerActive(false);
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  // Handle stopping playback and returning to previous screen
  const handleStop = useCallback(() => {
    stopPlayback();
    navigation.goBack();
  }, [stopPlayback, navigation]);

  // Navigation handling
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Seek handling
  const handleSeek = useCallback((value: number) => {
    seekTo(value);
  }, [seekTo]);
  
  // Thêm hàm tua nhanh 15 giây
  const handleForward15 = useCallback(() => {
    const newPosition = Math.min(position + 15, duration);
    seekTo(newPosition);
  }, [position, duration, seekTo]);
  
  // Thêm hàm tua lùi 15 giây
  const handleRewind15 = useCallback(() => {
    const newPosition = Math.max(position - 15, 0);
    seekTo(newPosition);
  }, [position, seekTo]);
  
  const hasNextTrack = currentTrackIndex < queuedTracks.length - 1;
  const hasPreviousTrack = currentTrackIndex > 0;
  
  // Extract track information
  let displayTitle = 'Không xác định';
  let displayArtist = 'Tô Sư Thiền';
  let displayArtwork = DEFAULT_ARTWORK;
  let isLocalImage = true;
  
  if (currentTrack) {
    displayTitle = currentTrack.title || 'Không xác định';
    displayArtist = currentTrack.artist || 'Tô Sư Thiền';
    
    if (currentTrack.artwork) {
      try {
        const artworkUri = currentTrack.artwork.toString();
        if (artworkUri) {
          displayArtwork = { uri: artworkUri };
          isLocalImage = false;
        }
      } catch (error) {
        // Fallback to default artwork
      }
    }
  }

  // Loading state
  if (!showPlayer) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang khởi tạo bài hát...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Full player view
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
        >
          <Icon name="chevron-down" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.playingText}>
            ĐANG PHÁT {isOfflineMode ? ' (OFFLINE)' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="dots-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {isLoadingTrack ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải bài hát...</Text>
            </View>
          ) : (
            <RotatingArtwork 
              artwork={displayArtwork} 
              isLocalImage={isLocalImage} 
              isPlaying={isPlaying} 
            />
          )}
          
          {/* Track info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>{displayTitle}</Text>
            <Text style={styles.artistName} numberOfLines={1}>{displayArtist}</Text>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <Slider
              style={styles.progressBar}
              minimumValue={0}
              maximumValue={duration > 0 ? duration : 100}
              value={position}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor={colors.primary}
              onSlidingComplete={handleSeek}
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
          
          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={[
                styles.controlButton, 
                !hasPreviousTrack && styles.disabledButton
              ]} 
              onPress={skipToPrevious}
              disabled={!hasPreviousTrack}
            >
              <Icon name="skip-previous" size={35} color={hasPreviousTrack ? "#333" : "#ccc"} />
            </TouchableOpacity>
            
            {/* Thêm nút tua lùi 15 giây */}
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={handleRewind15}
              activeOpacity={0.7}
            >
              <Icon name="rewind" size={32} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
              <Icon name={isPlaying ? "pause" : "play"} size={45} color="#fff" />
            </TouchableOpacity>
            
            {/* Thêm nút tua nhanh 15 giây */}
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={handleForward15}
              activeOpacity={0.7}
            >
              <Icon name="fast-forward" size={32} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.controlButton, 
                !hasNextTrack && styles.disabledButton
              ]} 
              onPress={skipToNext}
              disabled={!hasNextTrack}
            >
              <Icon name="skip-next" size={35} color={hasNextTrack ? "#333" : "#ccc"} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.additionalControls}>
            <TouchableOpacity style={styles.additionalButton}>
              <Icon name="shuffle" size={24} color="#ccc" />
            </TouchableOpacity>
            
            {/* Nút dừng thay thế cho nút lặp lại */}
            <TouchableOpacity 
              style={styles.additionalButton}
              onPress={handleStop}
            >
              <Icon name="stop" size={30} color="#FF6B6B" />
            </TouchableOpacity>
            
            {/* Nút playlist */}
            <TouchableOpacity 
              style={[styles.additionalButton, queuedTracks.length > 1 && styles.activeAdditionalButton]}
              onPress={() => {
                if (queuedTracks.length > 1) {
                  Alert.alert(
                    'Danh sách phát',
                    `Đang phát ${currentTrackIndex + 1}/${queuedTracks.length} bài`,
                    [{ text: 'Đóng', style: 'default' }]
                  );
                }
              }}
            >
              <Icon 
                name="playlist-music" 
                size={24} 
                color={queuedTracks.length > 1 ? colors.primary : "#ccc"} 
              />
              {queuedTracks.length > 1 && (
                <View style={styles.queueCountBadge}>
                  <Text style={styles.queueCountText}>{queuedTracks.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  playingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    letterSpacing: 1,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  offlineText: {
    fontSize: 10,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Math.min(24, width * 0.05), 
    paddingTop: Math.min(20, height * 0.02), 
    paddingBottom: Math.min(30, height * 0.04), 
  },
  artworkContainer: {
    marginVertical: Math.min(30, height * 0.04), 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  rotatingContainer: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: ARTWORK_SIZE / 2,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: ARTWORK_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  artworkImage: {
    borderRadius: ARTWORK_SIZE / 2,
  },
  artworkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(75, 123, 172, 0.2)',  
    borderRadius: ARTWORK_SIZE / 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: ARTWORK_SIZE, 
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  trackInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Math.min(30, height * 0.03), 
  },
  trackTitle: {
    fontSize: Math.min(22, width * 0.055), 
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 10, 
  },
  artistName: {
    fontSize: Math.min(18, width * 0.045), 
    color: '#666',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: Math.min(30, height * 0.03), 
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
    width: '100%',
    marginBottom: Math.min(30, height * 0.03), 
    paddingHorizontal: Math.min(10, width * 0.02), 
  },
  controlButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  playButton: {
    width: Math.min(70, width * 0.18), 
    height: Math.min(70, width * 0.18), 
    borderRadius: Math.min(35, width * 0.09), 
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  additionalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around', 
    width: '90%', 
    marginBottom: 20,
  },
  additionalButton: {
    padding: 12,
  },
  activeAdditionalButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 20,
  },
  queueCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  queueCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default AudioPlayerScreen;