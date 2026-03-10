/**
 * Геолокация с fallback по рекомендациям:
 * - При POSITION_UNAVAILABLE (code 2, типично на Mac) используем watchPosition
 *   до 15 с и берём первую успешную позицию (система успевает выдать координаты).
 * - Отбрасываем невалидные координаты (0,0 и известные «заглушки»).
 */

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 25000,
  maximumAge: 0
};

const WATCH_FALLBACK_MS = 15000;

/** Известные «заглушки» координат от браузеров/ОС (например, Apple) */
const DUMMY_POSITIONS: Array<[number, number]> = [
  [0, 0],
  [37.38600158691406, -122.08200073242188]
];

export function isPositionValid(lat: number, lon: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat === 0 && lon === 0) return false;
  const isDummy = DUMMY_POSITIONS.some(
    ([dLat, dLon]) => Math.abs(lat - dLat) < 1e-5 && Math.abs(lon - dLon) < 1e-5
  );
  return !isDummy;
}

export interface GeoCoords {
  lat: number;
  lon: number;
}

/**
 * Запрос текущей позиции: сначала getCurrentPosition, при code 2 (POSITION_UNAVAILABLE)
 * — fallback на watchPosition до WATCH_FALLBACK_MS, первая валидная позиция = успех.
 */
export function getCurrentPositionWithWatchFallback(
  options: PositionOptions = DEFAULT_OPTIONS
): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const onSuccess = (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      if (!isPositionValid(lat, lon)) {
        reject(new Error('Position unavailable'));
        return;
      }
      resolve({ lat, lon });
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === 2) {
        let settled = false;
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (settled) return;
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            if (!isPositionValid(lat, lon)) return;
            settled = true;
            navigator.geolocation.clearWatch(watchId);
            clearTimeout(timeoutId);
            resolve({ lat, lon });
          },
          () => {
            if (settled) return;
            settled = true;
            navigator.geolocation.clearWatch(watchId);
            clearTimeout(timeoutId);
            reject(err);
          },
          opts
        );
        const timeoutId = setTimeout(() => {
          if (settled) return;
          settled = true;
          navigator.geolocation.clearWatch(watchId);
          reject(err);
        }, WATCH_FALLBACK_MS);
        return;
      }
      reject(err);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
  });
}
