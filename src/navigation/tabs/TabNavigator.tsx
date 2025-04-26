import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../../types/navigation';
import { 
  HomeStack, 
  AudioStack, 
  BookStack, 
  VideoStack, 
  CenterStack 
} from '../stacks';
import { colors } from '../../theme/theme';

const Tab = createBottomTabNavigator<RootStackParamList>();

// Biểu tượng cho tab bar
const getTabBarIcon = (route: any, focused: boolean, color: string, size: number) => {
  let iconName = '';
  
  switch (route.name) {
    case 'Home':
      iconName = '🏠';
      break;
    case 'AudioStack':
      iconName = '🎧';
      break;
    case 'BookStack':
      iconName = '📚';
      break;
    case 'VideoStack':
      iconName = '🎥';
      break;
    case 'CenterStack':
      iconName = '📍';
      break;
    default:
      iconName = '❓';
  }
  
  return <Text style={{ fontSize: focused ? size + 2 : size, color }}>{iconName}</Text>;
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => 
          getTabBarIcon(route, focused, color, size),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Trang Chủ' }}
      />
      <Tab.Screen
        name="AudioStack"
        component={AudioStack}
        options={{ tabBarLabel: 'Âm Thanh' }}
      />
      <Tab.Screen
        name="BookStack"
        component={BookStack}
        options={{ tabBarLabel: 'Kinh Sách' }}
      />
      <Tab.Screen
        name="VideoStack"
        component={VideoStack}
        options={{ tabBarLabel: 'Video' }}
      />
      <Tab.Screen
        name="CenterStack"
        component={CenterStack}
        options={{ tabBarLabel: 'Thiền Đường' }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator; 