import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AudioStackParamList } from '../../../types/navigation';
import { useTheme } from 'react-native-paper';

// Import màn hình
import AudioCategoriesScreen from '../../../screens/Audio/AudioCategoriesScreen';
import AudioListScreen from '../../../screens/Audio/AudioListScreen';
import AudioPlayerScreen from '../../../screens/Audio/AudioPlayerScreen';
import OfflineAudioScreen from '../../../screens/Audio/OfflineAudioScreen';

const Stack = createStackNavigator<AudioStackParamList>();

const AudioStack = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      initialRouteName="AudioCategories"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
        headerStyle: {
          backgroundColor: theme.colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="AudioCategories" component={AudioCategoriesScreen} />
      <Stack.Screen name="AudioList" component={AudioListScreen} />
      <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} />
      <Stack.Screen 
        name="OfflineAudio" 
        component={OfflineAudioScreen} 
        options={{
          headerShown: true,
          title: "Pháp Âm đã tải xuống",
          headerTintColor: '#fff'
        }}
      />
    </Stack.Navigator>
  );
};

export default AudioStack;