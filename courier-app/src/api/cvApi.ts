/**
 * Клиент к CV-сервису (Analytics API) для курьерского приложения.
 * Используется при подтверждении доставки фотографией.
 */

// URL Analytics API — в реальном проекте берётся из переменных окружения
const CV_API_BASE = process.env.EXPO_PUBLIC_CV_API_URL ?? 'http://localhost:8000';

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

  const response = await fetch(`${CV_API_BASE}/order/verify-delivery`, {
    method: 'POST',
    body: formData,
    // НЕ устанавливаем Content-Type вручную — fetch сам проставит boundary
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CV-сервис вернул ошибку ${response.status}: ${text}`);
  }

  return (await response.json()) as VerifyDeliveryResult;
}
