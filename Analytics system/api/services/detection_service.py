import sys
import os
import time
import threading
import logging
from typing import Dict, Any, Optional
import cv2
import psycopg2
# torch/YOLO импортируются лениво внутри _init_model()
from datetime import datetime
from collections import Counter
import pandas as pd
from sqlalchemy import create_engine
from .email_service import EmailService

# Добавляем корневую директорию в путь для импорта оригинального скрипта
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

logger = logging.getLogger(__name__)

class DetectionService:
    """Сервис для детекции объектов на RTSP потоке"""
    
    def __init__(self):
        # Переменные окружения для базы данных
        self.db_host = os.getenv("DB_HOST", "localhost")
        self.db_port = int(os.getenv("DB_PORT", "5555"))
        self.db_name = os.getenv("DB_NAME", "cafeteria")
        self.db_user = os.getenv("DB_USER", "admin")
        self.db_password = os.getenv("DB_PASSWORD", "admin123")
        
        # Строка подключения к БД для SQLAlchemy
        self.db_connection_string = f"postgresql+psycopg2://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
        
        self.running = False
        self.thread = None
        self.reader = None
        self.model = None
        self.db_connection = None
        self.cursor = None
        
        # Email сервис
        self.email_service = EmailService()
        
        # Параметры для email уведомлений (значения по умолчанию):
        self.email_interval_minutes = 15
        self.threshold_multiplier = 1.5
        self.notification_email = None
        self.last_email_time = {}  # {camera_id: timestamp}
        
    async def cleanup(self):
        """Очистка ресурсов"""
        self.stop_detection()
        if self.db_connection:
            self.db_connection.close()
    
    def _init_database(self, config: Dict[str, Any]):
        """Инициализация подключения к базе данных"""
        try:
            self.db_connection = psycopg2.connect(
                host=self.db_host,
                port=self.db_port,
                dbname=self.db_name,
                user=self.db_user,
                password=self.db_password
            )
            self.cursor = self.db_connection.cursor()
            logger.info("Подключение к базе данных установлено")
        except Exception as e:
            logger.error(f"Ошибка подключения к базе данных: {e}")
            raise
    
    def _init_model(self, config: Dict[str, Any]):
        """Инициализация модели YOLO"""
        try:
            import torch
            from ultralytics import YOLO
            model_weights = config.get('model_weights', 'yolov5l6.pt')
            device = "cuda:0" if torch.cuda.is_available() else "cpu"
            
            self.model = YOLO(model_weights)
            self.model.to(device)
            if device == "cpu":
                self.model.fuse()
            
            logger.info(f"Модель {model_weights} загружена на устройство {device}")
        except Exception as e:
            logger.error(f"Ошибка загрузки модели: {e}")
            raise
    
    def _init_rtsp_reader(self, config: Dict[str, Any]):
        """Инициализация RTSP читателя"""
        try:
            rtsp_url = config.get('rtsp_url', 'rtsp://192.168.100.10:8554/live')
            self.reader = RTSPReader(rtsp_url)
            logger.info(f"RTSP читатель инициализирован для {rtsp_url}")
        except Exception as e:
            logger.error(f"Ошибка инициализации RTSP читателя: {e}")
            raise
    
    def _draw_detections(self, frame, boxes, class_ids, class_names, top_crop: int) -> Dict[str, int]:
        """Отрисовка детекций на кадре"""
        counts = Counter()
        for xyxy, cls_id in zip(boxes, class_ids):
            x1, y1, x2, y2 = map(int, xyxy)
            label = class_names[int(cls_id)]
            counts[label] += 1

            # Bounding box (green)
            cv2.rectangle(frame, (x1, top_crop+y1), (x2, top_crop+y2), (0, 255, 0), 2)

            # Label background box
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            cv2.rectangle(frame, (x1, top_crop+y1 - th - 8), (x1 + tw + 4, top_crop+y1), (0, 255, 0), -1)
            cv2.putText(frame, label, (x1 + 2, top_crop+y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)

        return counts
    
    def _save_to_database(self, camera_id: int, num_people: int):
        """Сохранение количества людей в базу данных"""
        try:
            ts = datetime.utcnow()
            self.cursor.execute(
                """
                INSERT INTO visitors_count (camera_id, ts, visitors)
                VALUES (%s, %s, %s)
                """,
                (camera_id, ts, num_people)
            )
            self.db_connection.commit()
            logger.debug(f"Сохранено в БД: камера {camera_id}, посетители {num_people}")
        except Exception as e:
            logger.error(f"Ошибка сохранения в БД: {e}")
    
    def run_detection(self, config: Dict[str, Any]):
        """Запуск детекции объектов"""
        try:
            logger.info("Запуск детекции объектов...")
            
            # Инициализация компонентов
            self._init_database(config)
            self._init_model(config)
            self._init_rtsp_reader(config)
            
            self.running = True
            
            # Параметры из конфига
            interval = config.get('frame_interval', 3.0)
            scale = config.get('display_scale', 0.4)
            conf_threshold = config.get('conf_threshold', 0.6)
            camera_id = config.get('camera_id', 1)
            top_crop = config.get('top_crop', 500)
            bottom_crop = config.get('bottom_crop', 800)
            save_to_db = config.get('save_to_db', True)
            
            logger.info(f"Параметры детекции: интервал={interval}s, масштаб={scale}, порог={conf_threshold}")
            logger.info(f"Email параметры: интервал={self.email_interval_minutes} мин, множитель={self.threshold_multiplier}, email={self.notification_email}")
            
            # Детальное логирование настроек email уведомлений
            if self.notification_email:
                logger.info(f"Email уведомления ВКЛЮЧЕНЫ для камеры {camera_id}")
                logger.info(f"  - Email получатель: {self.notification_email}")
                logger.info(f"  - Интервал проверки: {self.email_interval_minutes} минут")
                logger.info(f"  - Множитель порога: {self.threshold_multiplier}")
                logger.info(f"  - Первая проверка будет через {self.email_interval_minutes} минут")
            else:
                logger.warning(f"Email уведомления ОТКЛЮЧЕНЫ для камеры {camera_id} - email не указан")
            
            # Таймер для email уведомлений
            last_email_check = time.time()
            
            while self.running:
                t_start = time.time()
                
                # Проверяем, нужно ли отправить email уведомление (независимо от обработки кадров)
                if self.notification_email and self._should_check_threshold(camera_id):
                    logger.info(f"Время для проверки email уведомлений для камеры {camera_id} - получение текущего количества посетителей")
                    # Получаем текущее количество посетителей из последнего сохраненного значения
                    current_visitors = self._get_latest_visitor_count(camera_id)
                    if current_visitors is not None:
                        logger.info(f"Получено текущее количество посетителей для камеры {camera_id}: {current_visitors}")
                        self._check_threshold_and_send_email(camera_id, current_visitors)
                    else:
                        logger.warning(f"Не удалось получить текущее количество посетителей для камеры {camera_id}")
                    last_email_check = time.time()
                    logger.debug(f"Время последней проверки email обновлено: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(last_email_check))}")
                elif not self.notification_email:
                    logger.debug(f"Email уведомления отключены для камеры {camera_id}")
                elif not self._should_check_threshold(camera_id):
                    logger.debug(f"Еще не время для проверки email уведомлений для камеры {camera_id}")
                
                # Получение кадра
                frame = self.reader.read()
                if frame is None:
                    logger.warning("Кадр ещё не получен — подождём…")
                    time.sleep(0.1)
                    continue
                
                original_frame = frame.copy()
                h, w, _ = frame.shape
                
                # Обрезка кадра
                if h > (top_crop + bottom_crop):
                    frame = frame[top_crop:h-bottom_crop, :]
                else:
                    logger.warning(f"Кадр ({h}px) меньше, чем top_crop+bottom_crop ({top_crop+bottom_crop}px)")
                
                # Детекция
                results = self.model.predict(frame, conf=conf_threshold, verbose=False)
                boxes = results[0].boxes.xyxy.cpu().numpy()
                class_ids = results[0].boxes.cls.cpu().numpy()
                class_names = results[0].names
                
                # Отрисовка и подсчет
                counts = self._draw_detections(original_frame, boxes, class_ids, class_names, top_crop)
                
                # Подсчет людей
                num_people = counts.get("person", 0)
                
                # Сохранение в БД
                if save_to_db:
                    self._save_to_database(camera_id, num_people)
                
                
                # Логирование
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                logger.info(f"{timestamp} - Камера {camera_id}: {num_people} человек")
                if counts:
                    for cls, n in sorted(counts.items()):
                        logger.debug(f"  {cls}: {n}")
                
                # Отображение (если нужно)
                if scale != 1.0:
                    frame_disp = cv2.resize(original_frame, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
                else:
                    frame_disp = original_frame
                
                cv2.imshow("RTSP Object Detection", frame_disp)
                
                # Проверка на выход
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
                
                # Сон до следующего кадра
                elapsed = time.time() - t_start
                remaining = interval - elapsed
                while remaining > 0 and self.running:
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        break
                    time.sleep(min(0.05, remaining))
                    remaining = interval - (time.time() - t_start)
            
        except Exception as e:
            logger.error(f"Ошибка в процессе детекции: {e}")
            raise
        finally:
            self._cleanup_detection()
    
    def _cleanup_detection(self):
        """Очистка ресурсов детекции"""
        try:
            if self.reader:
                self.reader.stop()
            cv2.destroyAllWindows()
            if self.cursor:
                self.cursor.close()
            if self.db_connection:
                self.db_connection.close()
            logger.info("Ресурсы детекции очищены")
        except Exception as e:
            logger.error(f"Ошибка при очистке ресурсов: {e}")
    
    def stop_detection(self):
        """Остановка детекции"""
        logger.info("Остановка детекции...")
        self.running = False
        
        # Останавливаем RTSP читатель
        if self.reader:
            logger.info("Остановка RTSP читателя...")
            self.reader.stop()
            self.reader = None
        
        # Ждем завершения основного потока детекции
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
        
        # Закрываем подключение к базе данных
        if self.db_connection:
            logger.info("Закрытие подключения к базе данных...")
            self.db_connection.close()
            self.db_connection = None
            self.cursor = None
        
        logger.info("Детекция остановлена")

    def _should_check_threshold(self, camera_id: int) -> bool:
        """Проверяет, нужно ли проверять порог (прошло ли достаточно времени)"""
        now = time.time()
        last_check = self.last_email_time.get(camera_id, 0)
        time_since_last_check = now - last_check
        required_interval = self.email_interval_minutes * 60
        
        logger.debug(f"Проверка времени для email уведомлений камеры {camera_id}: "
                    f"прошло {time_since_last_check:.1f}s, требуется {required_interval}s")
        
        should_check = time_since_last_check >= required_interval
        
        if should_check:
            logger.info(f"Время для проверки email уведомлений камеры {camera_id} - прошло {time_since_last_check:.1f}s (интервал: {self.email_interval_minutes} мин)")
        else:
            remaining_time = required_interval - time_since_last_check
            logger.debug(f"Еще рано для проверки email уведомлений камеры {camera_id} - осталось {remaining_time:.1f}s")
        
        return should_check

    def _get_average_visitors_for_time(self, camera_id: int) -> Optional[float]:
        """Получение среднего количества посетителей для текущего времени дня"""
        try:
            engine = create_engine(self.db_connection_string)
            
            query = f"""
                SELECT AVG(visitors) as avg_visitors
                FROM visitors_count 
                WHERE camera_id = {camera_id} 
                AND EXTRACT(DOW FROM ts) = EXTRACT(DOW FROM now())
                AND EXTRACT(HOUR FROM ts) = EXTRACT(HOUR FROM now())
                AND ts >= now() - interval '4 weeks'
                AND ts < now() - interval '1 day';
            """
            
            df = pd.read_sql(query, engine)
            
            if not df.empty and not pd.isna(df['avg_visitors'].iloc[0]):
                return float(df['avg_visitors'].iloc[0])
            else:
                return None
                
        except Exception as e:
            logger.error(f"Ошибка получения среднего значения для камеры {camera_id}: {e}")
            return None

    def _get_latest_visitor_count(self, camera_id: int) -> Optional[int]:
        """Получение последнего количества посетителей для камеры"""
        try:
            engine = create_engine(self.db_connection_string)
            
            query = f"""
                SELECT visitors 
                FROM visitors_count 
                WHERE camera_id = {camera_id} 
                ORDER BY ts DESC 
                LIMIT 1;
            """
            
            df = pd.read_sql(query, engine)
            
            if not df.empty and not pd.isna(df['visitors'].iloc[0]):
                return int(df['visitors'].iloc[0])
            else:
                return None
                
        except Exception as e:
            logger.error(f"Ошибка получения последнего количества посетителей для камеры {camera_id}: {e}")
            return None

    def _check_threshold_and_send_email(self, camera_id: int, current_visitors: int):
        """Анализирует спрос и отправляет email с тремя состояниями: повышенный, пониженный, обычный"""
        try:
            logger.info(f"Начало анализа спроса для камеры {camera_id} с текущим количеством посетителей: {current_visitors}")
            
            # Получаем среднее значение посетителей
            logger.debug(f"Получение среднего значения посетителей для камеры {camera_id}...")
            average_visitors = self._get_average_visitors_for_time(camera_id)
            
            if average_visitors is None:
                logger.warning(f"Нет исторических данных для камеры {camera_id} - пропускаем анализ спроса")
                return
            
            logger.info(f"Получено среднее значение для камеры {camera_id}: {average_visitors:.1f} посетителей")
            
            # Определяем статус спроса на основе отклонения от среднего
            percentage_change = ((current_visitors / average_visitors - 1) * 100) if average_visitors > 0 else 0
            logger.debug(f"Рассчитано изменение спроса: {percentage_change:.1f}% (текущие: {current_visitors}, средние: {average_visitors:.1f})")
            
            # Определяем статус спроса
            if percentage_change > 20:  # Более 20% выше среднего
                demand_status = "high"
                status_text = "ПОВЫШЕННЫЙ СПРОС"
                logger.info(f"Обнаружен повышенный спрос: {percentage_change:.1f}% выше среднего")
            elif percentage_change < -20:  # Более 20% ниже среднего
                demand_status = "low"
                status_text = "ПОНИЖЕННЫЙ СПРОС"
                logger.info(f"Обнаружен пониженный спрос: {percentage_change:.1f}% ниже среднего")
            else:  # В пределах ±20% от среднего
                demand_status = "normal"
                status_text = "ОБЫЧНЫЙ СПРОС"
                logger.info(f"Спрос в пределах нормы: {percentage_change:.1f}% от среднего")
            
            logger.info(f"Результат анализа спроса для камеры {camera_id}: текущие={current_visitors}, средние={average_visitors:.1f}, изменение={percentage_change:.1f}%, статус={status_text}")
            
            # Отправляем анализ спроса
            logger.info(f"Отправка email уведомления о спросе на {self.notification_email}...")
            email_sent = self.email_service.send_demand_analysis(
                recipient_email=self.notification_email,
                camera_id=camera_id,
                current_visitors=current_visitors,
                average_visitors=average_visitors,
                demand_status=demand_status
            )
            
            if email_sent:
                logger.info(f"Email уведомление о спросе успешно отправлено на {self.notification_email}")
            else:
                logger.error(f"Не удалось отправить email уведомление о спросе на {self.notification_email}")
            
            # Обновляем время последней проверки
            self.last_email_time[camera_id] = time.time()
            logger.debug(f"Время последней проверки для камеры {camera_id} обновлено: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(self.last_email_time[camera_id]))}")
            
            logger.info(f"Анализ спроса для камеры {camera_id} завершен успешно")
            
        except Exception as e:
            logger.error(f"Ошибка анализа спроса для камеры {camera_id}: {e}", exc_info=True)



class RTSPReader:
    """Класс для чтения RTSP потока"""
    
    def __init__(self, url: str):
        self.cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.frame = None
        self.lock = threading.Lock()
        self.running = True

        self.thread = threading.Thread(target=self.update, daemon=True)
        self.thread.start()

    def update(self):
        while self.running:
            if self.cap.isOpened():
                ret, frame = self.cap.read()
                if ret:
                   
                    with self.lock:
                        self.frame = frame
            else:
                time.sleep(1)

    def read(self):
        with self.lock:
            return self.frame.copy() if self.frame is not None else None

    def stop(self):
        self.running = False
        self.thread.join()
        self.cap.release()
