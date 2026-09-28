-- Удаление таблиц, если они существуют (для чистого перезапуска)
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS tournaments;
DROP TABLE IF EXISTS users;

-- Удаление типов ENUM, если они существуют (для чистого перезапуска)
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS match_status;
DROP TYPE IF EXISTS match_stage;

-- Создание ENUM-типов
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER', 'GUEST');
CREATE TYPE match_status AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED');
CREATE TYPE match_stage AS ENUM ('GROUP', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL');

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'USER'
);

-- Таблица турниров
CREATE TABLE tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE
);

-- Таблица матчей
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    tournament_id INT NOT NULL,
    team1 VARCHAR(100) NOT NULL,
    team2 VARCHAR(100) NOT NULL,
    match_date TIMESTAMP NOT NULL,
    status match_status NOT NULL DEFAULT 'SCHEDULED',
    stage match_stage NOT NULL DEFAULT 'GROUP',
    score1 INT DEFAULT 0,
    score2 INT DEFAULT 0,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    CONSTRAINT chk_different_teams CHECK (team1 <> team2)
);

-- Начальные тестовые данные (для проверки)
INSERT INTO users (username, password_hash, role) VALUES
    ('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'ADMIN'),
    ('user', '04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb', 'USER');

INSERT INTO tournaments (name, start_date, end_date) VALUES
    ('ЧМ по футболу 2024', '2024-06-01', '2024-07-15');

INSERT INTO matches (tournament_id, team1, team2, match_date, status, stage, score1, score2) VALUES
    (1, 'Спартак', 'Зенит', '2024-06-10 19:00:00', 'SCHEDULED', 'GROUP', 0, 0),
    (1, 'ЦСКА', 'Динамо', '2024-06-12 20:00:00', 'FINISHED', 'QUARTER_FINAL', 2, 1);
