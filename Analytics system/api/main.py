from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import json
from contextlib import asynccontextmanager
import uvicorn
import logging
from typing import Dict, Any
import asyncio
import threading
import time
import psycopg2
import os
from datetime import datetime

from models import (
    DetectionStartRequest,
    DetectionStartResponse,
    DetectionStopRequest,
    DetectionStopResponse,
    DetectionStatusRequest,
    DetectionStatusResponse,
    ForecastRequest,
    ForecastResponse,
    CameraCreateRequest,
    CameraUpdateRequest,
    CameraResponse,
    CameraListResponse,
    StatusResponse,
    OrderItemRequest,
    VerifyCompletenessResponse,
    VerifyDeliveryResponse,
)
from services.detection_service import DetectionService
from services.forecast_service import ForecastService
from services.email_service import EmailService
from services.cv_order_service import verify_order_completeness, verify_delivery_photo

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Глобальные переменные для управления сервисами
detection_service = None
forecast_service = None
detection_thread = None
detection_running = False

# Отслеживание активных камер
active_cameras = {}  # {camera_id: {"thread": thread, "started_at": timestamp}}

def get_camera_data_by_id(camera_id: int) -> Dict[str, Any]:
    """Получение данных камеры из базы данных по camera_id"""
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5455")),
            dbname=os.getenv("DB_NAME", "cafeteria"),
            user=os.getenv("DB_USER", "admin"),
            password=os.getenv("DB_PASSWORD", "admin123")
        )
        cursor = connection.cursor()
        
        cursor.execute("SELECT id, name, rtsp_url FROM cameras WHERE id = %s", (camera_id,))
        result = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if result:
            return {
                "id": result[0],
                "name": result[1],
                "rtsp_url": result[2]
            }
        else:
            raise HTTPException(status_code=404, detail=f"Camera with id {camera_id} not found")
            
    except psycopg2.Error as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")
    except Exception as e:
        logger.error(f"Error getting camera data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get camera data: {str(e)}")

def get_rtsp_url_by_camera_id(camera_id: int) -> str:
    """Получение rtsp_url из базы данных по camera_id"""
    camera_data = get_camera_data_by_id(camera_id)
    return camera_data["rtsp_url"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    global detection_service, forecast_service
    
    # Инициализация сервисов
    logger.info("Инициализация сервисов...")
    detection_service = DetectionService()
    forecast_service = ForecastService()
    
    yield
    
    # Очистка ресурсов
    logger.info("Остановка сервисов...")
    global active_cameras
    
    # Останавливаем все активные камеры
    for camera_id, camera_info in active_cameras.items():
        try:
            camera_info["service"].stop_detection()
            if camera_info["thread"].is_alive():
                camera_info["thread"].join(timeout=2)
        except Exception as e:
            logger.error(f"Ошибка при остановке камеры {camera_id}: {e}")
    
    active_cameras.clear()
    
    if detection_service:
        await detection_service.cleanup()

# Создание FastAPI приложения
app = FastAPI(
    title="Analytics System API",
    description="API для системы аналитики кафетерии",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/swagger/index.html",
    redoc_url="/swagger/redoc"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене следует ограничить домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detection/start", response_model=DetectionStartResponse)
async def start_detection(request: DetectionStartRequest, background_tasks: BackgroundTasks):
    """Запуск детекции объектов на RTSP потоке"""
    global active_cameras
    
    # Проверяем, не запущена ли уже детекция для этой камеры
    if request.camera_id in active_cameras:
        raise HTTPException(status_code=400, detail=f"Detection is already running for camera {request.camera_id}")
    
    try:
        logger.info(f"Запуск детекции для камеры {request.camera_id} с интервалом {request.frame_interval_minutes} минут")
        
        # Получаем данные камеры из базы данных
        camera_data = get_camera_data_by_id(request.camera_id)
        
        # Формируем конфигурацию для детекции
        detection_config = {
            "rtsp_url": camera_data["rtsp_url"],
            "camera_id": request.camera_id,
            "frame_interval": request.frame_interval_minutes * 60,  # Конвертируем минуты в секунды
            "conf_threshold": 0.6  # Значение по умолчанию
        }
        
        logger.info(f"Конфигурация детекции: {detection_config}")
        
        # Создаем новый DetectionService для этой камеры
        camera_detection_service = DetectionService()
        
        # Настраиваем параметры email уведомлений
        if request.send_to_email:
            camera_detection_service.notification_email = request.send_to_email
            camera_detection_service.email_interval_minutes = request.email_interval_minutes
            camera_detection_service.threshold_multiplier = request.threshold_multiplier
            logger.info(f"Настроены email уведомления: {request.send_to_email}, интервал: {request.email_interval_minutes} мин, множитель: {request.threshold_multiplier}")
        
        # Запуск детекции в фоновом потоке
        detection_thread = threading.Thread(
            target=camera_detection_service.run_detection,
            args=(detection_config,),
            daemon=True
        )
        detection_thread.start()
        
        # Сохраняем информацию о запущенной камере
        active_cameras[request.camera_id] = {
            "thread": detection_thread,
            "service": camera_detection_service,
            "started_at": datetime.now(),
            "config": detection_config
        }
        
        return DetectionStartResponse(
            status="started",
            message=f"Object detection started successfully for camera {request.camera_id} ({camera_data['name']})",
            request_id=f"det_{int(time.time())}"
        )
        
    except Exception as e:
        logger.error(f"Ошибка при запуске детекции: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start detection: {str(e)}")


@app.post("/detection/stop", response_model=DetectionStopResponse)
async def stop_detection(request: DetectionStopRequest):
    """Остановка детекции объектов"""
    global active_cameras
    
    # Проверяем, запущена ли детекция для этой камеры
    if request.camera_id not in active_cameras:
        raise HTTPException(status_code=400, detail=f"Detection is not running for camera {request.camera_id}")
    
    try:
        logger.info(f"Остановка детекции для камеры {request.camera_id}...")
        
        # Получаем данные камеры из базы данных для логирования
        camera_data = get_camera_data_by_id(request.camera_id)
        
        # Получаем информацию о запущенной камере
        camera_info = active_cameras[request.camera_id]
        
        # Останавливаем детекцию для этой камеры
        camera_info["service"].stop_detection()
        
        # Ждем завершения потока
        if camera_info["thread"].is_alive():
            logger.info(f"Ожидание завершения потока для камеры {request.camera_id}...")
            camera_info["thread"].join(timeout=10)  # Увеличиваем timeout до 10 секунд
            
            # Проверяем, завершился ли поток
            if camera_info["thread"].is_alive():
                logger.warning(f"Поток для камеры {request.camera_id} не завершился в течение 10 секунд")
            else:
                logger.info(f"Поток для камеры {request.camera_id} успешно завершен")
        
        # Удаляем камеру из активных
        del active_cameras[request.camera_id]
        logger.info(f"Камера {request.camera_id} удалена из активных камер")
        
        return DetectionStopResponse(
            status="stopped",
            message=f"Object detection stopped successfully for camera {request.camera_id} ({camera_data['name']})"
        )
        
    except Exception as e:
        logger.error(f"Ошибка при остановке детекции: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to stop detection: {str(e)}")


@app.post("/detection/status", response_model=DetectionStatusResponse)
async def get_detection_status(request: DetectionStatusRequest):
    """Получение статуса детекции для конкретной камеры"""
    global active_cameras
    
    try:
        # Получаем данные камеры из базы данных
        camera_data = get_camera_data_by_id(request.camera_id)
        
        # Проверяем, активна ли детекция для этой камеры
        is_running = request.camera_id in active_cameras
        
        # Определяем статус детекции
        if is_running:
            camera_info = active_cameras[request.camera_id]
            # Проверяем, жив ли поток
            thread_alive = camera_info["thread"].is_alive()
            status = "active" if thread_alive else "stopped"
        else:
            status = "inactive"
        
        return DetectionStatusResponse(
            camera_id=request.camera_id,
            camera_name=camera_data["name"],
            running=is_running and thread_alive if is_running else False,
            status=status,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Ошибка при получении статуса детекции: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get detection status: {str(e)}")

@app.post("/forecast/generate", response_model=ForecastResponse)
async def generate_forecast(request: ForecastRequest):
    """Генерация прогноза посещений"""
    try:
        logger.info(f"Генерация прогноза с параметрами: {request.dict()}")
        
        result = await forecast_service.generate_forecast(request.dict())
        
        return ForecastResponse(
            status="completed",
            message="Forecast generated successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Ошибка при генерации прогноза: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate forecast: {str(e)}")


@app.post("/cameras", response_model=CameraResponse)
async def create_camera(camera_data: CameraCreateRequest):
    """Создание новой камеры"""
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5455")),
            dbname=os.getenv("DB_NAME", "cafeteria"),
            user=os.getenv("DB_USER", "admin"),
            password=os.getenv("DB_PASSWORD", "admin123")
        )
        cursor = connection.cursor()
        
        # Проверяем, не существует ли уже камера с таким RTSP URL (если указан)
        if camera_data.rtsp_url:
            cursor.execute("SELECT id FROM cameras WHERE rtsp_url = %s", (camera_data.rtsp_url,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Camera with this RTSP URL already exists")
        
        # Создаем новую камеру
        cursor.execute(
            """
            INSERT INTO cameras (name, venue_id, rtsp_url, created_at)
            VALUES (%s, %s, %s, now())
            RETURNING id, name, venue_id, rtsp_url, created_at
            """,
            (
                camera_data.name,
                camera_data.venue_id,
                camera_data.rtsp_url
            )
        )
        
        result = cursor.fetchone()
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return CameraResponse(
            id=result[0],
            name=result[1],
            venue_id=result[2],
            rtsp_url=result[3],
            created_at=result[4]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка при создании камеры: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create camera: {str(e)}")


@app.get("/cameras", response_model=CameraListResponse)
async def get_cameras():
    """Получение списка всех камер"""
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5455")),
            dbname=os.getenv("DB_NAME", "cafeteria"),
            user=os.getenv("DB_USER", "admin"),
            password=os.getenv("DB_PASSWORD", "admin123")
        )
        cursor = connection.cursor()
        
        cursor.execute(
            """
            SELECT id, name, venue_id, rtsp_url, created_at
            FROM cameras
            ORDER BY created_at DESC
            """
        )
        
        results = cursor.fetchall()
        cameras = []
        
        for result in results:
            cameras.append(CameraResponse(
                id=result[0],
                name=result[1],
                venue_id=result[2],
                rtsp_url=result[3],
                created_at=result[4]
            ))
        
        cursor.close()
        connection.close()
        
        return CameraListResponse(
            status="success",
            message=f"Found {len(cameras)} cameras",
            cameras=cameras
        )
        
    except Exception as e:
        logger.error(f"Ошибка при получении списка камер: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cameras: {str(e)}")


@app.get("/cameras/{camera_id}", response_model=CameraResponse)
async def get_camera(camera_id: int):
    """Получение камеры по ID"""
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5455")),
            dbname=os.getenv("DB_NAME", "cafeteria"),
            user=os.getenv("DB_USER", "admin"),
            password=os.getenv("DB_PASSWORD", "admin123")
        )
        cursor = connection.cursor()
        
        cursor.execute(
            """
            SELECT id, name, venue_id, rtsp_url, created_at
            FROM cameras
            WHERE id = %s
            """,
            (camera_id,)
        )
        
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        cursor.close()
        connection.close()
        
        return CameraResponse(
            id=result[0],
            name=result[1],
            venue_id=result[2],
            rtsp_url=result[3],
            created_at=result[4]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка при получении камеры {camera_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get camera: {str(e)}")


@app.put("/cameras/{camera_id}", response_model=CameraResponse)
async def update_camera(camera_id: int, camera_data: CameraUpdateRequest):
    """Обновление камеры"""
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5455")),
            dbname=os.getenv("DB_NAME", "cafeteria"),
            user=os.getenv("DB_USER", "admin"),
            password=os.getenv("DB_PASSWORD", "admin123")
        )
        cursor = connection.cursor()
        
        # Проверяем существование камеры
        cursor.execute("SELECT id FROM cameras WHERE id = %s", (camera_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Если обновляется RTSP URL, проверяем уникальность
        if camera_data.rtsp_url:
            cursor.execute("SELECT id FROM cameras WHERE rtsp_url = %s AND id != %s", (camera_data.rtsp_url, camera_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Camera with this RTSP URL already exists")
        
        # Формируем запрос обновления
        update_fields = []
        update_values = []
        
        if camera_data.name is not None:
            update_fields.append("name = %s")
            update_values.append(camera_data.name)
        
        if camera_data.venue_id is not None:
            update_fields.append("venue_id = %s")
            update_values.append(camera_data.venue_id)
        
        if camera_data.rtsp_url is not None:
            update_fields.append("rtsp_url = %s")
            update_values.append(camera_data.rtsp_url)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_values.append(camera_id)
        
        query = f"""
            UPDATE cameras 
            SET {', '.join(update_fields)}
            WHERE id = %s
            RETURNING id, name, venue_id, rtsp_url, created_at
        """
        
        cursor.execute(query, update_values)
        result = cursor.fetchone()
        
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return CameraResponse(
            id=result[0],
            name=result[1],
            venue_id=result[2],
            rtsp_url=result[3],
            created_at=result[4]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка при обновлении камеры {camera_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update camera: {str(e)}")


@app.get("/cameras/venue/{venue_id}", response_model=CameraListResponse)
async def get_cameras_by_venue(venue_id: str):
    """Получение камер по venue_id"""
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5455")),
            dbname=os.getenv("DB_NAME", "cafeteria"),
            user=os.getenv("DB_USER", "admin"),
            password=os.getenv("DB_PASSWORD", "admin123")
        )
        cursor = connection.cursor()
        
        cursor.execute(
            """
            SELECT id, name, venue_id, rtsp_url, created_at
            FROM cameras
            WHERE venue_id = %s
            ORDER BY created_at DESC
            """,
            (venue_id,)
        )
        
        results = cursor.fetchall()
        cameras = []
        
        for result in results:
            cameras.append(CameraResponse(
                id=result[0],
                name=result[1],
                venue_id=result[2],
                rtsp_url=result[3],
                created_at=result[4]
            ))
        
        cursor.close()
        connection.close()
        
        return CameraListResponse(
            status="success",
            message=f"Found {len(cameras)} cameras for venue {venue_id}",
            cameras=cameras
        )
        
    except Exception as e:
        logger.error(f"Ошибка при получении камер для venue {venue_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cameras for venue: {str(e)}")


@app.delete("/cameras/{camera_id}")
async def delete_camera(camera_id: int):
    """Удаление камеры"""
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5455")),
            dbname=os.getenv("DB_NAME", "cafeteria"),
            user=os.getenv("DB_USER", "admin"),
            password=os.getenv("DB_PASSWORD", "admin123")
        )
        cursor = connection.cursor()
        
        # Проверяем существование камеры
        cursor.execute("SELECT id FROM cameras WHERE id = %s", (camera_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Camera not found")
        
        # Удаляем камеру
        cursor.execute("DELETE FROM cameras WHERE id = %s", (camera_id,))
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return {"status": "success", "message": f"Camera {camera_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка при удалении камеры {camera_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete camera: {str(e)}")



# ── CV Order Endpoints ───────────────────────────────────────────────────────

@app.post("/order/verify-completeness", response_model=VerifyCompletenessResponse)
async def verify_order_completeness_endpoint(
    image: UploadFile = File(..., description="Фото собранного заказа (JPEG/PNG)"),
    order_items: str = Form(..., description='JSON-массив позиций: [{"name":"Бургер","quantity":2}]'),
):
    """
    Верифицирует комплектность заказа по фотографии.
    CV-модель подсчитывает видимые food-объекты и сравнивает с составом заказа.
    Если объектов недостаточно — возвращает verified=false и статус заказа
    не может быть переведён в Ready.
    """
    try:
        items_data = json.loads(order_items)
        expected_items = [OrderItemRequest(**item) for item in items_data]
    except Exception:
        raise HTTPException(
            status_code=422,
            detail='order_items должен быть валидным JSON-массивом вида [{"name":"Бургер","quantity":1}]',
        )

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=422, detail="Файл изображения пустой.")

    try:
        result = verify_order_completeness(
            image_bytes,
            [item.dict() for item in expected_items],
        )
        logger.info(
            "verify-completeness: verified=%s, detected=%d, expected=%d",
            result["verified"], result["food_objects_detected"], result["expected_total"],
        )
        return VerifyCompletenessResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Ошибка верификации комплектности заказа")
        raise HTTPException(status_code=500, detail=f"CV ошибка: {e}")


@app.post("/order/verify-delivery", response_model=VerifyDeliveryResponse)
async def verify_delivery_endpoint(
    image: UploadFile = File(..., description="Фото у двери клиента (JPEG/PNG)"),
):
    """
    Верифицирует фото доставки курьера.
    CV-модель проверяет наличие объекта (пакет/посылка) в кадре.
    При отсутствии объекта — verified=false, курьер должен переснять фото.
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=422, detail="Файл изображения пустой.")

    try:
        result = verify_delivery_photo(image_bytes)
        logger.info(
            "verify-delivery: verified=%s, package=%s, objects=%s",
            result["verified"], result["package_detected"],
            list(result["detected_objects"].keys()),
        )
        return VerifyDeliveryResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Ошибка верификации фото доставки")
        raise HTTPException(status_code=500, detail=f"CV ошибка: {e}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000")),
        reload=os.getenv("API_RELOAD", "true").lower() == "true",
        log_level=os.getenv("API_LOG_LEVEL", "info")
    )
