"""
CV-сервис для системы доставки продуктов питания.
Импорты torch/ultralytics — ленивые (только при первом вызове CV).
"""
from __future__ import annotations

import logging
import os
import time
from collections import Counter
from typing import Any

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Абсолютный путь к модели — ищем в корне Analytics system/
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_ANALYTICS_ROOT = os.path.normpath(os.path.join(_THIS_DIR, "..", ".."))

# Поддерживаем оба имени файла модели
def _find_model_file() -> str:
    for name in ("yolov5l6u.pt", "yolov5l6.pt", "yolov5l.pt", "yolov8l.pt"):
        path = os.path.join(_ANALYTICS_ROOT, name)
        if os.path.exists(path):
            return path
    # Fallback — первый .pt файл в директории
    try:
        pts = [f for f in os.listdir(_ANALYTICS_ROOT) if f.endswith(".pt")]
        if pts:
            return os.path.join(_ANALYTICS_ROOT, pts[0])
    except Exception:
        pass
    return os.path.join(_ANALYTICS_ROOT, "yolov5l6u.pt")

_MODEL_DEFAULT = _find_model_file()

# ── Маппинг COCO-классов на позиции меню ──────────────────────────────────────
#
# YOLO обучен на COCO (80 классов) — он не знает «бургер» или «картошка фри».
# Поэтому позиции меню KFC/фастфуд → ближайшие COCO-классы:
#
#  Бургеры, сэндвичи, шаурма, роллы, врапы  → "sandwich"
#  Хот-доги, Чикен-бургеры                  → "hot dog"
#  Пицца (слайсы)                            → "pizza"
#  Ведёрко с курицей KFC                     → "bowl" или "cup"
#  Стаканы с колой / молочными коктейлями    → "cup"
#  Бутылки с напитками                       → "bottle"
#  Пончики, десерты                          → "donut" / "cake"
#  Картофель фри (упаковка)                  → "bowl" (коробка) / "cup"
#  Соусы в мисочках                          → "bowl"
#  Яблоко, банан, апельсин (здоровое меню)   → "apple" / "banana" / "orange"
#  Морковные палочки (салаты)                → "carrot" / "broccoli"
#  Стейки, нагетсы на тарелке               → "bowl" / "dining table"
#  Суши, роллы в контейнере                  → "bowl"
#  Мороженое (вафельный стакан)              → "cup"
#  Вафли, блины на тарелке                   → "cake"
#  Столовые приборы в наборе                 → "fork" / "knife" / "spoon"

FOOD_CLASSES: set[str] = {
    # ── Прямые пищевые классы COCO ──────────────────────────────────────────
    "sandwich",        # бургеры, сэндвичи, шаурма, врапы, роллы
    "hot dog",         # хот-доги, колбасы, длинные сэндвичи
    "pizza",           # пицца, лаваш с начинкой
    "donut",           # пончики, кольца кальмаров во фритюре
    "cake",            # торты, маффины, вафли, блины, чизкейк
    "apple",           # яблоко (здоровое меню, гарнир)
    "banana",          # банан
    "orange",          # апельсин, мандарин
    "broccoli",        # брокколи, листовые салаты
    "carrot",          # морковь, морковные палочки
    # ── Тара и посуда — косвенно указывают на еду ───────────────────────────
    "bowl",            # ведёрко KFC, коробка картошки фри, миска с едой,
                       # суши-контейнер, салатница, соусница
    "cup",             # стакан с колой / молочным коктейлем / кофе,
                       # мороженое в вафельном стакане, стаканчик с соусом
    "bottle",          # бутылка воды / газировки / сока / кетчупа
    "wine glass",      # бокал (ресторанный формат)
    "fork",            # вилка в наборе приборов
    "knife",           # нож в наборе приборов
    "spoon",           # ложка, чайная ложка
    "dining table",    # стол с едой — широкий контекст «еда сервирована»
    # ── Кухонная техника — контекст пункта выдачи ───────────────────────────
    "microwave",       # микроволновка на кухне ресторана
    "oven",            # духовка / фритюрница в кадре
    "toaster",         # тостер (сэндвич-станция)
    "refrigerator",    # холодильник с напитками
}

# ── Классы для верификации фото ДОСТАВКИ ────────────────────────────────────
#
# Курьер фотографирует посылку у двери клиента.
# Что видно на снимке → COCO-класс:
#
#  Пакет с едой (крафт/термобаг)  → "handbag" / "backpack"
#  Коробка / кейс с заказом       → "suitcase"
#  Термосумка курьера              → "backpack"
#  Контейнер/судок                → "bowl"
#  Бутылка                        → "bottle"
#  Стакан                         → "cup"
#  Зонт (курьер под дождём)        → "umbrella"
#  Пакет (полиэтиленовый)          → "handbag"

PACKAGE_CLASSES: set[str] = {
    "backpack",        # термосумка, рюкзак курьера с заказом
    "handbag",         # пакет с едой (бумажный / полиэтиленовый / крафт)
    "suitcase",        # коробка, кейс, большой контейнер с заказом
    "umbrella",        # зонт — курьер стоит у двери
    "bowl",            # контейнер / судок с едой
    "bottle",          # бутылка напитка отдельно
    "cup",             # стакан / кофе-ту-гоу
}

# ── Маппинг названий позиций меню → COCO-классы ────────────────────────────
#
# Когда оператор указывает позиции заказа (напр. "Бургер", "Шаурма"),
# система ищет их в этом словаре и определяет какой COCO-класс нужно считать.
# Ключи — подстроки в нижнем регистре (сравнение через .lower() + in).

MENU_TO_COCO: dict[str, list[str]] = {
    # ── Бургеры / Сэндвичи ───────────────────────────────────────────────────
    "бургер":       ["sandwich"],
    "burger":       ["sandwich"],
    "сэндвич":      ["sandwich"],
    "sandwich":     ["sandwich"],
    "биг мак":      ["sandwich"],
    "big mac":      ["sandwich"],
    "чикен":        ["sandwich", "hot dog"],
    "chicken":      ["sandwich", "hot dog"],
    "твистер":      ["sandwich"],
    "twister":      ["sandwich"],
    "воппер":       ["sandwich"],
    "whopper":      ["sandwich"],
    "слайдер":      ["sandwich"],
    "slider":       ["sandwich"],
    "крокет":       ["sandwich"],
    # ── Шаурма / Врапы / Роллы ───────────────────────────────────────────────
    "шаурма":       ["sandwich"],
    "shawarma":     ["sandwich"],
    "дoner":        ["sandwich"],
    "донер":        ["sandwich"],
    "врап":         ["sandwich"],
    "wrap":         ["sandwich"],
    "ролл":         ["sandwich"],
    "roll":         ["sandwich"],
    # ── Хот-доги ─────────────────────────────────────────────────────────────
    "хот-дог":      ["hot dog"],
    "хотдог":       ["hot dog"],
    "hot dog":      ["hot dog"],
    "hotdog":       ["hot dog"],
    "сосиска":      ["hot dog"],
    # ── Пицца ────────────────────────────────────────────────────────────────
    "пицца":        ["pizza"],
    "pizza":        ["pizza"],
    "пиццa":        ["pizza"],
    # ── Напитки ──────────────────────────────────────────────────────────────
    "напиток":      ["cup", "bottle"],
    "drink":        ["cup", "bottle"],
    "кола":         ["cup"],
    "cola":         ["cup"],
    "пепси":        ["cup", "bottle"],
    "pepsi":        ["cup", "bottle"],
    "сок":          ["cup", "bottle"],
    "juice":        ["cup", "bottle"],
    "кофе":         ["cup"],
    "coffee":       ["cup"],
    "чай":          ["cup"],
    "tea":          ["cup"],
    "вода":         ["bottle"],
    "water":        ["bottle"],
    "молочный коктейль": ["cup"],
    "milkshake":    ["cup"],
    "смузи":        ["cup"],
    "smoothie":     ["cup"],
    "лимонад":      ["cup", "bottle"],
    # ── Картошка / Гарниры ───────────────────────────────────────────────────
    "картошка":     ["bowl", "cup"],
    "картофель":    ["bowl", "cup"],
    "фри":          ["bowl", "cup"],
    "fries":        ["bowl", "cup"],
    "гарнир":       ["bowl"],
    "side":         ["bowl"],
    "картофельные дольки": ["bowl"],
    "wedges":       ["bowl"],
    # ── Курица / Нагетсы / Крылья ────────────────────────────────────────────
    "нагетс":       ["bowl"],
    "nugget":       ["bowl"],
    "крылья":       ["bowl"],
    "wings":        ["bowl"],
    "стрипс":       ["bowl"],
    "strips":       ["bowl"],
    "кусочки":      ["bowl"],
    "pieces":       ["bowl"],
    "ведёрко":      ["bowl"],
    "bucket":       ["bowl"],
    "бокс":         ["bowl"],
    "box":          ["bowl"],
    # ── Десерты ──────────────────────────────────────────────────────────────
    "десерт":       ["donut", "cake"],
    "dessert":      ["donut", "cake"],
    "пончик":       ["donut"],
    "donut":        ["donut"],
    "торт":         ["cake"],
    "cake":         ["cake"],
    "маффин":       ["cake"],
    "muffin":       ["cake"],
    "мороженое":    ["cup"],
    "ice cream":    ["cup"],
    "мороженое":    ["cup"],
    "тарт":         ["cake"],
    # ── Салаты / Здоровое меню ───────────────────────────────────────────────
    "салат":        ["bowl"],
    "salad":        ["bowl"],
    "суп":          ["bowl"],
    "soup":         ["bowl"],
    # ── Суши / Азиатское ─────────────────────────────────────────────────────
    "суши":         ["bowl"],
    "sushi":        ["bowl"],
    "сашими":       ["bowl"],
    "sashimi":      ["bowl"],
    "роллы":        ["bowl"],
    "пад тай":      ["bowl"],
    "рамэн":        ["bowl"],
    "лапша":        ["bowl"],
    "noodle":       ["bowl"],
}

def _get_coco_classes_for_item(item_name: str) -> list[str]:
    """Возвращает список COCO-классов для данного названия позиции меню."""
    name_lower = item_name.lower()
    for key, classes in MENU_TO_COCO.items():
        if key in name_lower or name_lower in key:
            return classes
    # Если нет в словаре — считать все food-классы
    return list(FOOD_CLASSES)

CONF_THRESHOLD = 0.40
COUNT_TOLERANCE = 1

_model = None


def _get_model():
    global _model
    if _model is None:
        # Ленивый импорт — не виснет при старте uvicorn
        import torch
        from ultralytics import YOLO

        weights = os.getenv("YOLO_WEIGHTS") or _MODEL_DEFAULT
        weights = os.path.abspath(weights)
        logger.info("[CV] Ищем модель: %s", weights)
        device = "cuda:0" if torch.cuda.is_available() else "cpu"

        logger.info("[CV] Загрузка модели: %s | устройство: %s", weights, device)
        if not os.path.exists(weights):
            raise FileNotFoundError(
                f"Файл модели не найден: {weights}\n"
                f"Убедитесь что yolov5l6u.pt лежит в папке 'Analytics system/'"
            )
        t0 = time.perf_counter()
        _model = YOLO(weights)
        _model.to(device)
        if device == "cpu":
            _model.fuse()
        logger.info("[CV] Модель загружена за %.1f с", time.perf_counter() - t0)
    return _model


def _decode_image(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Не удалось декодировать изображение — проверьте формат (JPEG/PNG).")
    h, w = frame.shape[:2]
    logger.info("[CV] Изображение: %dx%d px, %d байт", w, h, len(image_bytes))
    return frame


def _run_inference(frame: np.ndarray) -> dict[str, int]:
    model = _get_model()
    t0 = time.perf_counter()
    results = model.predict(frame, conf=CONF_THRESHOLD, verbose=False)
    elapsed = time.perf_counter() - t0
    class_ids   = results[0].boxes.cls.cpu().numpy()
    class_names = results[0].names
    counts: dict[str, int] = Counter()
    for cls_id in class_ids:
        counts[class_names[int(cls_id)]] += 1
    logger.info(
        "[CV] Инференс %.2f с | объектов: %d | %s",
        elapsed, len(class_ids), dict(counts) if counts else "—"
    )
    return dict(counts)


def verify_order_completeness(
    image_bytes: bytes,
    expected_items: list[dict[str, Any]],
) -> dict[str, Any]:
    logger.info(
        "[CV] verify_order_completeness | позиции: %s",
        [(i.get("name"), i.get("quantity")) for i in expected_items]
    )
    frame    = _decode_image(image_bytes)
    detected = _run_inference(frame)

    # Умный подсчёт: для каждой позиции заказа определяем нужные COCO-классы
    item_results = []
    for item in expected_items:
        name  = item.get("name", "")
        qty   = item.get("quantity", 1)
        coco  = _get_coco_classes_for_item(name)
        found = sum(detected.get(cls, 0) for cls in coco)
        item_results.append({
            "name": name, "quantity": qty,
            "coco_classes": coco, "detected": found,
            "ok": found >= qty,
        })
        logger.info("[CV]   %s (x%d) → классы %s → найдено %d → %s",
                    name, qty, coco, found, "✅" if found >= qty else "❌")

    # Суммарная статистика
    expected_total = sum(i["quantity"] for i in item_results)
    food_detected  = sum(min(i["detected"], i["quantity"]) for i in item_results)
    missing_items  = [i for i in item_results if not i["ok"]]
    missing_count  = sum(max(0, i["quantity"] - i["detected"]) for i in missing_items)
    verified       = missing_count == 0 and food_detected > 0

    food_found  = {k: v for k, v in detected.items() if k in FOOD_CLASSES}
    logger.info("[CV] COMPLETENESS verified=%s | matched=%d expected=%d missing=%d",
                verified, food_detected, expected_total, missing_count)
    logger.info("[CV]   найдено на фото: %s", food_found or "—")
    if not food_found:
        logger.warning("[CV] food-объекты не найдены. Все: %s", detected)

    if verified:
        message = f"Заказ скомплектован: {food_detected} объект(ов), ожидалось {expected_total}."
    elif food_detected == 0:
        message = ("На фото не обнаружены объекты заказа. "
                   "Сфотографируйте заказ крупнее — блюда должны быть видны.")
    else:
        missing_names = ", ".join(
            f'{i["name"]} (×{i["quantity"] - i["detected"]})'
            for i in missing_items
        )
        message = (f"Не хватает позиций: {missing_names}. "
                   f"Обнаружено {food_detected} из {expected_total}.")

    return {
        "verified":              verified,
        "detected_objects":      detected,
        "food_objects_detected": food_detected,
        "expected_total":        expected_total,
        "missing_count":         missing_count,
        "confidence_summary":    f"порог: {CONF_THRESHOLD}, tolerance: ±{COUNT_TOLERANCE}",
        "message":               message,
    }


def verify_delivery_photo(image_bytes: bytes) -> dict[str, Any]:
    logger.info("[CV] verify_delivery_photo | %d байт", len(image_bytes))
    frame    = _decode_image(image_bytes)
    detected = _run_inference(frame)

    package_detected = any(cls in PACKAGE_CLASSES for cls in detected)
    any_obj          = len(detected) > 0
    verified         = package_detected or any_obj

    logger.info("[CV] DELIVERY verified=%s | package=%s | %s",
                verified, package_detected, detected)
    if not any_obj:
        logger.warning("[CV] Объекты не найдены на фото доставки")

    if package_detected:
        found   = [cls for cls in detected if cls in PACKAGE_CLASSES]
        message = f"Посылка подтверждена: {', '.join(found)}."
    elif any_obj:
        message = "Объект у двери обнаружен. Фото принято."
    else:
        message = "Объекты не обнаружены. Сфотографируйте посылку у двери."

    return {
       
        "verified":         verified,
        "detected_objects": detected,
        "package_detected": package_detected,
        "message":          message,
    }
