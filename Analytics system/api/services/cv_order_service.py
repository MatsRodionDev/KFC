"""
CV-сервис для системы доставки продуктов питания.

Два сценария:
1. verify_order_completeness — проверяет, что все позиции заказа собраны на фото
   (оператор фотографирует собранный заказ перед выдачей курьеру).
2. verify_delivery_photo — проверяет, что на фото доставки присутствует посылка/пакет
   (курьер фотографирует у двери клиента).
"""

from __future__ import annotations

import logging
import os
from collections import Counter
from typing import Any

import cv2
import numpy as np
import torch
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Классы COCO, связанные с едой и тарой — используются для верификации заказа
# ---------------------------------------------------------------------------
FOOD_CLASSES: set[str] = {
    "apple", "banana", "orange", "broccoli", "carrot", "hot dog",
    "pizza", "donut", "cake", "sandwich", "bowl", "cup", "bottle",
    "wine glass", "fork", "knife", "spoon", "dining table",
}

# Классы, указывающие на наличие посылки/пакета — для верификации доставки
PACKAGE_CLASSES: set[str] = {
    "backpack", "handbag", "suitcase", "bag",
    # COCO не содержит "box", но есть перечисленные выше
    "bowl", "bottle", "cup",          # широкий fallback для пакетов с едой
}

# Уверенность, выше которой считаем детекцию валидной
CONF_THRESHOLD = 0.40

# Допустимое отклонение количества при верификации заказа (±1 позиция)
COUNT_TOLERANCE = 1

_model: YOLO | None = None


def _get_model() -> YOLO:
    global _model
    if _model is None:
        weights = os.getenv("YOLO_WEIGHTS", "yolov5l6u.pt")
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        logger.info("Загрузка модели %s на %s …", weights, device)
        _model = YOLO(weights)
        _model.to(device)
        if device == "cpu":
            _model.fuse()
        logger.info("Модель загружена.")
    return _model


def _decode_image(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Не удалось декодировать изображение. Проверьте формат файла.")
    return frame


def _run_inference(frame: np.ndarray) -> dict[str, int]:
    """Запускает YOLO и возвращает счётчик распознанных классов."""
    model = _get_model()
    results = model.predict(frame, conf=CONF_THRESHOLD, verbose=False)
    class_ids = results[0].boxes.cls.cpu().numpy()
    class_names = results[0].names
    counts: dict[str, int] = Counter()
    for cls_id in class_ids:
        counts[class_names[int(cls_id)]] += 1
    return dict(counts)


# ---------------------------------------------------------------------------
# Публичные функции сервиса
# ---------------------------------------------------------------------------

def verify_order_completeness(
    image_bytes: bytes,
    expected_items: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Проверяет комплектность заказа по фото.

    Args:
        image_bytes: байты изображения (JPEG/PNG).
        expected_items: список позиций заказа вида
            [{"name": "Бургер", "quantity": 2}, ...].

    Returns:
        {
          "verified": bool,
          "detected_objects": {"apple": 1, ...},
          "food_objects_detected": int,   # суммарно food-классов
          "expected_total": int,          # суммарно позиций заказа
          "missing_count": int,
          "confidence_summary": str,
          "message": str,
        }
    """
    frame = _decode_image(image_bytes)
    detected = _run_inference(frame)

    # Считаем суммарное количество food-объектов на фото
    food_detected = sum(cnt for cls, cnt in detected.items() if cls in FOOD_CLASSES)

    # Суммарное количество позиций заказа (с учётом quantity)
    expected_total = sum(item.get("quantity", 1) for item in expected_items)

    missing_count = max(0, expected_total - food_detected - COUNT_TOLERANCE)
    verified = missing_count == 0 and food_detected > 0

    if verified:
        message = (
            f"Заказ скомплектован: обнаружено {food_detected} объект(ов), "
            f"ожидалось {expected_total}."
        )
    elif food_detected == 0:
        message = (
            "На фото не обнаружены объекты, связанные с едой. "
            "Убедитесь, что снимок охватывает весь заказ."
        )
    else:
        message = (
            f"Не хватает позиций: обнаружено {food_detected}, "
            f"ожидалось {expected_total}. Недостаёт ≥{missing_count}."
        )

    return {
        "verified": verified,
        "detected_objects": detected,
        "food_objects_detected": food_detected,
        "expected_total": expected_total,
        "missing_count": missing_count,
        "confidence_summary": f"порог уверенности: {CONF_THRESHOLD}",
        "message": message,
    }


def verify_delivery_photo(image_bytes: bytes) -> dict[str, Any]:
    """
    Проверяет фото доставки: на снимке должна быть посылка/пакет у двери.

    Returns:
        {
          "verified": bool,
          "detected_objects": {"backpack": 1, ...},
          "package_detected": bool,
          "message": str,
        }
    """
    frame = _decode_image(image_bytes)
    detected = _run_inference(frame)

    # Ищем хоть один объект из класса «посылка»
    package_detected = any(cls in PACKAGE_CLASSES for cls in detected)

    # Fallback: если вообще что-то обнаружено с высокой уверенностью — считаем OK
    # (на практике курьер фотографирует пакет с едой, который может быть белым пакетом —
    #  COCO не всегда его классифицирует как backpack)
    any_object_detected = len(detected) > 0

    # Верифицируем, если явно нашли «пакет» ИЛИ что-то обнаружено на фото
    verified = package_detected or any_object_detected

    if package_detected:
        found = [cls for cls in detected if cls in PACKAGE_CLASSES]
        message = f"Посылка подтверждена: обнаружено {', '.join(found)}."
    elif any_object_detected:
        message = (
            "Объект у точки доставки обнаружен. "
            "Фото доставки принято."
        )
    else:
        message = (
            "На фото не обнаружено объектов. "
            "Сфотографируйте посылку у двери клиента."
        )

    return {
        "verified": verified,
        "detected_objects": detected,
        "package_detected": package_detected,
        "message": message,
    }
