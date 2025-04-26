/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { colors } from './src/theme/theme';
import { NavigationProvider, navigationRef, TabNavigator } from './src/navigation';
import { PlaybackProvider } from './src/context/PlaybackContext';
import { UIControlProvider, useScreenUIControl } from './src/context/UIControlContext';
import MiniPlayer from './src/components/MiniPlayer';

// Component để sử dụng navigation event hook
const NavigationStateHandler = () => {
  useScreenUIControl();
  return null;
};

const App = () => {
  return (
    <PaperProvider>
      <PlaybackProvider>
        <UIControlProvider>
          <NavigationProvider>
            <NavigationContainer ref={navigationRef}>
              <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
              <View style={styles.container}>
                <TabNavigator />
                <MiniPlayer />
                <NavigationStateHandler />
              </View>
            </NavigationContainer>
          </NavigationProvider>
        </UIControlProvider>
      </PlaybackProvider>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
