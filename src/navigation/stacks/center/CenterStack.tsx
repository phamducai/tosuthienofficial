import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CenterStackParamList } from '../../../types/navigation';

// Import màn hình
import CenterListScreen from '../../../screens/Center/CenterListScreen';

const Stack = createStackNavigator<CenterStackParamList>();

const CenterStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="CenterList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CenterList" component={CenterListScreen} />
    </Stack.Navigator>
  );
};

export default CenterStack; 