import React, { useState } from 'react';
import { Database, FileCode, GitFork, Table, Check, ExternalLink, Image } from 'lucide-react';

const SCHEMA_SQL_CONTENT = `-- Удаление таблиц, если они существуют (для чистого перезапуска)
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
    (1, 'ЦСКА', 'Динамо', '2024-06-12 20:00:00', 'FINISHED', 'QUARTER_FINAL', 2, 1);`;

export const DatabaseSchemaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'er' | 'sql' | 'tables'>('er');
  const [copied, setCopied] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SCHEMA_SQL_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('er')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              activeTab === 'er'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            ER-Диаграмма (erdiagram.png)
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              activeTab === 'sql'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            PostgreSQL DDL (schema.sql)
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
              activeTab === 'tables'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Структура таблиц & Ограничения
          </button>
        </div>

        <a
          href="https://github.com/TheSkelies/pks_matches"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
        >
          <GitFork className="w-3.5 h-3.5" />
          TheSkelies/pks_matches
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {activeTab === 'er' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              Оригинальная ER-диаграмма репозитория
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Файл <code>erdiagram.png</code> из корня репозитория <code>pks_matches</code>, отображающий связи между сущностями пользователей, турниров и матчей.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center items-center overflow-auto max-h-[500px]">
              <img
                src="/erdiagram.png"
                alt="ER Diagram"
                className="max-w-full h-auto rounded-lg shadow-md border border-slate-800"
                onError={(e) => {
                  // Fallback visual diagram if image fails
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = document.getElementById('er-fallback');
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div id="er-fallback" style={{ display: 'none' }} className="p-6 text-center text-slate-400">
                <Table className="w-10 h-10 mx-auto mb-2 text-indigo-400" />
                <p className="font-semibold text-slate-200">Связи схемы данных:</p>
                <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-6 text-xs">
                  <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-left">
                    <div className="font-bold text-indigo-300 border-b border-slate-700 pb-1 mb-2">users</div>
                    <div>id (PK)</div>
                    <div>username (UNIQUE)</div>
                    <div>password_hash</div>
                    <div>role (ENUM)</div>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-left">
                    <div className="font-bold text-indigo-300 border-b border-slate-700 pb-1 mb-2">tournaments</div>
                    <div>id (PK)</div>
                    <div>name (UNIQUE)</div>
                    <div>start_date</div>
                    <div>end_date</div>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-left">
                    <div className="font-bold text-indigo-300 border-b border-slate-700 pb-1 mb-2">matches</div>
                    <div>id (PK)</div>
                    <div className="text-amber-300">tournament_id (FK -&gt; tournaments.id)</div>
                    <div>team1</div>
                    <div>team2 (CHECK team1 &lt;&gt; team2)</div>
                    <div>match_date</div>
                    <div>status (ENUM)</div>
                    <div>stage (ENUM)</div>
                    <div>score1 / score2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sql' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              src/main/resources/schema.sql
            </span>
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 cursor-pointer transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Скопировано!
                </>
              ) : (
                'Скопировать SQL'
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-indigo-300 font-mono text-xs rounded-xl border border-slate-800 overflow-x-auto leading-relaxed select-text">
            {SCHEMA_SQL_CONTENT}
          </pre>
        </div>
      )}

      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Users Table Spec */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Таблица `users`
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">id</span>: SERIAL PRIMARY KEY
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">username</span>: VARCHAR(50) UNIQUE NOT NULL
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">password_hash</span>: VARCHAR(255) NOT NULL
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">role</span>: user_role ('ADMIN', 'USER', 'GUEST')
              </div>
            </div>
          </div>

          {/* Tournaments Table Spec */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              Таблица `tournaments`
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">id</span>: SERIAL PRIMARY KEY
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">name</span>: VARCHAR(100) UNIQUE NOT NULL
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">start_date</span>: DATE NOT NULL
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">end_date</span>: DATE (NULLABLE)
              </div>
            </div>
          </div>

          {/* Matches Table Spec */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              Таблица `matches`
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">id</span>: SERIAL PRIMARY KEY
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-amber-400">tournament_id</span>: INT FK ON DELETE CASCADE
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">team1, team2</span>: VARCHAR(100) NOT NULL
                <div className="text-[10px] text-amber-400 mt-1">CHECK (team1 &lt;&gt; team2)</div>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">status</span>: match_status ('SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED')
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-indigo-400">stage</span>: match_stage ('GROUP', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL')
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
