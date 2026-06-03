const PREFIX = '[CourierApp]';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const emit = (level: LogLevel, tag: string, message: string, data?: unknown) => {
  if (!__DEV__) return;

  const line = `${PREFIX}[${tag}] ${message}`;
  switch (level) {
    case 'error':
      console.error(line, data ?? '');
      break;
    case 'warn':
      console.warn(line, data ?? '');
      break;
    case 'debug':
      console.debug(line, data ?? '');
      break;
    default:
      console.log(line, data ?? '');
  }
};

export const logger = {
  debug: (tag: string, message: string, data?: unknown) =>
    emit('debug', tag, message, data),
  info: (tag: string, message: string, data?: unknown) =>
    emit('info', tag, message, data),
  warn: (tag: string, message: string, data?: unknown) =>
    emit('warn', tag, message, data),
  error: (tag: string, message: string, data?: unknown) =>
    emit('error', tag, message, data),
};
