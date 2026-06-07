/** Телефон клиента по умолчанию (пока OrderService не отдаёт contact). */
export const DEFAULT_CLIENT_PHONE = '+375291234567';

/** Цифры для tel: (E.164 без пробелов, с +). */
export const normalizePhoneForTel = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10) return null;

  return hasPlus || digits.length > 10 ? `+${digits}` : digits;
};

/** Пытается извлечь телефон из userId (если в dev передали номер). */
export const extractPhoneFromUserId = (userId?: string): string | null => {
  if (!userId) return null;

  const direct = normalizePhoneForTel(userId);
  if (direct) return direct;

  const match = userId.match(/(\+?\d[\d\s\-()]{8,}\d)/);
  if (!match) return null;

  return normalizePhoneForTel(match[1]);
};

export const getFallbackClientPhone = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_CLIENT_CONTACT_PHONE?.trim();
  if (fromEnv) {
    const normalized = normalizePhoneForTel(fromEnv);
    if (normalized) return normalized;
  }
  return DEFAULT_CLIENT_PHONE;
};

export const resolveClientPhone = (
  clientPhone: string | undefined,
  userId?: string,
): string => {
  const fromField = clientPhone ? normalizePhoneForTel(clientPhone) : null;
  if (fromField) return fromField;

  const fromUser = extractPhoneFromUserId(userId);
  if (fromUser) return fromUser;

  return getFallbackClientPhone();
};
