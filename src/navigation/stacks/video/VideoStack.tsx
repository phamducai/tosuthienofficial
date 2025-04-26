import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { VideoStackParamList } from '../../../types/navigation';

// Import màn hình

import VideoCategoriesScreen from '../../../screens/Video/VideoCategoriesScreen';

import VideoPlayerScreen from '../../../screens/Video/VideoPlayerScreen';
import VideoListScreen from '../../../screens/Video/VideoListScreen';

const Stack = createStackNavigator<VideoStackParamList>();

const VideoStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="VideoCategories"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="VideoCategories" component={VideoCategoriesScreen} />
      <Stack.Screen name="VideoList" component={VideoListScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
    </Stack.Navigator>
  );
};

export default VideoStack; 