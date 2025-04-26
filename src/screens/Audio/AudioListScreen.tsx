import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ToastAndroid,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import audioServiceProxy from '../../proxy/audioServiceProxy';
import downloadService from '../../download/downloadService';
import { AudioCollectionDetail, AudioItem } from '../../dto/AudioDTO';
import { AudioStackParamList } from '../../types/navigation';
import { usePlayback } from '../../context/PlaybackContext';
import NetInfo from '@react-native-community/netinfo';
import AlertModal from '../../components/modals/AlertModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

type AudioListScreenNavigationProp = StackNavigationProp<AudioStackParamList, 'AudioList'>;
type AudioListScreenRouteProp = RouteProp<AudioStackParamList, 'AudioList'>;

// Định nghĩa kiểu cho state của modal
type AlertModalState = {
  visible: boolean;
  title: string;
  message: string;
  buttons?: { text: string; onPress: () => void; color?: string; mode?: 'text' | 'outlined' | 'contained' }[];
};

type ConfirmModalState = {
  visible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  dangerous?: boolean;
};

const AudioListScreen: React.FC = () => {
  const route = useRoute<AudioListScreenRouteProp>();
  const navigation = useNavigation<AudioListScreenNavigationProp>();
  const { categoryId, categoryName } = route.params;
  const { 
    playTrack, 
    isPlaying,
    currentTrack,
    togglePlayback,
  } = usePlayback();

  const [audioDetail, setAudioDetail] = useState<AudioCollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  
  // State cho các modal
  const [alertModal, setAlertModal] = useState<AlertModalState>({ visible: false, title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ visible: false, title: '', message: '' });

  // Fetch audio details
  const fetchAudioDetail = useCallback(async (fresh = false) => {
    try {
      setError(null);
      const data = fresh 
        ? await audioServiceProxy.getAudioByIdFresh(categoryId)
        : await audioServiceProxy.getAudioById(categoryId);
      
      if (data) {
        setAudioDetail(data);
      } else {
        setError('Không thể tải dữ liệu âm thanh');
      }
    } catch (err) {
      console.error('Error fetching audio detail:', err);
      setError('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId]);

  // Kiểm tra và xử lý trạng thái kết nối mạng
  useEffect(() => {
    // Sử dụng bộ đệm thời gian để tránh cập nhật liên tục do mạng không ổn định
    let networkTimer: NodeJS.Timeout | null = null;
    let wasOffline = false;
    
    const handleNetworkChange = (state: any) => {
      // Hủy timer cũ nếu có
      if (networkTimer) clearTimeout(networkTimer);
      
      // Đặt timer mới (300ms) để tránh các cập nhật nhanh, liên tục
      networkTimer = setTimeout(() => {
        const isConnected = !!state.isConnected;
        setIsOfflineMode(!isConnected);
        
        // Kiểm tra chuyển trạng thái từ offline sang online
        if (wasOffline && isConnected) {
          // Hiển thị thông báo đã kết nối lại
          setAlertModal({
            visible: true,
            title: 'Kết nối mạng đã được khôi phục',
            message: '',
            buttons: [{ text: 'Đã hiểu', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }]
          });
          // Tự động cập nhật dữ liệu khi quay lại online
          fetchAudioDetail(true);
        }
        
        // Cập nhật trạng thái cuối
        wasOffline = !isConnected;
      }, 300);
    };
    
    // Đăng ký theo dõi trạng thái mạng
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    
    // Kiểm tra trạng thái mạng ban đầu
    NetInfo.fetch().then(handleNetworkChange);
    
    return () => {
      if (networkTimer) clearTimeout(networkTimer);
      unsubscribe();
    };
  }, [fetchAudioDetail]);

  // Initial data load
  useEffect(() => {
    if (categoryName) {
      navigation.setOptions({ title: categoryName });
    }
    fetchAudioDetail();
  }, [categoryId, fetchAudioDetail, navigation, categoryName]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAudioDetail(true);
  }, [fetchAudioDetail]);

  // Show toast notification
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // Sử dụng AlertModal thay vì Alert
      setAlertModal({
        visible: true,
        title: 'Thông báo',
        message,
        buttons: [{ text: 'Đã hiểu', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }]
      });
    }
  };

  // Handle audio download with better error handling
  const handleDownload = useCallback(async (audioId: string, title: string) => {
    if (!audioId || downloading[audioId]) return;
    
    // Kiểm tra kết nối mạng trước khi tải
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setAlertModal({
        visible: true,
        title: 'Không có kết nối',
        message: 'Vui lòng kết nối internet để tải bài âm thanh này.',
        buttons: [{ text: 'Đã hiểu', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }]
      });
      return;
    }
    
    try {
      setDownloading(prev => ({ ...prev, [audioId]: true }));
      setDownloadProgress(prev => ({ ...prev, [audioId]: 0 }));
      
      // Hiển thị thông báo đang tải
      showToast(`Đang tải xuống "${title}"`); 
    
      await downloadService.downloadAudio(audioId, categoryId, title);
 
      // Hiển thị thông báo thành công
      showToast(`Đã tải xuống "${title}"`); 
      
      // Refresh audio list to update download status
      await fetchAudioDetail(true);
    } catch (err) {
      console.error('Error downloading audio:', err);
      setAlertModal({
        visible: true,
        title: 'Lỗi Tải Xuống',
        message: 'Không thể tải xuống bài âm thanh này. Vui lòng kiểm tra kết nối mạng và thử lại sau.',
        buttons: [{ text: 'Đã hiểu', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }]
      });
    } finally {
      setDownloading(prev => ({ ...prev, [audioId]: false }));
      setDownloadProgress(prev => ({ ...prev, [audioId]: 0 }));
    }
  }, [categoryId, downloading, fetchAudioDetail]);

  // Remove downloaded audio
  const handleRemoveDownload = useCallback(async (audioId: string, title: string) => {
    try {
      await downloadService.removeDownloadedAudio(audioId, categoryId);
      await fetchAudioDetail(true);
    } catch (err) {
      console.error('Error removing downloaded audio:', err);
      setAlertModal({
        visible: true,
        title: 'Lỗi',
        message: 'Không thể xóa bài âm thanh đã tải.',
        buttons: [{ text: 'Đã hiểu', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }]
      });
    }
  }, [categoryId, fetchAudioDetail]);

  // Phát âm thanh với các cải tiến UX
  const handlePlayAudio = useCallback(async (item: AudioItem) => {
    if (!item.audio || item.audio.length === 0) {
      setAlertModal({
        visible: true,
        title: 'Lỗi',
        message: 'Không tìm thấy file âm thanh',
        buttons: [{ text: 'Đã hiểu', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }]
      });
      return;
    }

    const audioId = item.audio[0];
    const isDownloaded = !!item.isDownloadable;
    
    // Kiểm tra xem có thể phát khi offline hay không
    if (isOfflineMode && !isDownloaded) {
      setAlertModal({
        visible: true,
        title: 'Không thể phát',
        message: 'Bạn đang ở chế độ ngoại tuyến. Chỉ có thể phát các bài đã tải xuống.',
        buttons: [{ text: 'Đã hiểu', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }]
      });
      return;
    }
    
    try {
      // Phát âm thanh qua PlaybackContext
      // Hiện thị thông báo chất lượng cho người dùng
      if (isOfflineMode && isDownloaded) {
        showToast('Đang phát bài hát từ bộ nhớ offline');
      }
      
      await playTrack(categoryId, audioId, audioDetail?.audios);
    } catch (error) {
      console.error('Error playing audio:', error);
      setAlertModal({
        visible: true,
        title: 'Lỗi phát nhạc',
        message: isOfflineMode ? 
          'Không thể phát file offline. File có thể đã bị hỏng.' : 
          'Không thể phát âm thanh này. Vui lòng kiểm tra kết nối mạng và thử lại.',
        buttons: [{ text: 'Đã hiểu', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }]
      });
    }
  }, [playTrack, categoryId, audioDetail?.audios, isOfflineMode]);

  // Confirm before removing download
  const confirmRemoveDownload = useCallback((audioId: string, title: string) => {
    setConfirmModal({
      visible: true,
      title: 'Xóa bài đã tải',
      message: `Bạn có chắc muốn xóa bài "${title}" đã tải xuống?`,
      onConfirm: () => { 
        setConfirmModal(prev => ({ ...prev, visible: false }));
        handleRemoveDownload(audioId, title); 
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, visible: false })),
      dangerous: true
    });
  }, [handleRemoveDownload]);

  // Kiểm tra xem một bài hát có thể phát được trong điều kiện hiện tại không
  const canPlayAudio = useCallback((isItemDownloaded: boolean): boolean => {
    // Nếu đang offline, chỉ phát được nếu bài hát đã tải xuống
    if (isOfflineMode) return isItemDownloaded;
    // Nếu online thì luôn phát được
    return true;
  }, [isOfflineMode]);

  // Render each audio item
  const renderItem = useCallback(({ item }: { item: AudioItem }) => {
    if (!item.audio || item.audio.length === 0) return null;
    
    const audioId = item.audio[0];
    const isDownloaded = !!item.isDownloadable; // Đảm bảo giá trị boolean
    const isDownloading = !!downloading[audioId];
    const progress = downloadProgress[audioId] || 0;
    
    // Kiểm tra bài đang phát
    const isCurrentlyPlaying = currentTrack && currentTrack.id === audioId;
    const canPlayThisAudio = canPlayAudio(isDownloaded);

    return (
      <TouchableOpacity 
        style={[
          styles.audioItem, 
          isDownloaded && styles.downloadedItem,
          isCurrentlyPlaying && styles.playingItem,
          isOfflineMode && !isDownloaded && styles.offlineDisabledItem
        ]}
        onPress={() => handleAudioItemPress(item, !!isCurrentlyPlaying, canPlayThisAudio)}
      >
        <View style={styles.audioInfo}>
          <Text style={styles.audioTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {isDownloaded && (
            <View style={styles.offlineBadge}>
              <Icon name="cloud-offline-outline" size={12} color="#1E88E5" />
              <Text style={styles.offlineBadgeText}>Có thể nghe offline</Text>
            </View>
          )}
          
          {isCurrentlyPlaying && (
            <View style={styles.playingBadge}>
              <Icon name="musical-notes" size={12} color="#FF6B6B" />
              <Text style={styles.playingBadgeText}>Đang phát</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.iconButton, styles.playButton, !canPlayThisAudio && styles.disabledButton]}
            onPress={() => {
              if (isCurrentlyPlaying) {
                togglePlayback(); 
              } else if (canPlayThisAudio) {
                handlePlayAudio(item); 
              }
            }}
            disabled={!canPlayThisAudio}
          >
            {isOfflineMode && !isDownloaded ? (
              <View style={styles.offlinePlayButtonContent}>
                <Icon name="cloud-offline" size={14} color="#FFFFFF" />
                <Icon name="play" size={14} color="#FFFFFF" style={styles.playIconOffline} />
              </View>
            ) : (
              <Icon 
                name={isCurrentlyPlaying && isPlaying ? "pause" : "play"} 
                size={22} 
                color="#FFFFFF" 
              />
            )}
          </TouchableOpacity>
          
          {isDownloading ? (
            <View style={styles.iconButton}>
              <ActivityIndicator size="small" color="#2089dc" />
              <View style={styles.downloadingOverlay}>
                <Text style={styles.downloadingText}>Đang tải</Text>
              </View>
            </View>
          ) : isDownloaded ? (
            <TouchableOpacity 
              style={[styles.iconButton, styles.downloadedButton]}
              onPress={() => confirmRemoveDownload(audioId, item.title)}
            >
              <Icon name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.iconButton, styles.downloadButton, isOfflineMode && styles.disabledButton]}
              onPress={() => !isOfflineMode && handleDownload(audioId, item.title)}
              disabled={isOfflineMode}
            >
              <Icon name="download-outline" size={20} color={isOfflineMode ? "#ccc" : "#2089dc"} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [confirmRemoveDownload, downloading, handleDownload, handlePlayAudio, currentTrack, isPlaying, togglePlayback]);

  // Xử lý mở AudioPlayer khi bấm vào một audio item
  const handleAudioItemPress = useCallback((item: AudioItem, isItemPlaying: boolean, canPlay: boolean) => {
    if (!canPlay) {
      // Nếu không thể phát, thông báo cho người dùng
      if (isOfflineMode) {
        setAlertModal({
          visible: true,
          title: 'Không thể phát',
          message: 'Bạn đang ở chế độ ngoại tuyến. Vui lòng tải xuống âm thanh này trước khi phát.',
          buttons: [{ text: 'Đã hiểu', onPress: () => setAlertModal(prev => ({ ...prev, visible: false })) }]
        });
      }
      return;
    }

    if (item.audio && item.audio.length > 0) {
      if (isItemPlaying && isPlaying) {
        togglePlayback();
      } else {
        handlePlayAudio(item);
      }
    }
  }, [isOfflineMode, isPlaying, togglePlayback, handlePlayAudio]);

  // Display loading, error or content
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2089dc" />
        <Text style={styles.loadingText}>Đang tải danh sách âm thanh...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Banner đã được chuyển vào FlatList.ListHeaderComponent */}
      
      {audioDetail && audioDetail.audios && audioDetail.audios.length > 0 ? (
        <FlatList
          data={audioDetail.audios}
          keyExtractor={(item, index) => item.audio?.[0] || `audio-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          maxToRenderPerBatch={10} // Tối ưu hiểu năng render
          windowSize={5} // Giảm lượng item được render cùng lúc
          initialNumToRender={12} // Số lượng item ban đầu
          removeClippedSubviews={true} // Tăng hiệu năng trên Android
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2089dc']}
            />
          }
          ListHeaderComponent={() => (
            <>
              {isOfflineMode && (
                <View style={styles.offlineContainer}>
                  <View style={styles.offlineBanner}>
                    <Icon name="cloud-offline-outline" size={18} color="#fff" />
                    <Text style={styles.offlineBannerText}>Bạn đang ở chế độ ngoại tuyến</Text>
                  </View>
                  {audioDetail?.audios?.filter(item => item.isDownloadable).length > 0 ? (
                    <Text style={styles.offlineStatusText}>
                      <Text style={styles.offlineCount}>{audioDetail?.audios?.filter(item => item.isDownloadable).length}</Text>
                      /{audioDetail?.audios?.length} bài hát có thể nghe khi không có mạng
                    </Text>
                  ) : (
                    <Text style={styles.offlineStatusText}>Bạn chưa tải bài hát nào để nghe offline</Text>
                  )}
                </View>
              )}
              <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>{audioDetail.name}</Text>
                  <Text style={styles.headerCount}>{audioDetail.audios.length} bài âm thanh</Text>
                </View>
              
                <View style={styles.headerActionContainer}>
                  {!isOfflineMode && audioDetail.audios.some(item => !item.isDownloadable) && (
                    <TouchableOpacity 
                      style={styles.downloadAllButton}
                      onPress={() => {
                        setConfirmModal({
                          visible: true,
                          title: 'Tải tất cả',
                          message: 'Bạn có muốn tải xuống tất cả bài âm thanh chưa tải trong danh mục này?',
                          onConfirm: async () => {
                            setConfirmModal(prev => ({ ...prev, visible: false }));
                            const notDownloadedItems = audioDetail.audios.filter(item => 
                              !item.isDownloadable && item.audio && item.audio.length > 0
                            );
                            
                            if (notDownloadedItems.length > 0) {
                              showToast(`Bắt đầu tải ${notDownloadedItems.length} bài âm thanh`);
                              
                              // Tải lần lượt các bài
                              for (let item of notDownloadedItems) {
                                if (item.audio && item.audio.length > 0) {
                                  const audioId = item.audio[0];
                                  try {
                                    setDownloading(prev => ({ ...prev, [audioId]: true }));
                                    await downloadService.downloadAudio(audioId, categoryId, item.title);
                                    setDownloading(prev => ({ ...prev, [audioId]: false }));
                                  } catch (err) {
                                    console.error(`Error downloading audio ${audioId}:`, err);
                                  }
                                }
                              }
                              await fetchAudioDetail(true);
                              showToast('Đã tải xuống tất cả bài âm thanh');
                            }
                          },
                          onCancel: () => setConfirmModal(prev => ({ ...prev, visible: false })),
                          dangerous: false
                        });
                      }}
                    >
                      <Icon name="download-outline" size={16} color="#1E88E5" />
                      <Text style={styles.downloadAllText}>Tải tất cả</Text>
                    </TouchableOpacity>
                  )}
                  
                  {audioDetail.audios.some(item => item.isDownloadable) && (
                    <TouchableOpacity 
                      style={styles.viewOfflineButton}
                      onPress={() => navigation.navigate('OfflineAudio')}
                    >
                      <Icon name="albums-outline" size={16} color="#1E88E5" />
                      <Text style={styles.viewOfflineText}>Xem đã tải</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="musical-notes-outline" size={60} color="#CCCCCC" />
          <Text style={styles.emptyText}>Không có bài âm thanh nào</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Làm mới</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Thêm các modal vào cuối component */}
      <ConfirmModal 
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm || (() => setConfirmModal(prev => ({ ...prev, visible: false })))}
        onCancel={confirmModal.onCancel || (() => setConfirmModal(prev => ({ ...prev, visible: false })))}
        dangerous={confirmModal.dangerous}
        onDismiss={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      />
      <AlertModal 
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        buttons={alertModal.buttons}
        onDismiss={() => setAlertModal(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  offlineContainer: {
    marginBottom: 10,
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
  offlineStatusText: {
    textAlign: 'center', 
    paddingVertical: 8,
    color: '#666',
    fontSize: 12,
  },
  offlineCount: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2089dc',
    borderRadius: 5,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 15,
  },
  header: {
    marginBottom: 20,
  },
  headerTitleContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  headerActionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  downloadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 10,
  },
  downloadAllText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  viewOfflineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  viewOfflineText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  audioItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  downloadedItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#1E88E5',
  },
  playingItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
    backgroundColor: '#FFF9F9',
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  offlineBadgeText: {
    fontSize: 12,
    color: '#1E88E5',
    marginLeft: 4,
  },
  playingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  playingBadgeText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  playButton: {
    backgroundColor: '#2089dc',
  },
  downloadButton: {
    backgroundColor: '#F0F0F0',
  },
  downloadedButton: {
    backgroundColor: '#FFF0F0',
  },
  disabledButton: {
    backgroundColor: '#EEEEEE',
    opacity: 0.6,
  },
  offlinePlayButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconOffline: {
    marginLeft: -5,
  },
  offlineDisabledItem: {
    opacity: 0.7,
    borderLeftWidth: 3,
    borderLeftColor: '#ccc',
  },
  downloadingOverlay: {
    position: 'absolute',
    bottom: -15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  downloadingText: {
    fontSize: 10,
    color: '#2089dc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default AudioListScreen;