import pandas as pd
import psycopg2
from prophet import Prophet
import datetime
import os
import smtplib
from email.mime.text import MIMEText
import google.generativeai as genai
from sqlalchemy import create_engine
import logging

# --- Конфиг ---
# DB_HOST = os.getenv("DB_HOST", "timescaledb")
# DB_PORT = os.getenv("DB_PORT", "5432")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5433")
DB_NAME = os.getenv("DB_NAME", "cafeteria")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASS", "admin123")

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))

SMTP_USER = "kkochin2528@gmail.com"
SMTP_PASS = "astt rlmb onji xvwm"
EMAIL_TO = "mikhail.kochyn@innowise.com"

GEMINI_API_KEY = "AIzaSyAqlIbkALELdtNcmAqEBKycoQZMqFV6cqQ"

# SMTP_USER = os.getenv("SMTP_USER", "kkochin2528@gmail.com")
# SMTP_PASS = os.getenv("SMTP_PASS", "astt rlmb onji xvwm")
# EMAIL_TO = os.getenv("EMAIL_TO", "mikhail.kochyn@innowise.com")

# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyAqlIbkALELdtNcmAqEBKycoQZMqFV6cqQ")


# --- Настройка логирования ---
logging.basicConfig(
    level=logging.DEBUG,  # DEBUG уровень, чтобы видеть все логи
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()               # лог в консоль
    ]
)

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

def send_email(subject: str, body: str):
    logging.debug(f"Отправка email: {subject}")
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = EMAIL_TO

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [EMAIL_TO], msg.as_string())
    logging.info("Email успешно отправлен")

def get_data():
    logging.debug("Подключение к БД и выполнение SQL запроса")
    conn_str = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(conn_str)
    query = """
        SELECT ts, visitors, camera_id, day_name
        FROM visitors_count
        WHERE ts >= now() - interval '60 days'
        ORDER BY ts;
    """
    df = pd.read_sql(query, engine)
    logging.debug(f"Получено {len(df)} строк из базы данных")
    logging.debug(f"Пример данных:\n{df.head()}")
    return df

def forecast_camera(df, camera_id, days_ahead=3, holidays_list=None, events_list=None):
    logging.debug(f"Создание прогноза для камеры {camera_id}")
    
    camera_df = df[df["camera_id"] == camera_id][["ts", "visitors"]].copy()
    camera_df = camera_df.rename(columns={"ts": "ds", "visitors": "y"})
    camera_df["ds"] = camera_df["ds"].dt.tz_localize(None)
    
    camera_df["hour"] = camera_df["ds"].dt.hour
    camera_df["day_of_week"] = camera_df["ds"].dt.dayofweek
    camera_df["month"] = camera_df["ds"].dt.month
    camera_df["is_weekend"] = camera_df["day_of_week"] >= 5
    camera_df["is_holiday"] = (
        camera_df["ds"].dt.date.isin(holidays_list).astype(int) if holidays_list else 0
    )
    camera_df["is_special_event"] = (
        camera_df["ds"].dt.date.isin(events_list).astype(int) if events_list else 0
    )
    
    if len(camera_df) < 50:
        logging.warning(f"Недостаточно данных для камеры {camera_id}, пропуск")
        return None
    
    model_prophet = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=True)
    model_prophet.add_regressor("hour")
    model_prophet.add_regressor("day_of_week")
    model_prophet.add_regressor("month")
    model_prophet.add_regressor("is_weekend")
    model_prophet.add_regressor("is_holiday")
    model_prophet.add_regressor("is_special_event")
    
    model_prophet.fit(camera_df)

    future = model_prophet.make_future_dataframe(periods=days_ahead * 24, freq="H")
    future["hour"] = future["ds"].dt.hour
    future["day_of_week"] = future["ds"].dt.dayofweek
    future["month"] = future["ds"].dt.month
    future["is_weekend"] = future["day_of_week"] >= 5
    future["is_holiday"] = (
        future["ds"].dt.date.isin(holidays_list).astype(int) if holidays_list else 0
    )
    future["is_special_event"] = (
        future["ds"].dt.date.isin(events_list).astype(int) if events_list else 0
    )

    forecast = model_prophet.predict(future)
    return forecast


def generate_summary(camera_id, forecast, df, days_ahead=3):
    today = datetime.date.today()
    history = df[df['camera_id']==camera_id].groupby('day_name')['visitors'].mean().to_dict()

    today_forecast = forecast[forecast["ds"].dt.date == today]
    if not today_forecast.empty:
        avg_today = today_forecast["yhat"].mean()
        peak_today = today_forecast.loc[today_forecast["yhat"].idxmax()]
        peak_time_today = peak_today["ds"].strftime("%H:%M")
        today_summary = f"""
Сегодня ({today.strftime("%A, %d.%m.%Y")}):
- Среднее посещение: {avg_today:.1f}
- Пик ожидается в {peak_time_today} ≈ {peak_today['yhat']:.1f}
"""
    else:
        today_summary = "Сегодня прогноз недоступен."

    next_days_summary_list = []
    for i in range(1, days_ahead + 1):
        target_date = today + datetime.timedelta(days=i)
        day_forecast = forecast[forecast["ds"].dt.date == target_date]
        if day_forecast.empty:
            continue
        avg_day = day_forecast["yhat"].mean()
        peak_day = day_forecast.loc[day_forecast["yhat"].idxmax()]
        peak_time_day = peak_day["ds"].strftime("%H:%M")
        day_name = target_date.strftime("%A")
        next_days_summary_list.append(
            f"{day_name} ({target_date.strftime('%d.%m.%Y')}): среднее {avg_day:.1f}, пик в {peak_time_day} ≈ {peak_day['yhat']:.1f}"
        )

    next_days_summary = "\n".join(next_days_summary_list) if next_days_summary_list else "Прогноз на следующие дни недоступен."

    context = f"""
Камера: {camera_id}

Историческая статистика по дням недели (средние значения):
{history}

Прогноз на сегодня:
{today_summary}

Прогноз на следующие {days_ahead} дней:
{next_days_summary}
"""

    prompt = f"""
Ты аналитик сети кафетерий.
Сначала дай детальный прогноз на сегодня для менеджера: основные часы пик, средние значения, что важно учесть.
Затем дай краткий обзор по следующим дням (средние и пики), выдели, если какие-то дни заметно выше или ниже обычного.
Не перегружай цифрами, делай текст понятным и удобным для чтения.
Данные для анализа:
{context}
"""

    logging.debug(f"Генерация текста через Gemini для камеры {camera_id}")
    response = model.generate_content(prompt)
    logging.debug(f"Ответ Gemini:\n{response.text[:300]}...")
    return response.text

def main():
    logging.info("Запуск прогнозирования")
    df = get_data()
    messages = []

    for camera_id in df["camera_id"].unique():
        logging.info(f"Обработка камеры {camera_id}")
        today_forecast = forecast_camera(df, camera_id)
        if today_forecast is None:
            continue
        summary = generate_summary(camera_id, today_forecast, df)
        messages.append(summary)

    subject = "Прогноз посетителей на сегодня"
    body = "\n\n".join(messages) if messages else "Недостаточно данных для прогноза"
    logging.info("Формирование и отправка итогового письма")
    send_email(subject, body)
    logging.info("Работа скрипта завершена")

if __name__ == "__main__":
    main()