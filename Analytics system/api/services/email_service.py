import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    """Сервис для отправки email уведомлений"""
    
    def __init__(self):
        # Переменные окружения для SMTP
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USER", "kkochin2528@gmail.com")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "astt rlmb onji xvwm")
        
        # Конфигурация SMTP
        self.smtp_config = {
            'server': self.smtp_server,
            'port': self.smtp_port,
            'username': self.smtp_username,
            'password': self.smtp_password
        }
        
        # Отправитель по умолчанию
        self.default_sender = {
            'name': "Analytics System",
            'email': self.smtp_username
        }
        
        logger.info("EmailService инициализирован")
    
    def send_threshold_alert(self, 
                           recipient_email: str,
                           camera_id: int,
                           current_visitors: int,
                           average_visitors: float,
                           threshold_multiplier: float) -> bool:
        """
        Отправка уведомления о превышении порога посещений
        
        Args:
            recipient_email: Email получателя
            camera_id: ID камеры
            current_visitors: Текущее количество посетителей
            average_visitors: Среднее количество посетителей
            threshold_multiplier: Множитель порога
            
        Returns:
            bool: True если email отправлен успешно, False иначе
        """
        try:
            threshold = average_visitors * threshold_multiplier
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            percentage_increase = ((current_visitors / average_visitors - 1) * 100) if average_visitors > 0 else 0
            
            subject = f"🚨 ПОВЫШЕННЫЙ СПРОС - Камера {camera_id}"
            
            # HTML версия письма
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                    .header {{ background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 30px; }}
                    .alert {{ background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }}
                    .stats {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }}
                    .stat-card {{ background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }}
                    .stat-value {{ font-size: 24px; font-weight: bold; color: #2d3436; }}
                    .stat-label {{ font-size: 14px; color: #636e72; margin-top: 5px; }}
                    .recommendations {{ background-color: #e8f5e8; border-left: 4px solid #00b894; padding: 15px; margin: 20px 0; }}
                    .footer {{ background-color: #2d3436; color: white; padding: 15px; text-align: center; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚨 УВЕДОМЛЕНИЕ О ПРЕВЫШЕНИИ ПОРОГА</h1>
                        <p>Система мониторинга в реальном времени</p>
                    </div>
                    
                    <div class="content">
                        <div class="alert">
                            <strong>⚠️ Внимание!</strong> Обнаружено превышение порога посещений для камеры {camera_id}
                        </div>
                        
                        <div class="stats">
                            <div class="stat-card">
                                <div class="stat-value">{current_visitors}</div>
                                <div class="stat-label">Текущие посетители</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{average_visitors:.1f}</div>
                                <div class="stat-label">Среднее значение</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{threshold:.1f}</div>
                                <div class="stat-label">Порог ({threshold_multiplier}x)</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">+{percentage_increase:.1f}%</div>
                                <div class="stat-label">Превышение</div>
                            </div>
                        </div>
                        
                        <h3>📊 Детали:</h3>
                        <ul>
                            <li><strong>Камера:</strong> {camera_id}</li>
                            <li><strong>Время:</strong> {timestamp}</li>
                            <li><strong>Текущее количество:</strong> {current_visitors} человек</li>
                            <li><strong>Среднее для этого времени:</strong> {average_visitors:.1f} человек</li>
                            <li><strong>Порог превышения:</strong> {threshold:.1f} человек</li>
                        </ul>
                        
                        <div class="recommendations">
                            <h3>💡 Рекомендации:</h3>
                            <ul>
                                <li>Увеличить количество персонала</li>
                                <li>Проверить загруженность касс</li>
                                <li>Подготовить дополнительные ресурсы</li>
                                <li>Рассмотреть возможность открытия дополнительных точек обслуживания</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Analytics System - Мониторинг в реальном времени</p>
                        <p>Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Текстовая версия письма
            text_body = f"""
🚨 УВЕДОМЛЕНИЕ О ПРЕВЫШЕНИИ ПОРОГА

📍 Камера: {camera_id}
⏰ Время: {timestamp}
👥 Текущее количество посетителей: {current_visitors}
📊 Среднее значение для этого времени: {average_visitors:.1f}
⚠️ Порог превышения: {threshold:.1f}
📈 Превышение на: {percentage_increase:.1f}%

Рекомендуется:
• Увеличить количество персонала
• Проверить загруженность касс
• Подготовить дополнительные ресурсы
• Рассмотреть возможность открытия дополнительных точек обслуживания

---
Analytics System - Мониторинг в реальном времени
Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.
            """
            
            return self._send_email(
                recipient_email=recipient_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"Ошибка при создании уведомления о превышении порога: {e}")
            return False
    
    def send_system_notification(self, 
                               recipient_email: str,
                               subject: str,
                               message: str,
                               notification_type: str = "info") -> bool:
        """
        Отправка системного уведомления
        
        Args:
            recipient_email: Email получателя
            subject: Тема письма
            message: Текст сообщения
            notification_type: Тип уведомления (info, warning, error, success)
            
        Returns:
            bool: True если email отправлен успешно, False иначе
        """
        try:
            # Иконки для разных типов уведомлений
            icons = {
                "info": "ℹ️",
                "warning": "⚠️", 
                "error": "❌",
                "success": "✅"
            }
            
            icon = icons.get(notification_type, "ℹ️")
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                    .header {{ background-color: #2d3436; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 30px; }}
                    .message {{ background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                    .footer {{ background-color: #2d3436; color: white; padding: 15px; text-align: center; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>{icon} {subject}</h1>
                        <p>Система мониторинга в реальном времени</p>
                    </div>
                    
                    <div class="content">
                        <div class="message">
                            <p><strong>Время:</strong> {timestamp}</p>
                            <p>{message}</p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Analytics System - Мониторинг в реальном времени</p>
                        <p>Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_body = f"""
{icon} {subject}

Время: {timestamp}

{message}

---
Analytics System - Мониторинг в реальном времени
Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.
            """
            
            return self._send_email(
                recipient_email=recipient_email,
                subject=f"{icon} {subject}",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"Ошибка при создании системного уведомления: {e}")
            return False
    
    def _send_email(self, 
                   recipient_email: str,
                   subject: str,
                   html_body: str,
                   text_body: str) -> bool:
        """
        Внутренний метод для отправки email
        
        Args:
            recipient_email: Email получателя
            subject: Тема письма
            html_body: HTML версия письма
            text_body: Текстовая версия письма
            
        Returns:
            bool: True если email отправлен успешно, False иначе
        """
        try:
            # Создаем multipart сообщение
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.default_sender['name']} <{self.default_sender['email']}>"
            msg['To'] = recipient_email
            
            # Добавляем текстовую и HTML версии
            text_part = MIMEText(text_body, 'plain', 'utf-8')
            html_part = MIMEText(html_body, 'html', 'utf-8')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Отправляем email
            with smtplib.SMTP(self.smtp_config['server'], self.smtp_config['port']) as server:
                server.starttls()
                server.login(self.smtp_config['username'], self.smtp_config['password'])
                server.sendmail(
                    self.default_sender['email'], 
                    [recipient_email], 
                    msg.as_string()
                )
            
            logger.info(f"Email успешно отправлен на {recipient_email}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка отправки email на {recipient_email}: {e}")
            return False
    
    def test_connection(self) -> bool:
        """
        Тестирование подключения к SMTP серверу
        
        Returns:
            bool: True если подключение успешно, False иначе
        """
        try:
            with smtplib.SMTP(self.smtp_config['server'], self.smtp_config['port']) as server:
                server.starttls()
                server.login(self.smtp_config['username'], self.smtp_config['password'])
            
            logger.info("SMTP подключение успешно протестировано")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка тестирования SMTP подключения: {e}")
            return False
    
    def send_monitoring_report(self, 
                             recipient_email: str,
                             camera_id: int,
                             current_visitors: int,
                             average_visitors: float,
                             threshold_multiplier: float) -> bool:
        """
        Отправка отчета о мониторинге (всегда, независимо от превышения порога)
        
        Args:
            recipient_email: Email получателя
            camera_id: ID камеры
            current_visitors: Текущее количество посетителей
            average_visitors: Среднее количество посетителей
            threshold_multiplier: Множитель порога
            
        Returns:
            bool: True если email отправлен успешно, False иначе
        """
        try:
            threshold = average_visitors * threshold_multiplier
            exceeded = current_visitors > threshold
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Определяем статус и иконку
            if exceeded:
                status_icon = "🚨"
                status_text = "ПРЕВЫШЕНИЕ ПОРОГА"
                status_color = "#ff6b6b"
                alert_class = "alert-danger"
            else:
                status_icon = "✅"
                status_text = "НОРМАЛЬНЫЙ УРОВЕНЬ"
                status_color = "#00b894"
                alert_class = "alert-success"
            
            percentage_change = ((current_visitors / average_visitors - 1) * 100) if average_visitors > 0 else 0
            
            subject = f"{status_icon} Отчет мониторинга - Камера {camera_id}"
            
            # HTML версия письма
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                    .header {{ background: linear-gradient(135deg, {status_color}, #2d3436); color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 30px; }}
                    .alert {{ background-color: {'#fff3cd' if exceeded else '#d4edda'}; border: 1px solid {'#ffeaa7' if exceeded else '#c3e6cb'}; border-radius: 5px; padding: 15px; margin: 20px 0; }}
                    .stats {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }}
                    .stat-card {{ background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }}
                    .stat-value {{ font-size: 24px; font-weight: bold; color: #2d3436; }}
                    .stat-label {{ font-size: 14px; color: #636e72; margin-top: 5px; }}
                    .recommendations {{ background-color: {'#f8d7da' if exceeded else '#e8f5e8'}; border-left: 4px solid {'#dc3545' if exceeded else '#00b894'}; padding: 15px; margin: 20px 0; }}
                    .footer {{ background-color: #2d3436; color: white; padding: 15px; text-align: center; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>{status_icon} ОТЧЕТ МОНИТОРИНГА</h1>
                        <p>Система мониторинга в реальном времени</p>
                    </div>
                    
                    <div class="content">
                        <div class="alert">
                            <strong>{status_icon} {status_text}</strong> для камеры {camera_id}
                        </div>
                        
                        <div class="stats">
                            <div class="stat-card">
                                <div class="stat-value">{current_visitors}</div>
                                <div class="stat-label">Текущие посетители</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{average_visitors:.1f}</div>
                                <div class="stat-label">Среднее значение</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{threshold:.1f}</div>
                                <div class="stat-label">Порог ({threshold_multiplier}x)</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{'+' if percentage_change >= 0 else ''}{percentage_change:.1f}%</div>
                                <div class="stat-label">Изменение</div>
                            </div>
                        </div>
                        
                        <h3>📊 Детали:</h3>
                        <ul>
                            <li><strong>Камера:</strong> {camera_id}</li>
                            <li><strong>Время проверки:</strong> {timestamp}</li>
                            <li><strong>Текущее количество:</strong> {current_visitors} человек</li>
                            <li><strong>Среднее для этого времени:</strong> {average_visitors:.1f} человек</li>
                            <li><strong>Порог мониторинга:</strong> {threshold:.1f} человек</li>
                            <li><strong>Статус:</strong> {status_text}</li>
                        </ul>
                        
                        <div class="recommendations">
                            <h3>💡 {'Рекомендации:' if exceeded else 'Все в порядке:'}</h3>
                            {'<ul><li>Увеличить количество персонала</li><li>Проверить загруженность касс</li><li>Подготовить дополнительные ресурсы</li><li>Рассмотреть возможность открытия дополнительных точек обслуживания</li></ul>' if exceeded else '<p>Текущий уровень посещений находится в пределах нормы. Система мониторинга работает корректно.</p>'}
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Analytics System - Мониторинг в реальном времени</p>
                        <p>Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Текстовая версия письма
            text_body = f"""
{status_icon} ОТЧЕТ МОНИТОРИНГА - Камера {camera_id}

Статус: {status_text}

📍 Камера: {camera_id}
⏰ Время проверки: {timestamp}
👥 Текущее количество посетителей: {current_visitors}
📊 Среднее значение для этого времени: {average_visitors:.1f}
⚠️ Порог мониторинга: {threshold:.1f}
📈 Изменение: {'+' if percentage_change >= 0 else ''}{percentage_change:.1f}%

{'Рекомендуется:' if exceeded else 'Все в порядке:'}
{'• Увеличить количество персонала' if exceeded else '• Текущий уровень посещений находится в пределах нормы'}
{'• Проверить загруженность касс' if exceeded else '• Система мониторинга работает корректно'}
{'• Подготовить дополнительные ресурсы' if exceeded else ''}
{'• Рассмотреть возможность открытия дополнительных точек обслуживания' if exceeded else ''}

---
Analytics System - Мониторинг в реальном времени
Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.
            """
            
            return self._send_email(
                recipient_email=recipient_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"Ошибка при создании отчета мониторинга: {e}")
            return False
    
    def send_demand_analysis(self, 
                           recipient_email: str,
                           camera_id: int,
                           current_visitors: int,
                           average_visitors: float,
                           demand_status: str) -> bool:
        """
        Отправка анализа спроса с тремя состояниями: повышенный, пониженный, обычный
        
        Args:
            recipient_email: Email получателя
            camera_id: ID камеры
            current_visitors: Текущее количество посетителей
            average_visitors: Среднее количество посетителей
            demand_status: Статус спроса ("high", "low", "normal")
            
        Returns:
            bool: True если email отправлен успешно, False иначе
        """
        try:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            percentage_change = ((current_visitors / average_visitors - 1) * 100) if average_visitors > 0 else 0
            
            # Определяем параметры в зависимости от статуса спроса
            if demand_status == "high":
                status_icon = "📈"
                status_text = "ПОВЫШЕННЫЙ СПРОС"
                status_color = "#ff6b6b"
                alert_bg = "#fff3cd"
                alert_border = "#ffeaa7"
                recommendations_bg = "#f8d7da"
                recommendations_border = "#dc3545"
                recommendations_title = "💡 Рекомендации при повышенном спросе:"
                recommendations_text = """
                <ul>
                    <li>Увеличить количество персонала</li>
                    <li>Проверить загруженность касс</li>
                    <li>Подготовить дополнительные ресурсы</li>
                    <li>Рассмотреть возможность открытия дополнительных точек обслуживания</li>
                    <li>Ускорить процесс обслуживания</li>
                </ul>
                """
            elif demand_status == "low":
                status_icon = "📉"
                status_text = "ПОНИЖЕННЫЙ СПРОС"
                status_color = "#74b9ff"
                alert_bg = "#d1ecf1"
                alert_border = "#bee5eb"
                recommendations_bg = "#e2e3e5"
                recommendations_border = "#6c757d"
                recommendations_title = "💡 Рекомендации при пониженном спросе:"
                recommendations_text = """
                <ul>
                    <li>Проверить работу камеры и системы</li>
                    <li>Рассмотреть маркетинговые акции</li>
                    <li>Оптимизировать график работы персонала</li>
                    <li>Проверить доступность и удобство для клиентов</li>
                    <li>Анализировать причины снижения посещаемости</li>
                </ul>
                """
            else:  # normal
                status_icon = "✅"
                status_text = "ОБЫЧНЫЙ СПРОС"
                status_color = "#00b894"
                alert_bg = "#d4edda"
                alert_border = "#c3e6cb"
                recommendations_bg = "#e8f5e8"
                recommendations_border = "#00b894"
                recommendations_title = "💡 Все в порядке:"
                recommendations_text = """
                <p>Текущий уровень посещений находится в пределах нормы. Система мониторинга работает корректно.</p>
                <ul>
                    <li>Продолжать текущую стратегию обслуживания</li>
                    <li>Поддерживать качество сервиса</li>
                    <li>Мониторить изменения в реальном времени</li>
                </ul>
                """
            
            subject = f"{status_icon} Анализ спроса - Камера {camera_id}"
            
            # HTML версия письма
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                    .header {{ background: linear-gradient(135deg, {status_color}, #2d3436); color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 30px; }}
                    .alert {{ background-color: {alert_bg}; border: 1px solid {alert_border}; border-radius: 5px; padding: 15px; margin: 20px 0; }}
                    .stats {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }}
                    .stat-card {{ background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }}
                    .stat-value {{ font-size: 24px; font-weight: bold; color: #2d3436; }}
                    .stat-label {{ font-size: 14px; color: #636e72; margin-top: 5px; }}
                    .recommendations {{ background-color: {recommendations_bg}; border-left: 4px solid {recommendations_border}; padding: 15px; margin: 20px 0; }}
                    .footer {{ background-color: #2d3436; color: white; padding: 15px; text-align: center; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>{status_icon} АНАЛИЗ СПРОСА</h1>
                        <p>Система мониторинга в реальном времени</p>
                    </div>
                    
                    <div class="content">
                        <div class="alert">
                            <strong>{status_icon} {status_text}</strong> для камеры {camera_id}
                        </div>
                        
                        <div class="stats">
                            <div class="stat-card">
                                <div class="stat-value">{current_visitors}</div>
                                <div class="stat-label">Текущие посетители</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{average_visitors:.1f}</div>
                                <div class="stat-label">Среднее значение</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{'+' if percentage_change >= 0 else ''}{percentage_change:.1f}%</div>
                                <div class="stat-label">Изменение</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">{demand_status.upper()}</div>
                                <div class="stat-label">Статус спроса</div>
                            </div>
                        </div>
                        
                        <h3>📊 Детали:</h3>
                        <ul>
                            <li><strong>Камера:</strong> {camera_id}</li>
                            <li><strong>Время анализа:</strong> {timestamp}</li>
                            <li><strong>Текущее количество:</strong> {current_visitors} человек</li>
                            <li><strong>Среднее для этого времени:</strong> {average_visitors:.1f} человек</li>
                            <li><strong>Изменение спроса:</strong> {'+' if percentage_change >= 0 else ''}{percentage_change:.1f}%</li>
                            <li><strong>Статус:</strong> {status_text}</li>
                        </ul>
                        
                        <div class="recommendations">
                            <h3>{recommendations_title}</h3>
                            {recommendations_text}
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Analytics System - Мониторинг в реальном времени</p>
                        <p>Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Текстовая версия письма
            text_body = f"""
{status_icon} АНАЛИЗ СПРОСА - Камера {camera_id}

Статус: {status_text}

📍 Камера: {camera_id}
⏰ Время анализа: {timestamp}
👥 Текущее количество посетителей: {current_visitors}
📊 Среднее значение для этого времени: {average_visitors:.1f}
📈 Изменение спроса: {'+' if percentage_change >= 0 else ''}{percentage_change:.1f}%

{recommendations_title}
{recommendations_text.replace('<ul>', '').replace('</ul>', '').replace('<li>', '• ').replace('</li>', '').replace('<p>', '').replace('</p>', '')}

---
Analytics System - Мониторинг в реальном времени
Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.
            """
            
            return self._send_email(
                recipient_email=recipient_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"Ошибка при создании анализа спроса: {e}")
            return False
