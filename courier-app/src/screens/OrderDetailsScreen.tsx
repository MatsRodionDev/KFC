import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform, Image , Modal, ScrollView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../store/useAppStore';


import { RootStackParamList, Order } from '../types';

type Props = {
  route: RouteProp<RootStackParamList, 'OrderDetails'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrderDetails'>;
};

const STATUS_FLOW = {
  new: { label: 'Принять заказ', next: 'arrived_a' },
  arrived_a: { label: 'Прибыл на точку А', next: 'picked_up' },
  picked_up: { label: 'Забрал посылку', next: 'arrived_b' },
  arrived_b: { label: 'Сделать фотоотчет', next: null }, // <--- Поменяли лейбл, убрали прямой переход
  delivered: { label: 'Заказ завершен', next: null },
} as const;

export default function OrderDetailsScreen({ route, navigation }: Props) {
  const { order } = route.params;
  const updateOrderStatus = useAppStore(state => state.updateOrderStatus);
  
  const [status, setStatus] = useState<Order['status']>(order.status);
  
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Новое состояние для хранения URI фото
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);

  const isGoingToPickup = status === 'new' || status === 'accepted' || status === 'arrived_a';
  const currentTargetCoords = isGoingToPickup ? order.pickupCoords : order.destinationCoords;

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    (async () => {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        Alert.alert('Ошибка', 'Нет доступа к геопозиции.');
        setIsLoadingMap(false);
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (newLocation) => {
          setLocation(newLocation.coords);
          setIsLoadingMap(false);
        }
      );
    })();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  // === ЛОГИКА КАМЕРЫ И ИЗМЕНЕНИЯ СТАТУСА ===
  
  const takePhotoAndComplete = async () => {
    // 1. Запрашиваем разрешение на камеру
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraStatus !== 'granted') {
      Alert.alert('Ошибка', 'Для фотоотчета нужен доступ к камере.');
      return;
    }

    // 2. Запускаем камеру
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, // Позволить обрезать фото
      aspect: [4, 3],      // Соотношение сторон
      quality: 0.5,        // Сжать фото (чтобы быстрее грузилось в будущем на сервер)
    });

    if (!result.canceled) {
      // Сохраняем фото в локальное состояние
      setDeliveryPhoto(result.assets[0].uri);
      // Меняем статус на промежуточный, чтобы Реакт перерисовал кнопку
      setStatus('delivered');
    }
  };

  const handleFinalCompletion = () => {
    // ЗАПИСЫВАЕМ СТАТУС В ГЛОБАЛЬНЫЙ СТОР!
    updateOrderStatus(order.id, 'delivered');
    
    Alert.alert(
      'Успешно', 
      'Заказ завершен. Фото прикреплено.', 
      [{ text: 'ОК', onPress: () => navigation.goBack() }]
    );
  };

  const handleAction = () => {
    // Если мы на точке Б и фото еще нет
    if (status === 'arrived_b') {
      takePhotoAndComplete();
      return;
    }

    // Если фото уже сделано и статус 'delivered'
    if (status === 'delivered') {
      handleFinalCompletion();
      return;
    }

    const nextStatus = STATUS_FLOW[status].next;
    if (nextStatus) {
      setStatus(nextStatus as Order['status']);
      // Также можно сохранять промежуточные статусы в стор
      updateOrderStatus(order.id, nextStatus as Order['status']);
    }
  };

  // Динамически определяем текст кнопки
  const getActionButtonLabel = () => {
    if (status === 'delivered' && deliveryPhoto) {
      return 'Подтвердить и завершить заказ';
    }
    return STATUS_FLOW[status].label;
  };

  // Звонок клиенту
  const callClient = () => { Linking.openURL(`tel:${order.clientPhone}`); };

  // Открытие внешнего навигатора
  const openNavigator = () => {
    const lat = currentTargetCoords.latitude;
    const lng = currentTargetCoords.longitude;
    const label = isGoingToPickup ? "Точка забора (А)" : "Точка доставки (Б)";
    const url = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Визуальный блок вверху: либо карта, либо сделанное фото */}
      <View style={styles.mapContainer}>
        {deliveryPhoto ? (
          // Показывать фото, если оно сделано
          <Image source={{ uri: deliveryPhoto }} style={styles.map} resizeMode="cover" />
        ) : isLoadingMap ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : location ? (
          <MapView
            style={styles.map}
            initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            showsUserLocation={true}
          >
            <Marker coordinate={order.pickupCoords} title="Точка А" pinColor={isGoingToPickup ? "green" : "gray"} />
            <Marker coordinate={order.destinationCoords} title="Точка Б" pinColor={!isGoingToPickup ? "red" : "gray"} />
            <Polyline coordinates={[ { latitude: location.latitude, longitude: location.longitude }, currentTargetCoords ]} strokeColor={isGoingToPickup ? "#28a745" : "#dc3545"} strokeWidth={4} lineDashPattern={[5, 5]} />
          </MapView>
        ) : (
          <Text style={styles.errorText}>Не удалось загрузить карту</Text>
        )}
      </View>

      <View style={styles.detailsContainer}>
        {/* Подсказка, если фото уже сделано */}
        {status === 'delivered' && deliveryPhoto && (
          <View style={styles.photoSuccessBadge}>
            <Text style={styles.photoSuccessText}>✅ Фотоотчет прикреплен</Text>
          </View>
        )}

        {!deliveryPhoto && (
            <View style={styles.targetIndicator}>
                <Text style={styles.targetIndicatorText}>
                    Цель: {isGoingToPickup ? 'На точку забора (А)' : 'К клиенту (Б)'}
                </Text>
            </View>
        )}

        <Text style={styles.clientName}>{order.clientName}</Text>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionButton} onPress={callClient}>
            <Text style={styles.quickActionText}>📞 Позвонить</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, styles.navButton]} onPress={openNavigator}>
            <Text style={[styles.quickActionText, {color: '#fff'}]}>🧭 В навигатор</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.itemsButton} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.itemsButtonText}>📦 Посмотреть состав заказа</Text>
        </TouchableOpacity>

        <View style={[styles.addressBlock, isGoingToPickup && styles.activeAddress]}>
          <Text style={styles.label}>Забрать (А):</Text>
          <Text style={styles.address}>{order.addressA}</Text>
        </View>

        <View style={[styles.addressBlock, !isGoingToPickup && styles.activeAddress]}>
          <Text style={styles.label}>Доставить (Б):</Text>
          <Text style={styles.address}>{order.addressB}</Text>
        </View>
        
        <Text style={styles.price}>К оплате: {order.price} ₽</Text>
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={handleAction}>
        <Text style={styles.actionButtonText}>{getActionButtonLabel()}</Text>
      </TouchableOpacity>
      
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true} // Делает фон за окном прозрачным
        onRequestClose={() => setIsModalVisible(false)} // Обработка кнопки "Назад" на Android
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Состав заказа</Text>
            
            <ScrollView style={styles.modalList}>
              {order.items?.map((item, index) => (
                <View key={item.id} style={styles.modalItemRow}>
                  <Text style={styles.modalItemName}>{index + 1}. {item.name}</Text>
                  <Text style={styles.modalItemQty}>x{item.quantity}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { height: '35%', backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  map: { width: '100%', height: '100%' },
  errorText: { color: '#888', fontSize: 16 },
  detailsContainer: { padding: 15, flex: 1 },
  targetIndicator: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  targetIndicatorText: { fontSize: 14, fontWeight: '600', color: '#333' },
  clientName: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  quickActionButton: { flex: 1, backgroundColor: '#e8e8e8', padding: 12, borderRadius: 10, alignItems: 'center', marginRight: 10 },
  navButton: { backgroundColor: '#007AFF', marginRight: 0 },
  quickActionText: { fontSize: 16, fontWeight: '600', color: '#333' },
  addressBlock: { marginBottom: 10, padding: 5, borderRadius: 5 },
  activeAddress: { backgroundColor: '#e8f0fe', borderWidth: 1, borderColor: '#d2e3fc' },
  label: { fontSize: 13, color: '#666', marginBottom: 2 },
  address: { fontSize: 16 },
  price: { fontSize: 22, fontWeight: 'bold', color: '#28a745', marginTop: 5 },
  actionButton: { backgroundColor: '#FF9500', padding: 18, margin: 15, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontSize: 19, fontWeight: 'bold' },
  // Новые стили для бэджа успешного фото
  photoSuccessBadge: { backgroundColor: '#28a745', padding: 10, borderRadius: 8, marginBottom: 15, alignItems: 'center' },
  photoSuccessText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // Стили для кнопки состава заказа
  itemsButton: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  itemsButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },

  // Стили для модального окна
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalList: { marginBottom: 20 },
  modalItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemName: { fontSize: 16, flex: 1, paddingRight: 10 },
  modalItemQty: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  modalCloseBtn: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center' },
  modalCloseBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
