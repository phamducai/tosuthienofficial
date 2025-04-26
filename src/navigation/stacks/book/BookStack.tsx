import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BookStackParamList } from '../../../types/navigation';

// Import screens
import BookListScreen from '../../../screens/Book/BookListScreen';
import BookDetailScreen from '../../../screens/Book/BookDetailScreen';

const Stack = createStackNavigator<BookStackParamList>();

const BookStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="BookList"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="BookList" component={BookListScreen} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} />
    </Stack.Navigator>
  );
};

export default BookStack; 