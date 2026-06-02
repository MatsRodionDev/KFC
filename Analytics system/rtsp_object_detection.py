from __future__ import annotations

import sys
import time
from collections import Counter
from typing import Dict, Tuple
import threading

import cv2
import torch
from ultralytics import YOLO

import psycopg2
from datetime import datetime

###############################################################################
# CONFIG (can also be overridden from CLI) ####################################
###############################################################################
RTSP_URL = (
    "rtsp://192.168.100.2:8554/live"
)

MODEL_WEIGHTS = "yolov5l6.pt"  # ultralytics provides several sizes: n/s/m/l/x
FRAME_INTERVAL_SEC_DEFAULT = 3  # seconds between processed frames
DISPLAY_SCALE_DEFAULT = 0.4       # 1.0 = original size, 0.5 = 50 %, etc.
CONF_THRESHOLD = 0.6             # confidence threshold for detections
# Auto-select GPU if available, else CPU
DEVICE = "cuda:0" if torch.cuda.is_available() else "cpu"

#DB_HOST = "timescaledb"
DB_HOST = "localhost"
DB_PORT = 5455
DB_NAME = "cafeteria"
DB_USER = "admin"
DB_PASSWORD = "admin123"

CAMERA_ID = 1

top_crop = 500
bottom_crop = 800
###############################################################################

class RTSPReader:
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
        

def parse_cli() -> Tuple[float, float]:
    """Allow optional CLI args: <interval> <scale>."""
    interval = FRAME_INTERVAL_SEC_DEFAULT
    scale = DISPLAY_SCALE_DEFAULT

    if len(sys.argv) >= 2:
        try:
            interval = float(sys.argv[1])
        except ValueError:
            print("[WARN] Invalid interval arg, using default 1 s.")
    if len(sys.argv) >= 3:
        try:
            scale = float(sys.argv[2])
        except ValueError:
            print("[WARN] Invalid scale arg, using default 1.0.")
    return max(interval, 0.05), max(scale, 0.05)


def draw_detections(frame, boxes, class_ids, class_names) -> Dict[str, int]:
    """Draw bounding boxes & labels on the frame. Return object counts."""
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


def flush_rtsp_buffer(cap, flush_time: float = 0.3):
    """Grab frames for *flush_time* seconds to clear the decoder buffer."""
    end = time.time() + flush_time
    while time.time() < end:
        cap.grab()


# def main():
    interval, scale = parse_cli()
    print(
        f"Using device: {DEVICE}  |  Interval: {interval:.2f} s  |  Display scale: {scale}"
    )

    # Load model
    model = YOLO(MODEL_WEIGHTS)
    model.to(DEVICE)
    if DEVICE == "cpu":
        model.fuse()

    # Open RTSP stream (FFMPEG backend) with minimal buffer
    reader = RTSPReader(RTSP_URL)
    # Attempt to shrink internal buffer so we always get the latest frame


    print("Press 'q' in the window to exit.\n")

    while True:
        t_start = time.time()

        # Flush any accumulated frames so we get the freshest frame
        frame = reader.read()
        if frame is None:
            print("[WARN] Кадр ещё не получен — подождём…")
            time.sleep(0.1)
            continue
            
        original_frame = frame.copy()
        frame = frame[top_crop:, :]  # Crop from the top
        frame = frame[:-bottom_crop, :]  # Crop from the bottom

        # Inference
        results = model.predict(frame, conf=CONF_THRESHOLD, verbose=False)
        boxes = results[0].boxes.xyxy.cpu().numpy()
        class_ids = results[0].boxes.cls.cpu().numpy()
        class_names = results[0].names

        # Draw & count
        counts = draw_detections(original_frame, boxes, class_ids, class_names)

        # Formatted console output
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"\n=== {timestamp} =============================")
        if counts:
            for cls, n in sorted(counts.items()):
                print(f"{cls}: {n}")
        else:
            print("No objects detected.")

        # Resize for display if needed
        frame_disp = (
            cv2.resize(original_frame, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
            if scale != 1.0
            else original_frame
        )
        cv2.imshow("RTSP Object Detection", frame_disp)

        # Handle quit key during display period
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

        # Sleep remainder to reach target interval (taking processing time into account)
        elapsed = time.time() - t_start
        remaining = interval - elapsed
        while remaining > 0:
            if cv2.waitKey(1) & 0xFF == ord("q"):
                cv2.destroyAllWindows()
                return
            time.sleep(min(0.05, remaining))
            remaining = interval - (time.time() - t_start)

    reader.stop()
    cv2.destroyAllWindows()
def main():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()

    interval, scale = parse_cli()
    print(
        f"Using device: {DEVICE}  |  Interval: {interval:.2f} s  |  Display scale: {scale}"
    )

    # Load model
    model = YOLO(MODEL_WEIGHTS)
    model.to(DEVICE)
    if DEVICE == "cpu":
        model.fuse()

    reader = RTSPReader(RTSP_URL)
    print("Press 'q' in the window to exit.\n")

    while True:
        t_start = time.time()
        frame = reader.read()

        if frame is None:
            print("[WARN] Кадр ещё не получен — подождём…")
            time.sleep(0.1)
            continue

        original_frame = frame.copy()
        h, w, _ = frame.shape

        # Check if cropping is possible
        if h > (top_crop + bottom_crop):
            frame = frame[top_crop:h-bottom_crop, :]
        else:
            print(f"[WARN] Кадр ({h}px) меньше, чем top_crop+bottom_crop ({top_crop+bottom_crop}px). Используем полный кадр без кропа.")
            frame = frame  # Leave as is

        # Inference
        results = model.predict(frame, conf=CONF_THRESHOLD, verbose=False)
        boxes = results[0].boxes.xyxy.cpu().numpy()
        class_ids = results[0].boxes.cls.cpu().numpy()
        class_names = results[0].names

        # Draw & count
        counts = draw_detections(original_frame, boxes, class_ids, class_names)

        # Take only people
        num_people = counts.get("person", 0)

        # Save people count to db
        ts = datetime.utcnow()
        cursor.execute(
            """
            INSERT INTO visitors_count (camera_id, ts, visitors)
            VALUES (%s, %s, %s)
            """,
            (CAMERA_ID, ts, num_people)
        )
        conn.commit()

        # Console output
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"\n=== {timestamp} =============================")
        if counts:
            for cls, n in sorted(counts.items()):
                print(f"{cls}: {n}")
        else:
            print("No objects detected.")

        # Resize for display if needed
        frame_disp = (
            cv2.resize(original_frame, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
            if scale != 1.0
            else original_frame
        )
        cv2.imshow("RTSP Object Detection", frame_disp)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

        # Sleep remainder to reach target interval
        elapsed = time.time() - t_start
        remaining = interval - elapsed
        while remaining > 0:
            if cv2.waitKey(1) & 0xFF == ord("q"):
                cv2.destroyAllWindows()
                return
            time.sleep(min(0.05, remaining))
            remaining = interval - (time.time() - t_start)

    reader.stop()
    cv2.destroyAllWindows()
    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()