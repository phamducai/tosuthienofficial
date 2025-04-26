import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/theme';
import { usePlayback } from '../context/PlaybackContext';
import { useUIControl } from '../context/UIControlContext';

const DEFAULT_ARTWORK = require('../assets/logo-tosuthien.png');

const MiniPlayer: React.FC = () => {
  const navigation = useNavigation<any>();
  const { 
    isPlaying, 
    currentTrack, 
    position, 
    duration, 
    togglePlayback, 
    skipToNext, 
    skipToPrevious,
    showMiniPlayer: playbackShowMiniPlayer,
    stopPlayback, 
    setupBackgroundMode, 
  } = usePlayback();
  
  const { showMiniPlayer: uiShowMiniPlayer, toggleMiniPlayer } = useUIControl();

  // Sử dụng useRef để tránh tạo lại spinValue khi component re-render
  const spinValue = useRef(new Animated.Value(0)).current;
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Hiệu ứng quay cho artwork
  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation;
    
    if (isPlaying) {
      spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else {
      spinValue.stopAnimation();
    }
    
    return () => {
      if (spinAnimation) {
        spinAnimation.stop();
      }
    };
  }, [isPlaying, spinValue]);

  // Setup background mode - chỉ chạy một lần
  useEffect(() => {
    setupBackgroundMode();
    const subscription = AppState.addEventListener('change', nextAppState => {
      // Chỉ giữ lại cấu trúc cơ bản, loại bỏ xử lý trống
      if (nextAppState === 'background' || nextAppState === 'active') {
        // Để trống để giữ lại cấu trúc cho việc mở rộng sau này
      }
    });
    return () => {
      subscription.remove();
    };
  }, [setupBackgroundMode]);

  const handleOpenPlayer = () => {
    if (currentTrack) {
      navigation.navigate('AudioPlayer', {
        trackId: currentTrack.id,
        trackTitle: currentTrack.title,
        trackUrl: currentTrack.url,
        trackArtist: currentTrack.artist,
        trackArtwork: currentTrack.artwork,
        isPlaybackInitiated: true,
      });
    }
  };

  const handleClose = (e: any) => {
    if (e) e.stopPropagation();
    toggleMiniPlayer(false);
    stopPlayback();
  };

  if (!currentTrack || !playbackShowMiniPlayer || !uiShowMiniPlayer) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.95}
      onPress={handleOpenPlayer}
    >
      {/* Progress bar on top */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
          ]} 
        />
      </View>

      <View style={styles.content}>
        {/* Album artwork with rotation animation */}
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          {currentTrack.artwork ? (
            <Image 
              source={{uri: currentTrack.artwork.toString()}}
              style={styles.artwork}
              resizeMode="cover" 
            />
          ) : (
            <Image 
              source={DEFAULT_ARTWORK}
              style={styles.artwork}
              resizeMode="contain" 
            />
          )}
        </Animated.View>

        {/* Track info */}
        <View style={styles.trackInfo}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={(e) => {
              e.stopPropagation();
              skipToPrevious();
            }}
          >
            <Icon name="skip-previous" size={28} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={(e) => {
              e.stopPropagation();
              togglePlayback();
            }}
          >
            <Icon 
              name={isPlaying ? 'pause' : 'play'} 
              size={32} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={(e) => {
              e.stopPropagation();
              skipToNext();
            }}
          >
            <Icon name="skip-next" size={28} color={colors.primary} />
          </TouchableOpacity>

          {/* Nút tắt */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
          >
            <Icon name="close" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 999,
  },
  progressBarContainer: {
    width: '100%',
    height: 2,
    backgroundColor: colors.gray,
  },
  progressBar: {
    height: 2,
    backgroundColor: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: colors.textLight,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
    marginLeft: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MiniPlayer;
