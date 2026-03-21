#!/usr/bin/env python3
"""
Скрипт для запуска API Analytics System
"""

import uvicorn
import sys
import os
from dotenv import load_dotenv

def load_environment():
    """Загрузка переменных окружения из .env файла"""
    # Ищем .env файл в разных местах
    env_paths = [
        os.path.join(os.path.dirname(__file__), '.env'),  # В корне проекта
        os.path.join(os.path.dirname(__file__), 'env.example')  # Пример файла
    ]
    
    env_loaded = False
    for env_path in env_paths:
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print(f"📁 Загружены переменные из: {env_path}")
            env_loaded = True
            break
    
    if not env_loaded:
        print("⚠️  Файл .env не найден, используются значения по умолчанию")
        print("💡 Создайте файл .env на основе env.example")
    
    # Устанавливаем значения по умолчанию если переменные не заданы
    defaults = {
        "DB_HOST": "localhost",
        "DB_PORT": "5433",
        "DB_NAME": "cafeteria",
        "DB_USER": "admin",
        "DB_PASS": "admin123",
        "API_HOST": "0.0.0.0",
        "API_PORT": "8000",
        "API_RELOAD": "true",
        "API_LOG_LEVEL": "info"
    }
    
    for key, value in defaults.items():
        if key not in os.environ:
            os.environ[key] = value

def check_dependencies():
    """Проверка установленных зависимостей"""
    print("🔍 Проверка зависимостей...")
    
    # Определяем версию Python
    python_version = sys.version_info
    print(f"🐍 Python версия: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    required_packages = [
        ('fastapi', 'fastapi'),
        ('pydantic', 'pydantic'),
        ('opencv-python', 'cv2'),
        ('uvicorn', 'uvicorn'),
        ('torch', 'torch'),
        ('ultralytics', 'ultralytics'),
        ('psycopg2', 'psycopg2'),
        ('pandas', 'pandas'),
        ('prophet', 'prophet'),
        ('sqlalchemy', 'sqlalchemy'),
        ('google-generativeai', 'google.generativeai'),
        ('python-dotenv', 'dotenv')
    ]
    
    missing_packages = []
    
    for package_name, import_name in required_packages:
        try:
            __import__(import_name)
            print(f"✅ {package_name}")
        except ImportError:
            print(f"❌ {package_name}")
            missing_packages.append(package_name)
    
    if missing_packages:
        print(f"\n⚠️  Отсутствуют пакеты: {', '.join(missing_packages)}")
        print("Установите их командой:")
        print("pip install -r api/requirements.txt")
        
        print(f"\nИли установите пакеты по отдельности:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    print("✅ Все зависимости установлены")
    return True

def check_database():
    """Проверка доступности базы данных"""
    print("\n🔍 Проверка базы данных...")
    
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5433")),
            dbname=os.getenv("DB_NAME", "cafeteria"),
            user=os.getenv("DB_USER", "admin"),
            password=os.getenv("DB_PASS", "admin123")
        )
        conn.close()
        print("✅ База данных доступна")
        return True
    except Exception as e:
        print(f"❌ База данных недоступна: {e}")
        print("Убедитесь, что TimescaleDB запущен:")
        print("docker-compose up -d timescaledb")
        return False

def start_api():
    """Запуск API"""
    print("\n🚀 Запуск API...")
    
    # Переходим в директорию API
    api_dir = os.path.join(os.path.dirname(__file__), 'api')
    
    if not os.path.exists(api_dir):
        print(f"❌ Директория API не найдена: {api_dir}")
        return False
    
    # Добавляем директорию API в путь для импорта
    sys.path.insert(0, api_dir)
    
    try:
        # Получаем настройки из переменных окружения
        host = os.getenv("API_HOST", "0.0.0.0")
        port = int(os.getenv("API_PORT", "8000"))
        reload = os.getenv("API_RELOAD", "true").lower() == "true"
        log_level = os.getenv("API_LOG_LEVEL", "info")
        
        print(f"🌐 API будет доступен по адресу: http://localhost:{port}")
        print("📖 Документация API: http://localhost:8000/swagger/index.html")
        print("📖 ReDoc документация: http://localhost:8000/swagger/redoc")
        print("⏹️  Для остановки нажмите Ctrl+C")
        print("-" * 50)
        
        # Запускаем uvicorn напрямую
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=reload,
            log_level=log_level
        )
        
    except KeyboardInterrupt:
        print("\n⏹️  API остановлен пользователем")
        return True
    except Exception as e:
        print(f"❌ Ошибка запуска API: {e}")
        return False

def main():
    """Основная функция"""
    print("🎯 Analytics System API Launcher")
    print("=" * 40)
    
    # Загружаем переменные окружения
    load_environment()
    
    # Проверяем зависимости
    if not check_dependencies():
        print("\n❌ Не все зависимости установлены. Установите их и попробуйте снова.")
        return
    
    # Проверяем базу данных
    if not check_database():
        print("\n⚠️  База данных недоступна, но API может работать без неё")
        response = input("Продолжить запуск? (y/n): ")
        if response.lower() != 'y':
            return
    
    # Запускаем API
    print("\n" + "=" * 40)
    start_api()

if __name__ == "__main__":
    main()