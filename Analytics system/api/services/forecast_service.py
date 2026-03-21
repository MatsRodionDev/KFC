import os
import logging
import asyncio
import pandas as pd
import psycopg2
from prophet import Prophet
import datetime
from .email_service import EmailService
import google.generativeai as genai
from sqlalchemy import create_engine
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class ForecastService:
    """Сервис для генерации прогнозов посещений"""
    
    def __init__(self):
        # Переменные окружения для базы данных
        self.db_host = os.getenv("DB_HOST", "localhost")
        self.db_port = os.getenv("DB_PORT", "5433")
        self.db_name = os.getenv("DB_NAME", "cafeteria")
        self.db_user = os.getenv("DB_USER", "admin")
        self.db_password = os.getenv("DB_PASS", "admin123")
        
        # Конфигурация БД для совместимости
        self.db_config = {
            'host': self.db_host,
            'port': self.db_port,
            'name': self.db_name,
            'user': self.db_user,
            'password': self.db_password
        }
        
        # Email сервис
        self.email_service = EmailService()
        
        # Email по умолчанию для прогнозов
        self.default_email = "mishaa2528@gmail.com"
        
        # Переменные окружения для Gemini
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "AIzaSyAqlIbkALELdtNcmAqEBKycoQZMqFV6cqQ")
        
        # Инициализация Gemini
        genai.configure(api_key=self.gemini_api_key)
        # self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        self.gemini_model = genai.GenerativeModel("gemini-2.5-flash")
    
    async def generate_forecast(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Генерация прогноза посещений"""
        try:
            logger.info("Начало генерации прогноза...")
            
            # Получение данных
            df = await self._get_data()
            if df.empty:
                raise Exception("Нет данных для прогноза")
            
            # Параметры из конфига
            camera_id = config.get('camera_id')
            days_ahead = config.get('days_ahead', 3)
            send_email = config.get('send_email', True)
            email_to = config.get('email')
            
            results = []
            messages = []
            
            # Определяем камеры для обработки
            cameras_to_process = [camera_id] if camera_id else df["camera_id"].unique()
            
            for cam_id in cameras_to_process:
                logger.info(f"Обработка камеры {cam_id}")
                
                # Генерация прогноза для камеры
                forecast = await self._forecast_camera(df, cam_id, days_ahead)
                if forecast is None:
                    logger.warning(f"Недостаточно данных для камеры {cam_id}")
                    continue
                
                # Генерация текстового описания
                summary = await self._generate_summary(cam_id, forecast, df, days_ahead)
                
                # Подготовка данных для ответа
                camera_result = {
                    'camera_id': cam_id,
                    'forecast_summary': summary,
                    'predictions': self._format_predictions(forecast, days_ahead),
                    'historical_stats': self._get_historical_stats(df, cam_id)
                }
                
                results.append(camera_result)
                messages.append(summary)
            
            # Отправка email если требуется
            if send_email and messages:
                await self._send_email(messages, email_to)
            
            return {
                'forecasts': results,
                'total_cameras': len(results),
                'generated_at': datetime.datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Ошибка при генерации прогноза: {e}")
            raise
    
    async def _get_data(self) -> pd.DataFrame:
        """Получение данных из базы данных"""
        try:
            conn_str = f"postgresql+psycopg2://{self.db_config['user']}:{self.db_config['password']}@{self.db_config['host']}:{self.db_config['port']}/{self.db_config['name']}"
            engine = create_engine(conn_str)
            
            query = """
                SELECT ts, visitors, camera_id, day_name
                FROM visitors_count
                ORDER BY ts;
            """
            
            df = pd.read_sql(query, engine)
            logger.info(f"Получено {len(df)} строк из базы данных")
            return df
            
        except Exception as e:
            logger.error(f"Ошибка получения данных: {e}")
            raise
    
    async def _forecast_camera(self, df: pd.DataFrame, camera_id: int, days_ahead: int = 3) -> Optional[pd.DataFrame]:
        """Создание прогноза для конкретной камеры"""
        try:
            camera_df = df[df["camera_id"] == camera_id][["ts", "visitors"]].copy()
            camera_df = camera_df.rename(columns={"ts": "ds", "visitors": "y"})
            camera_df["ds"] = camera_df["ds"].dt.tz_localize(None)
            
            # Добавление дополнительных признаков
            camera_df["hour"] = camera_df["ds"].dt.hour
            camera_df["day_of_week"] = camera_df["ds"].dt.dayofweek
            camera_df["month"] = camera_df["ds"].dt.month
            camera_df["is_weekend"] = camera_df["day_of_week"] >= 5
            
            if len(camera_df) < 50:
                logger.warning(f"Недостаточно данных для камеры {camera_id}")
                return None
            
            # Создание модели Prophet
            model_prophet = Prophet(
                daily_seasonality=True, 
                weekly_seasonality=True, 
                yearly_seasonality=True
            )
            model_prophet.add_regressor("hour")
            model_prophet.add_regressor("day_of_week")
            model_prophet.add_regressor("month")
            model_prophet.add_regressor("is_weekend")
            
            model_prophet.fit(camera_df)
            
            # Создание будущих данных
            future = model_prophet.make_future_dataframe(periods=days_ahead * 24, freq="H")
            future["hour"] = future["ds"].dt.hour
            future["day_of_week"] = future["ds"].dt.dayofweek
            future["month"] = future["ds"].dt.month
            future["is_weekend"] = future["day_of_week"] >= 5
            
            # Прогнозирование
            forecast = model_prophet.predict(future)
            return forecast
            
        except Exception as e:
            logger.error(f"Ошибка прогнозирования для камеры {camera_id}: {e}")
            return None
    
    async def _generate_summary(self, camera_id: int, forecast: pd.DataFrame, df: pd.DataFrame, days_ahead: int) -> str:
        """Генерация текстового описания прогноза"""
        try:
            today = datetime.date.today()
            history = df[df['camera_id'] == camera_id].groupby('day_name')['visitors'].mean().to_dict()
            
            # Прогноз на сегодня
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
            
            # Прогноз на следующие дни
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
            
            # Контекст для Gemini
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
            
            response = self.gemini_model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"Ошибка генерации описания для камеры {camera_id}: {e}")
            return f"Ошибка генерации описания для камеры {camera_id}: {str(e)}"
    
    def _format_predictions(self, forecast: pd.DataFrame, days_ahead: int) -> List[Dict[str, Any]]:
        """Форматирование предсказаний для API ответа"""
        predictions = []
        today = datetime.date.today()
        
        for i in range(days_ahead + 1):
            target_date = today + datetime.timedelta(days=i)
            day_forecast = forecast[forecast["ds"].dt.date == target_date]
            
            if not day_forecast.empty:
                avg_visitors = day_forecast["yhat"].mean()
                peak_hour = day_forecast.loc[day_forecast["yhat"].idxmax()]
                
                predictions.append({
                    'date': target_date.isoformat(),
                    'day_name': target_date.strftime("%A"),
                    'average_visitors': round(avg_visitors, 1),
                    'peak_hour': peak_hour["ds"].strftime("%H:%M"),
                    'peak_visitors': round(peak_hour["yhat"], 1),
                    'hourly_predictions': [
                        {
                            'hour': row["ds"].strftime("%H:%M"),
                            'visitors': round(row["yhat"], 1)
                        }
                        for _, row in day_forecast.iterrows()
                    ]
                })
        
        return predictions
    
    def _get_historical_stats(self, df: pd.DataFrame, camera_id: int) -> Dict[str, float]:
        """Получение исторической статистики"""
        camera_data = df[df["camera_id"] == camera_id]
        
        if camera_data.empty:
            return {}
        
        return {
            'average_visitors': round(camera_data['visitors'].mean(), 1),
            'max_visitors': int(camera_data['visitors'].max()),
            'min_visitors': int(camera_data['visitors'].min()),
            'total_records': len(camera_data),
            'date_range': {
                'start': camera_data['ts'].min().isoformat(),
                'end': camera_data['ts'].max().isoformat()
            }
        }
    
    async def _send_email(self, messages: List[str], email_to: Optional[str] = None):
        """Отправка email с результатами прогноза"""
        try:
            recipient = email_to or self.default_email
            
            # Формируем красивое сообщение
            subject = "📊 Прогноз посещений на сегодня"
            message_body = "\n\n".join(messages) if messages else "Недостаточно данных для прогноза"
            
            # Добавляем дополнительную информацию
            full_message = f"""
📈 ПРОГНОЗ ПОСЕЩЕНИЙ НА СЕГОДНЯ

{message_body}

---
📅 Время генерации: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
🤖 Сгенерировано системой Analytics System
            """
            
            # Отправляем через EmailService
            success = self.email_service.send_system_notification(
                recipient_email=recipient,
                subject=subject,
                message=full_message,
                notification_type="info"
            )
            
            if success:
                logger.info(f"Email с прогнозом успешно отправлен на {recipient}")
            else:
                logger.error(f"Не удалось отправить email на {recipient}")
            
        except Exception as e:
            logger.error(f"Ошибка отправки email: {e}")
            raise
    
    async def get_forecast_history(self) -> List[Dict[str, Any]]:
        """Получение истории прогнозов (заглушка для будущей реализации)"""
        # Здесь можно добавить логику для получения истории прогнозов из БД
        return [
            {
                'id': 1,
                'generated_at': datetime.datetime.now().isoformat(),
                'cameras_processed': [1],
                'status': 'completed'
            }
        ]

