CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE cameras (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    venue_id UUID NOT NULL, 
    rtsp_url TEXT,  
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE visitors_count (
    camera_id INT REFERENCES cameras(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ NOT NULL,
    visitors INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    day_of_week INT,
    day_name TEXT,
    PRIMARY KEY (camera_id, ts)
);

CREATE OR REPLACE FUNCTION set_day_info()
RETURNS TRIGGER AS $$
BEGIN
  NEW.day_of_week := EXTRACT(DOW FROM NEW.ts);
  NEW.day_name := trim(to_char(NEW.ts, 'Day'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_day_info
BEFORE INSERT OR UPDATE ON visitors_count
FOR EACH ROW
EXECUTE FUNCTION set_day_info();

-- CREATE TABLE alerts (
--     id SERIAL PRIMARY KEY,
--     camera_id INT REFERENCES cameras(id),
--     ts TIMESTAMPTZ NOT NULL,
--     level TEXT NOT NULL,
--     message TEXT NOT NULL
-- );

-- CREATE TABLE visitors_forecast (
--     camera_id INT REFERENCES cameras(id),
--     ts TIMESTAMPTZ NOT NULL,
--     predicted_visitors FLOAT NOT NULL,
--     PRIMARY KEY (camera_id, ts)
-- );

INSERT INTO cameras (name, venue_id, rtsp_url) 
VALUES 
    ('Iphone 11', 'c9b590d4-0f8a-4e12-9680-6c5f448eece2', 'rtsp://192.168.100.10:8554/live'),
    ('Iphone 12', 'ef29592f-5aad-44b1-a924-1c451652d2b9', 'rtsp://192.168.100.10:8554/live'),
    ('Iphone 13', '842e87f5-fbc0-453e-bfd6-33afa815c6fd', 'rtsp://192.168.100.10:8554/live'),
    ('Iphone 14', 'a5bb0686-3343-471b-881b-027efebcb499', 'rtsp://192.168.100.10:8554/live'),
    ('Iphone 15', '1c8b044b-cd08-4aa9-bab1-030deb166008', 'rtsp://192.168.100.10:8554/live');

DO $$
DECLARE
    i INT;
    dt TIMESTAMP WITH TIME ZONE;
    visitors_count INT;
    day_of_week INT;
    day_name TEXT;
    month INT;
    base_visitors INT;
BEGIN
    FOR i IN 1..1000 LOOP
        -- Генерация даты: последние 40 дней, шаг ~1 час
        dt := now() - ((1000 - i) * interval '30 minutes');

        -- День недели и месяц
        day_of_week := EXTRACT(DOW FROM dt);
        month := EXTRACT(MONTH FROM dt);
        CASE day_of_week
            WHEN 0 THEN day_name := 'Sunday';
            WHEN 1 THEN day_name := 'Monday';
            WHEN 2 THEN day_name := 'Tuesday';
            WHEN 3 THEN day_name := 'Wednesday';
            WHEN 4 THEN day_name := 'Thursday';
            WHEN 5 THEN day_name := 'Friday';
            WHEN 6 THEN day_name := 'Saturday';
        END CASE;

        -- Базовое количество посетителей с учётом дня недели
        IF day_of_week >= 5 THEN
            base_visitors := 15; -- выходные
        ELSE
            base_visitors := 10; -- будние
        END IF;

        -- Учет времени суток (пики)
        IF EXTRACT(HOUR FROM dt) BETWEEN 12 AND 14 THEN
            visitors_count := base_visitors + (10 + random()*10)::INT; -- обеденный пик
        ELSIF EXTRACT(HOUR FROM dt) BETWEEN 18 AND 20 THEN
            visitors_count := base_visitors + (5 + random()*8)::INT;  -- вечерний пик
        ELSE
            visitors_count := base_visitors + (0 + random()*5)::INT;  -- остальное время
        END IF;

        -- Учет месяца (например, летом чуть больше посетителей)
        IF month IN (6,7,8) THEN
            visitors_count := visitors_count + 2;
        ELSIF month IN (12,1,2) THEN
            visitors_count := visitors_count - 1;
        END IF;

        -- Случайный шум
        visitors_count := visitors_count + (random()*3 - 1)::INT;
        IF visitors_count < 0 THEN visitors_count := 0; END IF;

        -- Вставка записи
        INSERT INTO visitors_count(camera_id, ts, visitors, day_of_week, day_name)
        VALUES (1, dt, visitors_count, day_of_week, day_name);
    END LOOP;
END $$;


SELECT create_hypertable('visitors_count', 'ts', if_not_exists => TRUE);
