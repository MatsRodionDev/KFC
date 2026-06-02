FROM python:3.11-slim

WORKDIR /app

# Зависимости (torch устанавливается отдельно — CPU версия)
COPY api/requirements.txt .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

COPY api/ ./api/

# YOLO модель монтируется через volume (слишком большая для образа)
ENV YOLO_WEIGHTS=/app/yolov5l6u.pt

EXPOSE 8000
WORKDIR /app/api
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
