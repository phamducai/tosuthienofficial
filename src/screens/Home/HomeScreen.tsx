import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../types/navigation';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type HomeScreenNavigationProp = BottomTabNavigationProp<RootStackParamList>;

// Cấu hình điều hướng với rõ màn hình đầu của mỗi stack
interface StackRoute {
  stack: keyof RootStackParamList;
  initialScreen: string;
  params?: Record<string, any>;
}

// Chiều cao cố định cho các card
const CARD_HEIGHT = 100;

// Quick access descriptions with Zen/Buddhist-themed icons
const tabDescriptions = [
  {
    id: 'audio-desc',
    title: 'Pháp Âm',
    description: 'Nghe bài giảng và diệu pháp âm',
    icon: 'musical-notes',  // Changed to musical notes for audio content
    color: '#FF9500',
    route: {
      stack: 'AudioStack',
      initialScreen: 'AudioCategories'
    } as StackRoute,
  },
  {
    id: 'book-desc',
    title: 'Kinh Sách',
    description: 'Kinh Sách Hòa Thượng Thiền Sư Thích Duy Lực',
    icon: 'book-outline',  // Changed to book-outline for more Zen-like simplicity
    color: '#007AFF',
    route: {
      stack: 'BookStack',
      initialScreen: 'BookHome'
    } as StackRoute,
  },
  {
    id: 'video-desc',
    title: 'Video',
    description: 'Bài giảng Video',
    icon: 'film-outline',  // Changed to film-outline for a more traditional look
    color: '#FF2D55',
    route: {
      stack: 'VideoStack',
      initialScreen: 'VideoHome'
    } as StackRoute,
  },
  {
    id: 'center-desc',
    title: 'Thiền đường',
    description: 'Danh Sách Thiền Đường',
    icon: 'flower-outline',  // Changed to flower (lotus) which is a Buddhist symbol
    color: '#34C759',
    route: {
      stack: 'CenterStack',
      initialScreen: 'CenterMain'
    } as StackRoute,
  },
];

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Điều hướng đến stack và chỉ định màn hình đầu tiên
  const navigateToScreen = (route: StackRoute) => {
    // Sử dụng navigate thông thường để giữ cache cho tăng hiệu suất
    (navigation.navigate as any)(route.stack, { 
      screen: route.initialScreen,
      params: route.params,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Image 
            source={require('../../assets/logo-tosuthien.png')} 
            style={styles.zenCircleIcon} 
          />
          <Text style={styles.headerTitle}>Thiền Tổ Sư</Text>
        </View>

        {/* Features Access */}
        <View style={styles.featuresSection}>
          <View style={styles.featuresList}>
            {tabDescriptions.map((feature) => (
              <TouchableOpacity 
                key={feature.id} 
                onPress={() => navigateToScreen(feature.route)}
                activeOpacity={0.7}
                style={styles.featureCardContainer}
              >
                <Card style={styles.featureCard}>
                  <View style={styles.featureCardContent}>
                    <View style={[styles.featureIconContainer, { backgroundColor: feature.color }]}>
                      <Icon name={feature.icon} size={28} color="#FFF" />
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Title style={styles.featureTitle} numberOfLines={1} ellipsizeMode="tail">
                        {feature.title}
                      </Title>
                      <Paragraph style={styles.featureDescription} numberOfLines={2} ellipsizeMode="tail">
                        {feature.description}
                      </Paragraph>
                    </View>
                    <Icon name="chevron-forward" size={22} color="#999" />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  zenCircleIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3F51B5',
  },
  featuresSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  featuresList: {
    gap: 12,
  },
  featureCardContainer: {
    height: CARD_HEIGHT,
    marginBottom: 12,
  },
  featureCard: {
    borderRadius: 12,
    elevation: 2,
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  featureCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    height: '100%',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 22,
  },
  featureDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
    margin: 0,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default HomeScreen;