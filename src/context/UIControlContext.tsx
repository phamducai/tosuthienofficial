import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigation } from '@react-navigation/native';

const FULL_SCREEN_ROUTES = [
  'AudioPlayer',
  'BookDetail',
  'VideoPlayer',
];

type UIControlContextType = {
  showBottomTab: boolean;
  showMiniPlayer: boolean;
  setFullScreenMode: (isFullScreen: boolean) => void;
  toggleBottomTab: (show: boolean) => void;
  toggleMiniPlayer: (show: boolean) => void;
};

const UIControlContext = createContext<UIControlContextType>({
  showBottomTab: true,
  showMiniPlayer: true,
  setFullScreenMode: () => {},
  toggleBottomTab: () => {},
  toggleMiniPlayer: () => {},
});

export const useUIControl = () => useContext(UIControlContext);

type UIControlProviderProps = {
  children: ReactNode;
};

export const UIControlProvider: React.FC<UIControlProviderProps> = ({ children }) => {
  const [showBottomTab, setShowBottomTab] = useState(true);
  const [showMiniPlayer, setShowMiniPlayer] = useState(true);
  
  // Hàm tiện ích để thiết lập chế độ toàn màn hình (ẩn cả bottom tab và mini player)
  const setFullScreenMode = (isFullScreen: boolean) => {
    setShowBottomTab(!isFullScreen);
    setShowMiniPlayer(!isFullScreen);
  };
  
  const toggleBottomTab = (show: boolean) => {
    setShowBottomTab(show);
  };
  
  const toggleMiniPlayer = (show: boolean) => {
    setShowMiniPlayer(show);
  };
  
  return (
    <UIControlContext.Provider 
      value={{ 
        showBottomTab, 
        showMiniPlayer, 
        setFullScreenMode,
        toggleBottomTab,
        toggleMiniPlayer,
      }}
    >
      {children}
    </UIControlContext.Provider>
  );
};

// Hook để theo dõi route và tự động ẩn/hiện UI components
export const useScreenUIControl = () => {
  const navigation = useNavigation();
  const { setFullScreenMode } = useUIControl();

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e: any) => {
      try {
        const state = navigation.getState();
        const checkFullScreenRoute = (routes: any[]): boolean => {
          for (const route of routes) {
            if (FULL_SCREEN_ROUTES.includes(route.name)) {
              return true;
            }
            
            if (route.state && route.state.routes) {
              if (checkFullScreenRoute(route.state.routes)) {
                return true;
              }
            }
          }
          return false;
        };
        
        if (state && state.routes) {
          const isFullScreen = checkFullScreenRoute(state.routes);
          setFullScreenMode(isFullScreen);
        }
      } catch (error) {
        console.log('Error checking navigation state:', error);
      }
    });
    
    // Kiểm tra ban đầu
    try {
      const state = navigation.getState();
      if (state && state.routes) {
        const checkFullScreenRoute = (routes: any[]): boolean => {
          for (const route of routes) {
            if (FULL_SCREEN_ROUTES.includes(route.name)) return true;
            if (route.state && route.state.routes) {
              if (checkFullScreenRoute(route.state.routes)) return true;
            }
          }
          return false;
        };
        
        const isFullScreen = checkFullScreenRoute(state.routes);
        setFullScreenMode(isFullScreen);
      }
    } catch (error) {
      console.log('Error in initial route check:', error);
    }
    
    return unsubscribe;
  }, [navigation, setFullScreenMode]);
  
  return null;
};
