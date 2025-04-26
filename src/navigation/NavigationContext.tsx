import React, { createContext, useContext, useCallback } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { ScreenType } from './types';

// Tạo tham chiếu navigation (sẽ được thiết lập trong NavigationContainer)
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

// Tạo NavigationContext
export const NavigationContext = createContext<{
  navigate: (screen: ScreenType) => void;
}>({
  navigate: () => {},
});

// Hook để sử dụng Navigation Context
export const useNavigation = () => useContext(NavigationContext);

// Provider component cho NavigationContext
export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hàm navigate giữa các tab
  const navigateToScreen = useCallback((screen: ScreenType) => {
    if (navigationRef.current) {
      switch (screen) {
        case 'Home':
          navigationRef.current.navigate('Home');
          break;
        case 'Audio':
          navigationRef.current.navigate('AudioStack');
          break;
        case 'Book':
          navigationRef.current.navigate('BookStack');
          break;
        case 'Video':
          navigationRef.current.navigate('VideoStack');
          break;
        case 'Center':
          navigationRef.current.navigate('CenterStack');
          break;
      }
    }
  }, []);

  return (
    <NavigationContext.Provider value={{ navigate: navigateToScreen }}>
      {children}
    </NavigationContext.Provider>
  );
}; 