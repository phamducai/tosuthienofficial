import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { usePlayback } from '../../context/PlaybackContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import offlineAudioService from '../../download/offlineAudioService';
import downloadService from '../../download/downloadService';
import NetInfo from '@react-native-community/netinfo';

interface OfflineTrack {
  id: string;
  categoryId: string;
  title: string;
  path: string;
  lastPlayedAt?: number;
}

const OfflineAudioScreen = () => {
  const [offlineTracks, setOfflineTracks] = useState<OfflineTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const navigation = useNavigation();
  const { playTrack } = usePlayback();

  // Kiểm tra trạng thái mạng
  const checkNetworkStatus = async () => {
    const netInfo = await NetInfo.fetch();
    setIsOffline(!netInfo.isConnected);
  };

  // Tải dữ liệu nhạc đã tải xuống
  const loadOfflineTracks = async () => {
    try {
      setLoading(true);
      const tracks = await offlineAudioService.getAllOfflineTracks();
      
      // Sắp xếp theo thời gian phát gần nhất
      const sortedTracks = [...tracks].sort((a, b) => {
        const timeA = a.lastPlayedAt || 0;
        const timeB = b.lastPlayedAt || 0;
        return timeB - timeA;
      });
      
      setOfflineTracks(sortedTracks);
    } catch (error) {
      console.error('Error loading offline tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tải lại dữ liệu khi kéo refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOfflineTracks(), checkNetworkStatus()]);
    setRefreshing(false);
  };

  // Phát bài hát đã chọn
  const handlePlayTrack = async (track: OfflineTrack) => {
    try {
      // Cập nhật thời gian phát gần nhất
      await offlineAudioService.updateLastPlayedTime(track.id);
      
      // Chuyển đến màn hình phát nhạc
      playTrack(track.categoryId, track.id);
      
      // Tải lại danh sách sau khi phát
      loadOfflineTracks();
    } catch (error) {
      console.error('Error playing offline track:', error);
      Alert.alert('Lỗi', 'Không thể phát file âm thanh này');
    }
  };

  // Xóa bài hát đã tải
  const handleDeleteTrack = async (track: OfflineTrack) => {
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn xóa "${track.title}" khỏi thiết bị?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await downloadService.removeDownloadedAudio(track.id, track.categoryId);
              loadOfflineTracks();
            } catch (error) {
              console.error('Error deleting track:', error);
              Alert.alert('Lỗi', 'Không thể xóa file âm thanh này');
            }
          } 
        },
      ]
    );
  };

  // Tải dữ liệu khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      checkNetworkStatus();
      loadOfflineTracks();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Đang tải danh sách...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-off" size={18} color="#fff" />
          <Text style={styles.offlineBannerText}>
            Bạn đang ở chế độ ngoại tuyến
          </Text>
        </View>
      )}
      
      {offlineTracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="music-off" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            Chưa có âm thanh nào được tải xuống
          </Text>
          <Text style={styles.emptySubText}>
            Hãy tải âm thanh từ danh mục để nghe offline
          </Text>
        </View>
      ) : (
        <FlatList
          data={offlineTracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.trackItem}>
              <TouchableOpacity
                style={styles.trackInfo}
                onPress={() => handlePlayTrack(item)}
              >
                <Icon name="audiotrack" size={24} color="#1E88E5" />
                <View style={styles.trackTextContainer}>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {item.title || 'Không có tiêu đề'}
                  </Text>
                  <Text style={styles.trackSubtitle} numberOfLines={1}>
                    {new Date(item.lastPlayedAt || 0).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTrack(item)}
              >
                <Icon name="delete-outline" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1E88E5']}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  offlineBanner: {
    backgroundColor: '#FF9800',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  trackSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
});

export default OfflineAudioScreen;
