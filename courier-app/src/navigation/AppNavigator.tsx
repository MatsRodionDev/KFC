import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { RootStackParamList } from '../types';
import { ACHIEVEMENTS } from '../utils/achievements';

import LoginScreen        from '../screens/LoginScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import HistoryScreen      from '../screens/HistoryScreen';
import RegisterScreen     from '../screens/RegisterScreen';
import ChatScreen         from '../screens/ChatScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import AchievementToast   from '../components/AchievementToast';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const isAuthenticated    = useAppStore(s => s.isAuthenticated);
  const isSessionRestoring = useAppStore(s => s.isSessionRestoring);
  const restoreSession     = useAppStore(s => s.restoreSession);
  const pendingId          = useAppStore(s => s.pendingAchievement);
  const dismissAchievement = useAppStore(s => s.dismissAchievement);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (isSessionRestoring) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const pendingAchievement = pendingId
    ? (ACHIEVEMENTS.find(a => a.id === pendingId) ?? null)
    : null;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login"    component={LoginScreen}    options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard"    component={DashboardScreen}    options={{ title: 'Смена' }} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Заказ' }} />
            <Stack.Screen name="History"      component={HistoryScreen}      options={{ title: 'История заказов' }} />
            <Stack.Screen name="Chat"         component={ChatScreen}
              options={({ route }) => ({ title: `Чат — ${route.params.clientName}` })} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Достижения' }} />
          </>
        )}
      </Stack.Navigator>

      {/* Глобальный тост — поверх любого экрана */}
      <AchievementToast
        achievement={pendingAchievement}
        onDismiss={dismissAchievement}
      />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
});
