import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../types/navigation';
import { HomeStack, AudioStack, BookStack, VideoStack, CenterStack } from './stacks';
import { colors } from '../theme/theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUIControl } from '../context/UIControlContext';

const Tab = createBottomTabNavigator<RootStackParamList>();

// Cấu hình icon cho tab bar
const TAB_ICONS = {
  Home: {
    active: 'home',
    inactive: 'home-outline',
  },
  AudioStack: {
    active: 'headset',
    inactive: 'headset-outline',
  },
  BookStack: {
    active: 'book',
    inactive: 'book-outline',
  },
  VideoStack: {
    active: 'videocam',
    inactive: 'videocam-outline',
  },
  CenterStack: {
    active: 'location',
    inactive: 'location-outline',
  },
} as const;

// Biểu tượng cho tab bar
const getTabBarIcon = (route: any, focused: boolean, color: string, size: number) => {
  const routeName = route.name as keyof typeof TAB_ICONS;
  const iconConfig = TAB_ICONS[routeName] || { active: 'help-circle', inactive: 'help-circle-outline' };
  const iconName = focused ? iconConfig.active : iconConfig.inactive;
  
  return <Icon name={iconName} size={size} color={color} />;
};

const TabNavigator = () => {
  const { showBottomTab } = useUIControl();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => 
          getTabBarIcon(route, focused, color, size),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          display: showBottomTab ? 'flex' : 'none',
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ 
          tabBarLabel: 'Trang Chủ',
        }}
      />
      <Tab.Screen
        name="AudioStack"
        component={AudioStack}
        options={{
          tabBarLabel: 'Âm Thanh',
        }}
      />
      <Tab.Screen
        name="BookStack"
        component={BookStack}
        options={{ 
          tabBarLabel: 'Kinh Sách',
        }}
      />
      <Tab.Screen
        name="VideoStack"
        component={VideoStack}
        options={{ 
          tabBarLabel: 'Video',
        }}
      />
      <Tab.Screen
        name="CenterStack"
        component={CenterStack}
        options={{ 
          tabBarLabel: 'Thiền Đường',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;