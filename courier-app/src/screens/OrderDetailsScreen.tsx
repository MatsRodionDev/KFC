import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  Linking, Platform, Image, Modal, ScrollView, useWindowDimensions,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { RootStackParamList, Order } from '../types';
import { verifyDeliveryPhoto } from '../api/cvApi';
import { confirmPickup, parseQrPayload, confirmDelivery } from '../api/orderApi';

type Props = {
  route: RouteProp<RootStackParamList, 'OrderDetails'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'OrderDetails'>;
};

const STATUS_FLOW = {
  new:       { label: 'Принять заказ',        next: 'arrived_a' },
  arrived_a: { label: 'Сканировать QR-код',    next: 'picked_up' },
  picked_up: { label: 'Выехал к клиенту',      next: 'arrived_b' },
  arrived_b: { label: 'Сделать фотоотчёт',     next: null },
  delivered: { label: 'Заказ завершён',         next: null },
} as const;

type CvState  = 'idle' | 'verifying' | 'success' | 'failed';
type QrState  = 'idle' | 'scanning'  | 'verifying' | 'success' | 'failed';

export default function OrderDetailsScreen({ route, navigation }: Props) {
  const { order } = route.params;
  const [status, setStatus] = useState<Order['status']>(order.status);

  // Map / location
  const [location, setLocation]       = useState<Location.LocationObjectCoords | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);

  // CV delivery photo
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [cvState, setCvState]             = useState<CvState>('idle');
  const [cvMessage, setCvMessage]         = useState('');

  // Items modal
  const [isModalVisible, setIsModalVisible] = useState(false);

  // QR scanner
  const [qrVisible, setQrVisible]   = useState(false);
  const [qrState, setQrState]       = useState<QrState>('idle');
  const [qrMessage, setQrMessage]   = useState('');
  const qrScannedRef = useRef(false); // предотвращаем двойное срабатывание

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const { width, height }  = useWindowDimensions();
  const isLandscape        = width > height;
  const isGoingToPickup    = status === 'new' || status === 'accepted' || status === 'arrived_a';
  const currentTargetCoords = isGoingToPickup ? order.pickupCoords : order.destinationCoords;

  // ── Геолокация ────────────────────────────────────────────────────────────
  useEffect(() => {
    let sub: Location.LocationSubscription;
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert('Ошибка', 'Нет доступа к геопозиции.');
        setIsLoadingMap(false);
        return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        loc => { setLocation(loc.coords); setIsLoadingMap(false); },
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  // ── QR-сканер ─────────────────────────────────────────────────────────────
  const openQrScanner = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Нет доступа', 'Для сканирования QR-кода нужен доступ к камере.');
        return;
      }
    }
    qrScannedRef.current = false;
    setQrState('scanning');
    setQrMessage('Наведите камеру на QR-код на упаковке');
    setQrVisible(true);
  };

  const handleQrScanned = async ({ data }: { data: string }) => {
    // Предотвращаем повторный вызов пока идёт обработка
    if (qrScannedRef.current) return;
    qrScannedRef.current = true;

    setQrState('verifying');
    setQrMessage('Проверяем QR-код…');

    // Парсим payload формата "delivery-pickup:{orderId}:{token}"
    const token = parseQrPayload(data, order.id);

    if (!token) {
      setQrState('failed');
      setQrMessage('Неверный QR-код. Убедитесь, что сканируете код этого заказа.');
      return;
    }

    // Отправляем токен на сервер
    const result = await confirmPickup(order.id, token);

    if (result.success) {
      setQrState('success');
      setQrMessage(result.message);
      // Даём секунду увидеть успех, затем закрываем
      setTimeout(() => {
        setQrVisible(false);
        setStatus('picked_up');
      }, 1200);
    } else {
      setQrState('failed');
      setQrMessage(result.message);
    }
  };

  const retryQrScan = () => {
    qrScannedRef.current = false;
    setQrState('scanning');
    setQrMessage('Наведите камеру на QR-код на упаковке');
  };

  // ── CV-фото доставки ──────────────────────────────────────────────────────
  const takePhotoAndComplete = async () => {
    const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Ошибка', 'Для фотоотчёта нужен доступ к камере.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [4, 3], quality: 0.6,
    });
    if (result.canceled) return;

    const photoUri = result.assets[0].uri;
    setDeliveryPhoto(photoUri);
    setCvState('verifying');
    setCvMessage('Проверяем фото доставки…');

    try {
      const cv = await verifyDeliveryPhoto(photoUri);
      if (cv.verified) {
        setCvState('success');
        setCvMessage(cv.message);
        setStatus('delivered');
        // Уведомляем сервер: Shipped → Delivered
        confirmDelivery(order.id).catch(() => {});
      } else {
        setCvState('failed');
        setCvMessage(cv.message);
        setDeliveryPhoto(null);
        Alert.alert('Фото не принято', `${cv.message}\n\nСфотографируйте посылку у двери ещё раз.`, [{ text: 'Повторить' }]);
      }
    } catch {
      setCvState('success');
      setCvMessage('CV-сервис недоступен. Фото принято без верификации.');
      setStatus('delivered');
    }
  };

  const handleFinalCompletion = () => {
    Alert.alert('Успешно', 'Заказ завершён. Фото прикреплено.', [{ text: 'ОК', onPress: () => navigation.goBack() }]);
  };

  // ── Главная кнопка действия ───────────────────────────────────────────────
  const handleAction = () => {
    if (status === 'arrived_a')  { openQrScanner(); return; }
    if (status === 'arrived_b')  { takePhotoAndComplete(); return; }
    if (status === 'delivered')  { handleFinalCompletion(); return; }
    const next = STATUS_FLOW[status]?.next;
    if (next) setStatus(next as Order['status']);
  };

  const getActionButtonLabel = () => {
    if (status === 'delivered' && deliveryPhoto) return 'Подтвердить и завершить заказ';
    return STATUS_FLOW[status as keyof typeof STATUS_FLOW]?.label ?? '';
  };

  const callClient    = () => Linking.openURL(`tel:${order.clientPhone}`);
  const openChat      = () => navigation.navigate('Chat', { orderId: order.id, courierName: 'Курьер', clientName: order.clientName });
  const openNavigator = () => {
    const { latitude: lat, longitude: lng } = currentTargetCoords;
    const label = isGoingToPickup ? 'Точка забора (А)' : 'Точка доставки (Б)';
    const url = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { flexDirection: isLandscape ? 'row' : 'column' }]}>

      {/* Карта / фото */}
      <View style={[styles.mapContainer, { width: isLandscape ? '50%' : '100%', height: isLandscape ? '100%' : '35%' }]}>
        {deliveryPhoto ? (
          <Image source={{ uri: deliveryPhoto }} style={styles.map} resizeMode="cover" />
        ) : isLoadingMap ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : location ? (
          <MapView style={styles.map} initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }} showsUserLocation>
            <Marker coordinate={order.pickupCoords} title="Точка А" pinColor={isGoingToPickup ? 'green' : 'gray'} />
            <Marker coordinate={order.destinationCoords} title="Точка Б" pinColor={!isGoingToPickup ? 'red' : 'gray'} />
            <Polyline coordinates={[{ latitude: location.latitude, longitude: location.longitude }, currentTargetCoords]} strokeColor={isGoingToPickup ? '#28a745' : '#dc3545'} strokeWidth={4} lineDashPattern={[5, 5]} />
          </MapView>
        ) : (
          <Text style={styles.errorText}>Не удалось загрузить карту</Text>
        )}
      </View>

      {/* Детали + кнопки */}
      <View style={{ flex: 1, width: isLandscape ? '50%' : '100%' }}>
        <ScrollView contentContainerStyle={styles.detailsScrollContent}>

          {/* CV-статус */}
          {cvState === 'verifying' && (
            <View style={styles.cvBadge}>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.cvBadgeText}>CV проверяет фото…</Text>
            </View>
          )}
          {cvState === 'success' && (
            <View style={[styles.cvBadge, styles.cvBadgeSuccess]}>
              <Text style={styles.cvBadgeText}>✅ {cvMessage}</Text>
            </View>
          )}
          {cvState === 'failed' && (
            <View style={[styles.cvBadge, styles.cvBadgeFailed]}>
              <Text style={styles.cvBadgeText}>❌ {cvMessage}</Text>
            </View>
          )}

          {status === 'delivered' && deliveryPhoto && cvState !== 'verifying' && (
            <View style={styles.photoSuccessBadge}><Text style={styles.photoSuccessText}>✅ Фотоотчёт прикреплён</Text></View>
          )}

          {/* Подсказка QR для статуса arrived_a */}
          {status === 'arrived_a' && (
            <View style={styles.qrHintBadge}>
              <Text style={styles.qrHintText}>📦 Получите заказ и отсканируйте QR-код на упаковке</Text>
            </View>
          )}

          {!deliveryPhoto && (
            <View style={styles.targetIndicator}>
              <Text style={styles.targetIndicatorText}>Цель: {isGoingToPickup ? 'На точку забора (А)' : 'К клиенту (Б)'}</Text>
            </View>
          )}

          <Text style={styles.clientName}>{order.clientName}</Text>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionButton} onPress={callClient}>
              <Text style={styles.quickActionText}>📞 Звонок</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionButton, styles.navButton]} onPress={openNavigator}>
              <Text style={[styles.quickActionText, { color: '#fff' }]}>🧭 Навигатор</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionButton, styles.chatButton]} onPress={openChat}>
              <Text style={[styles.quickActionText, { color: '#fff' }]}>💬 Чат</Text>
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
        </ScrollView>

        <TouchableOpacity style={styles.actionButton} onPress={handleAction}>
          <Text style={styles.actionButtonText}>{getActionButtonLabel()}</Text>
        </TouchableOpacity>
      </View>

      {/* ── QR-сканер Modal ── */}
      <Modal visible={qrVisible} animationType="slide" onRequestClose={() => { setQrVisible(false); setQrState('idle'); }}>
        <View style={styles.qrContainer}>

          {/* Заголовок */}
          <View style={styles.qrHeader}>
            <Text style={styles.qrTitle}>Сканирование QR-кода</Text>
            <TouchableOpacity onPress={() => { setQrVisible(false); setQrState('idle'); }}>
              <Text style={styles.qrClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Камера или статус */}
          {qrState === 'scanning' ? (
            <View style={styles.qrCameraWrap}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleQrScanned}
              />
              {/* Прицел */}
              <View style={styles.qrOverlay}>
                <View style={styles.qrFrame} />
              </View>
              <Text style={styles.qrHintOverlay}>Наведите камеру на QR-код</Text>
            </View>
          ) : (
            <View style={styles.qrStatusWrap}>
              {qrState === 'verifying' && (
                <>
                  <ActivityIndicator size="large" color="#FF9500" />
                  <Text style={styles.qrStatusText}>{qrMessage}</Text>
                </>
              )}
              {qrState === 'success' && (
                <>
                  <Text style={styles.qrSuccessIcon}>✅</Text>
                  <Text style={[styles.qrStatusText, styles.qrStatusSuccess]}>{qrMessage}</Text>
                </>
              )}
              {qrState === 'failed' && (
                <>
                  <Text style={styles.qrFailedIcon}>❌</Text>
                  <Text style={[styles.qrStatusText, styles.qrStatusFailed]}>{qrMessage}</Text>
                  <TouchableOpacity style={styles.qrRetryButton} onPress={retryQrScan}>
                    <Text style={styles.qrRetryText}>Сканировать снова</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Информация о заказе */}
          <View style={styles.qrOrderInfo}>
            <Text style={styles.qrOrderId}>Заказ #{order.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.qrOrderItems}>{order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</Text>
          </View>
        </View>
      </Modal>

      {/* Состав заказа Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Состав заказа</Text>
            <ScrollView style={styles.modalList}>
              {order.items?.map((item, idx) => (
                <View key={item.id} style={styles.modalItemRow}>
                  <Text style={styles.modalItemName}>{idx + 1}. {item.name}</Text>
                  <Text style={styles.modalItemQty}>×{item.quantity}</Text>
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
  container:   { flex: 1, backgroundColor: '#fff' },
  mapContainer:{ backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  map:         { width: '100%', height: '100%' },
  errorText:   { color: '#888', fontSize: 16 },

  detailsScrollContent: { padding: 15, paddingBottom: 20 },
  targetIndicator:      { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  targetIndicatorText:  { fontSize: 14, fontWeight: '600', color: '#333' },
  clientName:           { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },

  quickActionsRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 8 },
  quickActionButton: { flex: 1, backgroundColor: '#e8e8e8', padding: 12, borderRadius: 10, alignItems: 'center' },
  navButton:         { backgroundColor: '#007AFF' },
  chatButton:        { backgroundColor: '#34C759' },
  quickActionText:   { fontSize: 14, fontWeight: '600', color: '#333' },

  itemsButton:     { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  itemsButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  addressBlock:    { marginBottom: 10, padding: 5, borderRadius: 5 },
  activeAddress:   { backgroundColor: '#e8f0fe', borderWidth: 1, borderColor: '#d2e3fc' },
  label:           { fontSize: 13, color: '#666', marginBottom: 2 },
  address:         { fontSize: 16 },
  price:           { fontSize: 22, fontWeight: 'bold', color: '#28a745', marginTop: 5 },

  actionButton:     { backgroundColor: '#FF9500', padding: 18, margin: 15, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontSize: 19, fontWeight: 'bold' },

  photoSuccessBadge: { backgroundColor: '#28a745', padding: 10, borderRadius: 8, marginBottom: 15, alignItems: 'center' },
  photoSuccessText:  { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  cvBadge:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#555', padding: 10, borderRadius: 8, marginBottom: 10 },
  cvBadgeSuccess: { backgroundColor: '#1a7a3c' },
  cvBadgeFailed:  { backgroundColor: '#c0392b' },
  cvBadgeText:    { color: '#fff', fontSize: 14, fontWeight: '600', flexShrink: 1 },

  qrHintBadge: { backgroundColor: '#fff3cd', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ffc107' },
  qrHintText:  { fontSize: 14, color: '#856404', textAlign: 'center' },

  // QR Scanner Modal
  qrContainer: { flex: 1, backgroundColor: '#000' },
  qrHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#111' },
  qrTitle:     { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  qrClose:     { color: '#fff', fontSize: 24, fontWeight: 'bold', paddingHorizontal: 8 },

  qrCameraWrap: { flex: 1, position: 'relative' },
  qrOverlay:    { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  qrFrame: {
    width: 240, height: 240,
    borderWidth: 3, borderColor: '#FF9500', borderRadius: 16,
    backgroundColor: 'transparent',
  },
  qrHintOverlay: { position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 16, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10 },

  qrStatusWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 16 },
  qrStatusText:    { color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 16 },
  qrStatusSuccess: { color: '#4ade80' },
  qrStatusFailed:  { color: '#f87171' },
  qrSuccessIcon:   { fontSize: 72 },
  qrFailedIcon:    { fontSize: 72 },
  qrRetryButton:   { backgroundColor: '#FF9500', padding: 16, borderRadius: 10, marginTop: 20 },
  qrRetryText:     { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  qrOrderInfo:   { backgroundColor: '#111', padding: 20 },
  qrOrderId:     { color: '#aaa', fontSize: 13, marginBottom: 4 },
  qrOrderItems:  { color: '#fff', fontSize: 15 },

  // Items modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:   { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle:     { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalList:      { marginBottom: 20 },
  modalItemRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemName:  { fontSize: 16, flex: 1, paddingRight: 10 },
  modalItemQty:   { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  modalCloseBtn:  { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center' },
  modalCloseBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
