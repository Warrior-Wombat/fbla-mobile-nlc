import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { enableScreens } from 'react-native-screens';
import Login from '../components/Login/Login';
import Signup from '../components/Login/Signup';
import Catalogue from '../pages/Catalogue';
import ChatbotScreen from '../pages/Chatbot';
import PortfolioView from '../pages/PortfolioView';
import SplashScreen from '../pages/SplashPage';

enableScreens();
const Stack = createStackNavigator();

export default function RootNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Signup" 
          component={Signup} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Overview" 
          component={Catalogue} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Portfolio" 
          component={PortfolioView} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Chatbot" 
          component={ChatbotScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
