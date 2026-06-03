/**
 * Клиент к CV-сервису (Analytics API) для курьерского приложения.
 * Используется при подтверждении доставки фотографией.
 */

import { getCvApiBase } from '../config/apiBase';
import { loggedFetch } from './loggedFetch';

export interface VerifyDeliveryResult {
  verified: boolean;
  package_detected: boolean;
  detected_objects: Record<string, number>;
  message: string;
}

/**
 * Отправляет фото доставки на CV-верификацию.
 * @param imageUri  Локальный URI снимка из expo-image-picker.
 * @returns Результат верификации от CV-сервиса.
 */
export async function verifyDeliveryPhoto(
  imageUri: string,
): Promise<VerifyDeliveryResult> {
  const formData = new FormData();

  // React Native / Expo FormData принимает объект { uri, name, type }
  formData.append('image', {
    uri: imageUri,
    name: 'delivery.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const response = await loggedFetch(
    `${getCvApiBase()}/order/verify-delivery`,
    {
      method: 'POST',
      body: formData,
      // НЕ устанавливаем Content-Type вручную — fetch сам проставит boundary
    },
    'CVAPI',
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CV-сервис вернул ошибку ${response.status}: ${text}`);
  }

  return (await response.json()) as VerifyDeliveryResult;
}
