# Analytics System - API Integration

Система аналитики посещений с REST API для детекции объектов, мониторинга и прогнозирования.

## 🚀 Быстрый старт

### 1. Запуск через Docker (рекомендуется)

```bash
# Запуск всех сервисов включая API
docker-compose up -d

# API будет доступен по адресу: http://localhost:8000
```

### 2. Локальный запуск

```bash
# Установка зависимостей
pip install -r api/requirements.txt

# Запуск API
python start_api.py
```

## 📋 Доступные эндпоинты

### Детекция объектов
- `POST /detection/start` - Запуск детекции объектов на RTSP потоке с email уведомлениями
- `POST /detection/stop` - Остановка детекции
- `POST /detection/status` - Статус детекции для конкретной камеры

### Прогнозирование
- `POST /forecast/generate` - Генерация прогноза посещений с email уведомлениями

### Камеры
- `GET /cameras` - Получение списка доступных камер

### Общие
- `GET /` - Статус API
- `GET /health` - Проверка здоровья
- `GET /docs` - Swagger документация
- `GET /redoc` - ReDoc документация

## 🔧 Примеры использования

### Запуск детекции объектов с email уведомлениями

```bash
curl -X POST "http://localhost:8000/detection/start" \
     -H "Content-Type: application/json" \
     -d '{
       "camera_id": 1,
       "frame_interval_minutes": 2,
       "email_interval_minutes": 1,
       "threshold_multiplier": 1.5,
       "send_to_email": "user@example.com"
     }'
```

**Параметры:**
- `camera_id` - ID камеры из базы данных
- `frame_interval_minutes` - Интервал обработки кадров (минуты)
- `email_interval_minutes` - Интервал отправки email уведомлений (минуты)
- `threshold_multiplier` - Множитель для расчета порога (например, 1.5 = среднее * 1.5)
- `send_to_email` - Email для получения уведомлений

### Остановка детекции объектов

```bash
curl -X POST "http://localhost:8000/detection/stop" \
     -H "Content-Type: application/json" \
     -d '{
       "camera_id": 1
     }'
```

### Получение статуса детекции

```bash
curl -X POST "http://localhost:8000/detection/status" \
     -H "Content-Type: application/json" \
     -d '{
       "camera_id": 1
     }'
```

**Возможные статусы:**
- `"active"` - детекция запущена и работает
- `"inactive"` - детекция не запущена для этой камеры
- `"stopped"` - детекция была остановлена

### Генерация прогноза с email уведомлением

```bash
curl -X POST "http://localhost:8000/forecast/generate" \
     -H "Content-Type: application/json" \
     -d '{
       "camera_id": 1,
       "days_ahead": 3,
       "email": "user@example.com"
     }'
```

### Получение списка камер

```bash
curl -X GET "http://localhost:8000/cameras"
```

### Python пример

```python
import requests

# Запуск детекции с email уведомлениями
response = requests.post("http://localhost:8000/detection/start", json={
    "camera_id": 1,
    "frame_interval_minutes": 2,
    "email_interval_minutes": 1,
    "threshold_multiplier": 1.5,
    "send_to_email": "user@example.com"
})
print(response.json())

# Генерация прогноза с email
response = requests.post("http://localhost:8000/forecast/generate", json={
    "camera_id": 1,
    "days_ahead": 3,
    "email": "user@example.com"
})
print(response.json())

# Получение статуса
response = requests.post("http://localhost:8000/detection/status", json={
    "camera_id": 1
})
print(response.json())
```

## 📧 Email уведомления

### Типы уведомлений

1. **Анализ спроса** (при детекции):
   - **Повышенный спрос** - когда посетителей >20% от среднего
   - **Пониженный спрос** - когда посетителей <-20% от среднего  
   - **Обычный спрос** - когда посетители в пределах ±20% от среднего

2. **Прогнозы** (при генерации):
   - Отчет о прогнозе посещений на указанное количество дней

### Настройка email

Все email настройки берутся из переменных окружения (см. раздел "Конфигурация").

## 📁 Структура проекта

```
Analytics system/
├── api/                          # REST API
│   ├── main.py                   # Основной файл FastAPI
│   ├── models.py                 # Pydantic модели
│   ├── services/                 # Сервисы
│   │   ├── detection_service.py  # Сервис детекции с email
│   │   ├── forecast_service.py   # Сервис прогнозирования с email
│   │   └── email_service.py      # Сервис отправки email
│   ├── requirements.txt          # Зависимости API
│   ├── Dockerfile               # Docker образ
│   └── api.log                  # Логи API (если включены)
├── forecast/                    # Оригинальный скрипт прогнозирования
│   └── forecast.py
├── rtsp_object_detection.py     # Оригинальный скрипт детекции
├── docker-compose.yaml          # Docker Compose конфигурация
├── start_api.py                 # Скрипт запуска API
├── yolov5l6u.pt                # Модель YOLO для детекции
└── README_API.md               # Этот файл
```

## ⚙️ Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```bash
# База данных
DB_HOST=localhost
DB_PORT=5433
DB_NAME=cafeteria
DB_USER=admin
DB_PASSWORD=admin123

# Email (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Gemini AI (для прогнозов)
GEMINI_API_KEY=your_gemini_api_key

# API настройки
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
API_LOG_LEVEL=info
```

**Примечание:** Все переменные имеют значения по умолчанию, поэтому `.env` файл не обязателен.

**Описание переменных API:**
- `API_HOST` - хост для API сервера (по умолчанию: 0.0.0.0)
- `API_PORT` - порт для API сервера (по умолчанию: 8000)
- `API_RELOAD` - автоматическая перезагрузка при изменениях (по умолчанию: true)
- `API_LOG_LEVEL` - уровень логирования (по умолчанию: info)

### Настройка базы данных

Убедитесь, что в базе данных есть таблицы:
- `cameras` - информация о камерах
- `visitors_count` - данные о количестве посетителей

## 🐳 Docker сервисы

- **timescaledb** (порт 5433) - База данных
- **pgadmin** (порт 8080) - Веб-интерфейс для БД
- **grafana** (порт 3000) - Дашборды и визуализация
- **analytics-api** (порт 8000) - REST API

## 📊 Мониторинг

- **API документация**: http://localhost:8000/docs
- **ReDoc документация**: http://localhost:8000/redoc
- **Grafana дашборды**: http://localhost:3000
- **PgAdmin**: http://localhost:8080

## 🔄 Логика работы

### Детекция объектов

1. **Запуск**: API получает параметры камеры и настройки email
2. **Подключение**: Устанавливается соединение с RTSP потоком
3. **Обработка**: YOLO модель анализирует кадры и считает людей
4. **Сохранение**: Данные сохраняются в базу данных
5. **Email проверка**: Каждые `email_interval_minutes` проверяется спрос
6. **Уведомления**: Отправляются email с анализом спроса

### Прогнозирование

1. **Запуск**: API получает параметры прогноза и email
2. **Данные**: Загружаются исторические данные из БД
3. **Анализ**: Prophet модель генерирует прогноз
4. **AI анализ**: Gemini AI анализирует результаты
5. **Email**: Отправляется отчет с прогнозом

## 🔒 Безопасность

⚠️ **Важно для продакшена**:
- Ограничьте CORS домены
- Используйте HTTPS
- Настройте аутентификацию
- Смените пароли по умолчанию
- Используйте переменные окружения для секретов
- Не коммитьте `.env` файлы в Git

## 🆘 Поддержка

При проблемах проверьте:

1. **Логи API**: `docker logs analytics-api`
2. **Статус сервисов**: `docker-compose ps`
3. **Доступность базы данных**: подключение к PostgreSQL
4. **Настройки RTSP потока**: доступность камеры
5. **Конфигурацию email**: SMTP настройки
6. **Gemini API**: валидность API ключа

### Частые проблемы

- **Email не отправляются**: проверьте SMTP настройки и пароль приложения
- **Детекция не запускается**: проверьте доступность RTSP потока
- **Ошибки БД**: убедитесь, что PostgreSQL запущен и доступен
- **Модель не загружается**: проверьте наличие файла `yolov5l6u.pt`

## 📈 Возможности

- ✅ **Детекция объектов** в реальном времени через RTSP
- ✅ **Email уведомления** о состоянии спроса
- ✅ **Прогнозирование** посещений с AI анализом
- ✅ **REST API** для интеграции с другими системами
- ✅ **Docker** контейнеризация для легкого развертывания
- ✅ **Мониторинг** через Grafana дашборды
- ✅ **Масштабируемость** - поддержка множества камер