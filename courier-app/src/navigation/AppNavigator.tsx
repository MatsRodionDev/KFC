import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { RootStackParamList } from '../types';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator>
      {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Смена' }} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Заказ' }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'История заказов' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
