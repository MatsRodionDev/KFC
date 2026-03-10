import { useCallback, useEffect, useRef, useState } from 'react';
import { geoService, orderService } from '../../services/api';
import { AddressPrediction, AddressGeocodeResponse } from '../../types';
import { DEFAULT_USER_ID } from '../../constants';
import './AddressMapModal.css';

interface AddressMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAddress?: AddressGeocodeResponse | null;
  userId?: string;
  onAddressSaved?: () => void;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const DEFAULT_CENTER: [number, number] = [53.9, 30.35];
const DEFAULT_ZOOM = 15;
const ADDRESS_ZOOM = 17;
const DELIVERY_RADIUS_KM = 15;
const MIN_SEARCH_LENGTH = 3;
const CENTER_DISTANCE_THRESHOLD = 0.001;
const MAP_ANIMATION_DURATION = 300;

const YANDEX_MAPS_SCRIPT_URL = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
const YANDEX_ELEMENTS_SELECTOR = [
  '[class*="ymaps-2-1-79-copyright"]',
  '[class*="ymaps-2-1-79-float-button"]',
  'a[href*="yandex.ru/maps"]',
  'a[href*="yandex.com/maps"]'
].join(', ');

export const AddressMapModal = ({ isOpen, onClose, initialAddress, userId: userIdProp, onAddressSaved }: AddressMapModalProps) => {
  const userId = userIdProp ?? DEFAULT_USER_ID;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const hideElementsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressGeocodeResponse | null>(initialAddress || null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean | null>(null);

  const destroyMap = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.destroy();
      } catch (e) {
        console.error('Error destroying map:', e);
      }
      mapInstanceRef.current = null;
    }
  }, []);

  const hideYandexElements = useCallback(() => {
    const elements = document.querySelectorAll(YANDEX_ELEMENTS_SELECTOR);
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = 'none';
      htmlEl.style.visibility = 'hidden';
      htmlEl.style.opacity = '0';
      htmlEl.style.pointerEvents = 'none';
    });
  }, []);

  const startHidingYandexElements = useCallback(() => {
    hideYandexElements();
    
    if (hideElementsIntervalRef.current) {
      clearInterval(hideElementsIntervalRef.current);
    }
    
    hideElementsIntervalRef.current = setInterval(hideYandexElements, 500);
    
    setTimeout(() => {
      if (hideElementsIntervalRef.current) {
        clearInterval(hideElementsIntervalRef.current);
        hideElementsIntervalRef.current = null;
      }
    }, 5000);
  }, [hideYandexElements]);

  const checkDeliveryAvailability = useCallback(async (latitude: number, longitude: number) => {
    try {
      const stores = await geoService.getStoresInRadius(latitude, longitude, DELIVERY_RADIUS_KM);
      setDeliveryAvailable(stores && stores.length > 0);
    } catch (error) {
      console.error('Error checking delivery radius:', error);
      setDeliveryAvailable(false);
    }
  }, []);

  const getInitialMapCenter = useCallback((): [number, number] => {
    if (initialAddress?.coordinates) {
      return [
        initialAddress.coordinates.latitude,
        initialAddress.coordinates.longitude
      ];
    }
    return DEFAULT_CENTER;
  }, [initialAddress]);

  const getInitialZoom = useCallback((): number => {
    return initialAddress?.coordinates ? ADDRESS_ZOOM : DEFAULT_ZOOM;
  }, [initialAddress]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.ymaps || mapInstanceRef.current) {
      return;
    }

    try {
      const center = getInitialMapCenter();
      const zoom = getInitialZoom();

      const map = new window.ymaps.Map(mapRef.current, {
        center,
        zoom,
        controls: [],
        behaviors: ['drag', 'scrollZoom', 'dblClickZoom', 'multiTouch']
      });

      map.behaviors.disable('scrollZoom');
      map.behaviors.disable('dblClickZoom');
      map.behaviors.disable('multiTouch');

      mapInstanceRef.current = map;
      setIsLoading(false);

      if (initialAddress?.coordinates) {
        const coords: [number, number] = [
          initialAddress.coordinates.latitude,
          initialAddress.coordinates.longitude
        ];
        
        map.setCenter(coords, ADDRESS_ZOOM, { duration: 0 });
        setSelectedAddress(initialAddress);
        setSearchQuery(initialAddress.address);
      }

      setTimeout(startHidingYandexElements, 100);
    } catch (err) {
      console.error('Map initialization error:', err);
      setIsLoading(false);
    }
  }, [initialAddress, getInitialMapCenter, getInitialZoom, startHidingYandexElements]);

  const loadYandexMapsScript = useCallback(() => {
    if (window.ymaps && typeof window.ymaps.ready === 'function') {
      window.ymaps.ready(initializeMap);
      return;
    }

    const existingScript = document.querySelector(`script[src*="${YANDEX_MAPS_SCRIPT_URL}"]`);
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.ymaps && typeof window.ymaps.ready === 'function') {
          clearInterval(checkInterval);
          window.ymaps.ready(initializeMap);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.ymaps) {
          setIsLoading(false);
        }
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = YANDEX_MAPS_SCRIPT_URL;
    script.async = true;
    
    script.onload = () => {
      if (window.ymaps && typeof window.ymaps.ready === 'function') {
        window.ymaps.ready(initializeMap);
      }
    };

    script.onerror = () => {
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, [initializeMap]);

  const calculateDistance = useCallback((coord1: [number, number], coord2: [number, number]): number => {
    return Math.sqrt(
      Math.pow(coord1[0] - coord2[0], 2) + 
      Math.pow(coord1[1] - coord2[1], 2)
    );
  }, []);

  const centerMapOnAddress = useCallback((address: AddressGeocodeResponse) => {
    if (!mapInstanceRef.current || !address.coordinates) {
      return;
    }

    const map = mapInstanceRef.current;
    const coords: [number, number] = [
      address.coordinates.latitude,
      address.coordinates.longitude
    ];

    const currentCenter = map.getCenter();
    if (currentCenter) {
      const distance = calculateDistance([currentCenter[0], currentCenter[1]], coords);
      
      if (distance > CENTER_DISTANCE_THRESHOLD) {
        map.setCenter(coords, ADDRESS_ZOOM, {
          duration: MAP_ANIMATION_DURATION
        });
      }
    }
  }, [calculateDistance]);

  const handleSearch = useCallback(async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery || trimmedQuery.length < MIN_SEARCH_LENGTH) {
      return;
    }

    try {
      setIsSearching(true);
      const response = await geoService.getPredictions(trimmedQuery);
      setPredictions(response.predictions || []);
    } catch (err) {
      console.error('Error searching addresses:', err);
      setPredictions([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleSelectPrediction = useCallback(async (prediction: AddressPrediction) => {
    try {
      setIsLoadingAddress(true);
      setSearchQuery(prediction.address);
      setPredictions([]);
      setDeliveryAvailable(null);

      const addressInfo = await geoService.getAddressInfo(prediction.address);
      setSelectedAddress(addressInfo);

      if (addressInfo.coordinates) {
        await checkDeliveryAvailability(
          addressInfo.coordinates.latitude,
          addressInfo.coordinates.longitude
        );
      }
    } catch (err) {
      console.error('Error getting address info:', err);
      alert('Не удалось получить информацию об адресе');
      setDeliveryAvailable(null);
    } finally {
      setIsLoadingAddress(false);
    }
  }, [checkDeliveryAvailability]);

  const handleSaveAddress = useCallback(async () => {
    if (!selectedAddress) {
      alert('Выберите адрес на карте');
      return;
    }

    if (deliveryAvailable === false) {
      alert('Доставка недоступна в этом районе');
      return;
    }

    try {
      setIsLoadingAddress(true);
      await orderService.setDeliveryAddress({
        userId,
        address: selectedAddress.address,
        serviceType: 1
      });

      onAddressSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Error saving address:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Не удалось сохранить адрес';
      alert(`Ошибка: ${errorMessage}`);
    } finally {
      setIsLoadingAddress(false);
    }
  }, [selectedAddress, deliveryAvailable, onAddressSaved, onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (hideElementsIntervalRef.current) {
        clearInterval(hideElementsIntervalRef.current);
        hideElementsIntervalRef.current = null;
      }
      destroyMap();
      return;
    }

    setIsLoading(true);
    loadYandexMapsScript();
  }, [isOpen, destroyMap, loadYandexMapsScript]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialAddress) {
      setSelectedAddress(initialAddress);
      setSearchQuery(initialAddress.address);
      
      if (initialAddress.coordinates) {
        checkDeliveryAvailability(
          initialAddress.coordinates.latitude,
          initialAddress.coordinates.longitude
        );
      }
    } else {
      setSelectedAddress(null);
      setSearchQuery('');
      setDeliveryAvailable(null);
    }
  }, [isOpen, initialAddress, checkDeliveryAvailability]);

  useEffect(() => {
    if (selectedAddress) {
      centerMapOnAddress(selectedAddress);
    }
  }, [selectedAddress, centerMapOnAddress]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="address-map-modal-overlay" onClick={onClose}>
      <div className="address-map-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        
        <div className="map-container" ref={mapRef}>
          {isLoading && (
            <div className="map-loading">
              <div className="loading-spinner"></div>
              <p>Загрузка карты...</p>
            </div>
          )}
          <div className="fixed-marker-pointer">
            <div className="custom-map-pin">
              <div className="pin-icon"></div>
              <div className="pin-stem"></div>
            </div>
          </div>
        </div>

        <div className="address-search-panel">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="address-search-input"
              placeholder="Введите адрес для поиска"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching}
            />
            <button
              className="search-btn"
              onClick={handleSearch}
              disabled={isSearching || searchQuery.length < MIN_SEARCH_LENGTH}
            >
              {isSearching ? (
                <div className="search-spinner"></div>
              ) : (
                '🔍'
              )}
            </button>
          </div>
          
          {isLoadingAddress && (
            <div className="address-loading">
              <div className="loading-spinner-small"></div>
              <span>Определение адреса...</span>
            </div>
          )}
          
          {deliveryAvailable === false && selectedAddress && (
            <div className="delivery-unavailable-error">
              <span className="error-icon">⚠️</span>
              <span className="error-text">Доставка недоступна в этом районе</span>
            </div>
          )}
          
          {predictions.length > 0 && (
            <div className="predictions-list">
              {predictions.map((prediction, index) => (
                <div
                  key={index}
                  className="prediction-item"
                  onClick={() => handleSelectPrediction(prediction)}
                >
                  <div className="prediction-icon">📍</div>
                  <div className="prediction-content">
                    <div className="prediction-main">{prediction.structured.mainText}</div>
                    {prediction.structured.secondaryText && (
                      <div className="prediction-secondary">{prediction.structured.secondaryText}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer-actions">
          <button
            className="btn-save-address"
            onClick={handleSaveAddress}
            disabled={!selectedAddress || isLoadingAddress || deliveryAvailable === false}
          >
            {isLoadingAddress ? (
              <>
                <div className="btn-spinner"></div>
                Сохранение...
              </>
            ) : (
              'Сохранить адрес'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
