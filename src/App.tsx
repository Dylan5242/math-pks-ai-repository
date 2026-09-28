/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Tournament,
  Match,
  TournamentStage,
  UserRole,
  sha256Hash,
  legacyHashCodeHex,
  INITIAL_USERS,
  INITIAL_TOURNAMENTS,
  INITIAL_MATCHES,
} from './types/pks';
import { Terminal, RotateCcw, Trash2, Key, Play, ShieldAlert, Sparkles, Check } from 'lucide-react';

// Formatters matching Java's DateTimeFormatter.ofPattern
function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return isoDate;
}

function formatDateTime(isoDateTime: string): string {
  if (!isoDateTime) return '';
  const [d, t] = isoDateTime.split('T');
  if (d && t) {
    const parts = d.split('-');
    return `${parts[2]}.${parts[1]}.${parts[0]} ${t.slice(0, 5)}`;
  }
  return isoDateTime;
}

function parseDate(ddMMyyyy: string): string | null {
  const match = ddMMyyyy.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
}

function parseDateTime(ddMMyyyyHHmm: string): string | null {
  const match = ddMMyyyyHHmm.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, d, m, y, h, min] = match;
  return `${y}-${m}-${d}T${h}:${min}`;
}

type Step =
  | { type: 'LOGIN_USERNAME' }
  | { type: 'LOGIN_PASSWORD'; username: string }
  | { type: 'MENU' }
  | { type: 'SELECT_TOURNAMENT_FOR_MATCHES' }
  // Add match wizard
  | { type: 'ADD_MATCH_SELECT_TOURNAMENT' }
  | { type: 'ADD_MATCH_TEAM1'; tournamentId: number }
  | { type: 'ADD_MATCH_TEAM2'; tournamentId: number; team1: string }
  | { type: 'ADD_MATCH_DATE'; tournamentId: number; team1: string; team2: string }
  | { type: 'ADD_MATCH_STAGE'; tournamentId: number; team1: string; team2: string; date: string }
  // Start match
  | { type: 'START_MATCH_SELECT' }
  // Finish match
  | { type: 'FINISH_MATCH_SELECT' }
  // Update score
  | { type: 'UPDATE_SCORE_SELECT' }
  | { type: 'UPDATE_SCORE_S1'; matchId: number }
  | { type: 'UPDATE_SCORE_S2'; matchId: number; score1: number }
  // Cancel match
  | { type: 'CANCEL_MATCH_SELECT' }
  // Add tournament
  | { type: 'ADD_TOURNAMENT_NAME' }
  | { type: 'ADD_TOURNAMENT_START'; name: string }
  | { type: 'ADD_TOURNAMENT_END'; name: string; start: string }
  // Add user
  | { type: 'ADD_USER_LOGIN' }
  | { type: 'ADD_USER_PASSWORD'; username: string }
  | { type: 'ADD_USER_ROLE'; username: string; passwordHash: string };

export default function App() {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pks_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        // Automatically upgrade any legacy 16-bit/32-bit hex hashes to SHA-256
        return parsed.map((u) => {
          if (u.username === 'admin' && (u.password_hash === '586034f' || u.password_hash === 'admin_hash')) {
            return { ...u, password_hash: sha256Hash('admin') };
          }
          if (u.username === 'user' && (u.password_hash === '36ebcb' || u.password_hash === 'user_hash' || u.password_hash === 'user1_hash')) {
            return { ...u, password_hash: sha256Hash('user') };
          }
          return u;
        });
      } catch (e) { /* fallback */ }
    }
    return INITIAL_USERS;
  });

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('pks_tournaments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_TOURNAMENTS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('pks_matches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_MATCHES;
  });

  // Active authenticated user in ConsoleApp
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Terminal state
  const [history, setHistory] = useState<string[]>([
    '=== Агрегатор матчей ===',
    'Запуск класса: pksmatches.Main (mvn exec:java)...'
  ]);
  const [currentPrompt, setCurrentPrompt] = useState<string>('Логин: ');
  const [step, setStep] = useState<Step>({ type: 'LOGIN_USERNAME' });
  const [inputVal, setInputVal] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('pks_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('pks_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    localStorage.setItem('pks_matches', JSON.stringify(matches));
  }, [matches]);

  // Scroll to bottom on output updates
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, currentPrompt]);

  const appendToHistory = (...lines: string[]) => {
    setHistory((prev) => [...prev, ...lines]);
  };

  const printMenu = (user: User) => {
    appendToHistory(
      '',
      `Пользователь: ${user.username} (${user.role})`,
      '1. Все матчи',
      '2. Live-матчи',
      '3. Матчи турнира',
      '4. Добавить матч',
      '5. Начать матч',
      '6. Завершить матч',
      '7. Обновить счёт',
      '8. Отменить матч',
      '9. Список турниров',
      '10. Добавить турнир',
      '11. Список пользователей',
      '12. Добавить пользователя',
      '13. Сменить пользователя (Logout)',
      '0. Выход'
    );
    setCurrentPrompt('Выбор: ');
  };

  const printMatches = (list: Match[]) => {
    if (list.length === 0) {
      appendToHistory('Матчей не найдено.');
      return;
    }
    const lines: string[] = [];
    for (const m of list) {
      const tour = tournaments.find((t) => t.id === m.tournamentId);
      const tourName = tour ? tour.name : 'Неизвестный турнир';
      const formattedDate = formatDateTime(m.matchDate);

      if (m.status === 'SCHEDULED') {
        lines.push(
          `Матч команд ${m.team1} и ${m.team2} запланирован на ${formattedDate} стадии ${m.stage}`,
          `Турнир: ${tourName}`,
          '==============='
        );
      } else if (m.status === 'CANCELLED') {
        lines.push(
          `Матч команд ${m.team1} и ${m.team2} отменён`,
          `Турнир: ${tourName}`,
          '==============='
        );
      } else if (m.status === 'FINISHED') {
        lines.push(
          `Матч команд ${m.team1} и ${m.team2} завершён со счётом ${m.score1}:${m.score2}`,
          `Турнир: ${tourName}`,
          '==============='
        );
      } else if (m.status === 'LIVE') {
        lines.push(
          `Матч команд ${m.team1} и ${m.team2} идёт со счётом ${m.score1}:${m.score2}`,
          `Турнир: ${tourName}`,
          '==============='
        );
      }
    }
    appendToHistory(...lines);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = inputVal;
    const val = rawVal.trim();
    setInputVal('');

    const MAX_INPUT_LENGTH = 100;
    if (rawVal.length > MAX_INPUT_LENGTH) {
      appendToHistory(
        `${currentPrompt}[Ввод: ${rawVal.length} симв.]`,
        `Ошибка: Неверный ввод (слишком длинное предложение, лимит ${MAX_INPUT_LENGTH} символов). Входной поток сброшен.`
      );
      return;
    }

    // Helper to safely parse numbers with range protection
    const parseSafeInt = (input: string, max: number = 100000): number | null => {
      if (input.length > 6) return null;
      if (!/^\d+$/.test(input)) return null;
      const num = parseInt(input, 10);
      if (isNaN(num) || num < 0 || num > max) return null;
      return num;
    };

    // Add command to history
    if (val) {
      setCommandHistory((prev) => [...prev, val]);
      setHistoryIndex(-1);
    }

    // Append entered prompt line
    appendToHistory(`${currentPrompt}${rawVal}`);

    switch (step.type) {
      case 'LOGIN_USERNAME': {
        if (!val) {
          appendToHistory('Поле не может быть пустым.');
          setCurrentPrompt('Логин: ');
          return;
        }
        if (val.length > 50) {
          appendToHistory('Ошибка: Неверный ввод. Логин не может превышать 50 символов.');
          setCurrentPrompt('Логин: ');
          return;
        }
        setStep({ type: 'LOGIN_PASSWORD', username: val });
        setCurrentPrompt('Пароль: ');
        break;
      }

      case 'LOGIN_PASSWORD': {
        const username = step.username;
        const shaHash = sha256Hash(val);
        const legacyHash = legacyHashCodeHex(val);

        // Check against modern SHA-256 or legacy hex
        const user = users.find(
          (u) =>
            u.username === username &&
            (u.password_hash === shaHash || u.password_hash === legacyHash)
        );

        if (!user) {
          appendToHistory('Неверный логин или пароль.', 'Выход.');
          // Reset to login again
          appendToHistory('', '=== Агрегатор матчей ===');
          setCurrentPrompt('Логин: ');
          setStep({ type: 'LOGIN_USERNAME' });
          setCurrentUser(null);
          return;
        }

        // If user was using legacy hash, upgrade in-memory and in DB
        if (user.password_hash !== shaHash) {
          user.password_hash = shaHash;
          setUsers([...users]);
        }

        setCurrentUser(user);
        appendToHistory(`Добро пожаловать, ${user.username}!`);
        printMenu(user);
        setStep({ type: 'MENU' });
        break;
      }

      case 'MENU': {
        if (!currentUser) {
          appendToHistory('=== Агрегатор матчей ===');
          setCurrentPrompt('Логин: ');
          setStep({ type: 'LOGIN_USERNAME' });
          return;
        }

        const choice = parseSafeInt(val, 13);
        if (choice === null) {
          appendToHistory('Ошибка: Неверный ввод (значение слишком большое или некорректное). Поток ввода сброшен.');
          setCurrentPrompt('Выбор: ');
          return;
        }

        switch (choice) {
          case 1: { // 1. Все матчи
            printMatches(matches);
            printMenu(currentUser);
            break;
          }
          case 2: { // 2. Live-матчи
            const live = matches.filter((m) => m.status === 'LIVE');
            printMatches(live);
            printMenu(currentUser);
            break;
          }
          case 3: { // 3. Матчи турнира
            if (tournaments.length === 0) {
              appendToHistory('Турниров нет.');
              printMenu(currentUser);
              return;
            }
            tournaments.forEach((t, i) => {
              appendToHistory(`${i + 1}. ${t.name}`);
            });
            setCurrentPrompt('Выберите турнир: ');
            setStep({ type: 'SELECT_TOURNAMENT_FOR_MATCHES' });
            break;
          }
          case 4: { // 4. Добавить матч
            if (currentUser.role !== 'ADMIN') {
              appendToHistory('Требуются права администратора.');
              printMenu(currentUser);
              return;
            }
            if (tournaments.length === 0) {
              appendToHistory('Турниров нет.');
              printMenu(currentUser);
              return;
            }
            tournaments.forEach((t, i) => {
              appendToHistory(`${i + 1}. ${t.name}`);
            });
            setCurrentPrompt('Выберите турнир: ');
            setStep({ type: 'ADD_MATCH_SELECT_TOURNAMENT' });
            break;
          }
          case 5: { // 5. Начать матч
            if (matches.length === 0) {
              appendToHistory('Матчей нет.');
              printMenu(currentUser);
              return;
            }
            matches.forEach((m, i) => {
              appendToHistory(`${i + 1}. Матч команд ${m.team1} и ${m.team2}`);
            });
            setCurrentPrompt('Выберите матч: ');
            setStep({ type: 'START_MATCH_SELECT' });
            break;
          }
          case 6: { // 6. Завершить матч
            if (matches.length === 0) {
              appendToHistory('Матчей нет.');
              printMenu(currentUser);
              return;
            }
            matches.forEach((m, i) => {
              appendToHistory(`${i + 1}. Матч команд ${m.team1} и ${m.team2}`);
            });
            setCurrentPrompt('Выберите матч: ');
            setStep({ type: 'FINISH_MATCH_SELECT' });
            break;
          }
          case 7: { // 7. Обновить счёт
            if (matches.length === 0) {
              appendToHistory('Матчей нет.');
              printMenu(currentUser);
              return;
            }
            matches.forEach((m, i) => {
              appendToHistory(`${i + 1}. Матч команд ${m.team1} и ${m.team2}`);
            });
            setCurrentPrompt('Выберите матч: ');
            setStep({ type: 'UPDATE_SCORE_SELECT' });
            break;
          }
          case 8: { // 8. Отменить матч
            if (matches.length === 0) {
              appendToHistory('Матчей нет.');
              printMenu(currentUser);
              return;
            }
            matches.forEach((m, i) => {
              appendToHistory(`${i + 1}. Матч команд ${m.team1} и ${m.team2}`);
            });
            setCurrentPrompt('Выберите матч: ');
            setStep({ type: 'CANCEL_MATCH_SELECT' });
            break;
          }
          case 9: { // 9. Список турниров
            if (tournaments.length === 0) {
              appendToHistory('Турниров нет.');
            } else {
              for (const t of tournaments) {
                const s = formatDate(t.startDate);
                const e = t.endDate ? formatDate(t.endDate) : 'не указана';
                appendToHistory(`Турнир ${t.name} начинается ${s}, заканчивается ${e}`);
              }
            }
            printMenu(currentUser);
            break;
          }
          case 10: { // 10. Добавить турнир
            if (currentUser.role !== 'ADMIN') {
              appendToHistory('Требуются права администратора.');
              printMenu(currentUser);
              return;
            }
            setCurrentPrompt('Название турнира: ');
            setStep({ type: 'ADD_TOURNAMENT_NAME' });
            break;
          }
          case 11: { // 11. Список пользователей
            if (currentUser.role !== 'ADMIN') {
              appendToHistory('Требуются права администратора.');
              printMenu(currentUser);
              return;
            }
            for (const u of users) {
              appendToHistory(`${u.id}. Пользователь ${u.username} имеет роль ${u.role}`);
            }
            printMenu(currentUser);
            break;
          }
          case 12: { // 12. Добавить пользователя
            if (currentUser.role !== 'ADMIN') {
              appendToHistory('Требуются права администратора.');
              printMenu(currentUser);
              return;
            }
            setCurrentPrompt('Логин: ');
            setStep({ type: 'ADD_USER_LOGIN' });
            break;
          }
          case 13: { // 13. Сменить пользователя (Logout)
            appendToHistory(`Выход из профиля ${currentUser.username}.`);
            setCurrentUser(null);
            appendToHistory('', '=== Вход в систему ===');
            setCurrentPrompt('Логин: ');
            setStep({ type: 'LOGIN_USERNAME' });
            break;
          }
          case 0: { // 0. Выход
            appendToHistory('До свидания.');
            setCurrentUser(null);
            appendToHistory('', '=== Агрегатор матчей ===');
            setCurrentPrompt('Логин: ');
            setStep({ type: 'LOGIN_USERNAME' });
            break;
          }
          default:
            appendToHistory('Ошибка: Неверный пункт меню.');
            setCurrentPrompt('Выбор: ');
        }
        break;
      }

      case 'SELECT_TOURNAMENT_FOR_MATCHES': {
        const choice = parseSafeInt(val, tournaments.length);
        if (choice === null || choice === 0) {
          appendToHistory('Ошибка: Неверный ввод (значение вне диапазона). Поток ввода сброшен.');
        } else {
          const selectedTour = tournaments[choice - 1];
          const tourMatches = matches.filter((m) => m.tournamentId === selectedTour.id);
          printMatches(tourMatches);
        }
        if (currentUser) printMenu(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // 4. ADD MATCH STEPS
      case 'ADD_MATCH_SELECT_TOURNAMENT': {
        const choice = parseSafeInt(val, tournaments.length);
        if (choice === null || choice === 0) {
          appendToHistory('Ошибка: Неверный ввод турнира. Поток ввода сброшен.');
          if (currentUser) printMenu(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        const selectedTour = tournaments[choice - 1];
        if (selectedTour.endDate) {
          const today = new Date().toISOString().split('T')[0];
          if (selectedTour.endDate < today) {
            appendToHistory(`Ошибка: Нельзя добавить матч — турнир уже завершился (${formatDate(selectedTour.endDate)}).`);
            if (currentUser) printMenu(currentUser);
            setStep({ type: 'MENU' });
            return;
          }
        }
        setStep({ type: 'ADD_MATCH_TEAM1', tournamentId: selectedTour.id });
        setCurrentPrompt('Команда 1: ');
        break;
      }

      case 'ADD_MATCH_TEAM1': {
        if (!val) {
          appendToHistory('Поле не может быть пустым.');
          setCurrentPrompt('Команда 1: ');
          return;
        }
        if (val.length > 50) {
          appendToHistory('Ошибка: Неверный ввод (название команды не может превышать 50 символов). Поток сброшен.');
          setCurrentPrompt('Команда 1: ');
          return;
        }
        setStep({ type: 'ADD_MATCH_TEAM2', tournamentId: step.tournamentId, team1: val });
        setCurrentPrompt('Команда 2: ');
        break;
      }

      case 'ADD_MATCH_TEAM2': {
        if (!val) {
          appendToHistory('Поле не может быть пустым.');
          setCurrentPrompt('Команда 2: ');
          return;
        }
        if (val.length > 50) {
          appendToHistory('Ошибка: Неверный ввод (название команды не может превышать 50 символов). Поток сброшен.');
          setCurrentPrompt('Команда 2: ');
          return;
        }
        if (step.team1.toLowerCase() === val.toLowerCase()) {
          appendToHistory('Ошибка: Команды должны различаться');
          if (currentUser) printMenu(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        setStep({
          type: 'ADD_MATCH_DATE',
          tournamentId: step.tournamentId,
          team1: step.team1,
          team2: val,
        });
        setCurrentPrompt('Дата и время (dd.MM.yyyy HH:mm): ');
        break;
      }

      case 'ADD_MATCH_DATE': {
        const iso = parseDateTime(val);
        if (!iso) {
          appendToHistory('Неверный формат даты и времени.');
          setCurrentPrompt('Дата и время (dd.MM.yyyy HH:mm): ');
          return;
        }

        // 1. Проверка: дата матча в пределах дат турнира
        const tour = tournaments.find((t) => t.id === step.tournamentId);
        if (tour) {
          const matchDateOnly = iso.split('T')[0];
          if (matchDateOnly < tour.startDate || (tour.endDate && matchDateOnly > tour.endDate)) {
            appendToHistory(
              `Ошибка: Дата матча (${formatDate(matchDateOnly)}) должна быть в пределах турнира (${formatDate(tour.startDate)} — ${tour.endDate ? formatDate(tour.endDate) : '...'}).`
            );
            setCurrentPrompt('Дата и время (dd.MM.yyyy HH:mm): ');
            return;
          }
        }

        // 4. Проверка: коллизия расписания (интервал < 3 часов для одной команды)
        const matchTime = new Date(iso).getTime();
        const collision = matches.find((m) => {
          if (m.status === 'CANCELLED') return false;
          const hasTeam1 =
            m.team1.toLowerCase() === step.team1.toLowerCase() ||
            m.team2.toLowerCase() === step.team1.toLowerCase();
          const hasTeam2 =
            m.team1.toLowerCase() === step.team2.toLowerCase() ||
            m.team2.toLowerCase() === step.team2.toLowerCase();
          if (!hasTeam1 && !hasTeam2) return false;

          const otherTime = new Date(m.matchDate).getTime();
          const diffMinutes = Math.abs(matchTime - otherTime) / (1000 * 60);
          return diffMinutes < 180; // 3 часа
        });

        if (collision) {
          const collTeam =
            collision.team1.toLowerCase() === step.team1.toLowerCase() ||
            collision.team2.toLowerCase() === step.team1.toLowerCase()
              ? step.team1
              : step.team2;
          appendToHistory(
            `Ошибка: Коллизия расписания! Команда "${collTeam}" уже заявлена в матче #${collision.id} (${formatDateTime(collision.matchDate)}). Интервал между матчами должен быть не менее 3 часов.`
          );
          setCurrentPrompt('Дата и время (dd.MM.yyyy HH:mm): ');
          return;
        }

        setStep({
          type: 'ADD_MATCH_STAGE',
          tournamentId: step.tournamentId,
          team1: step.team1,
          team2: step.team2,
          date: iso,
        });
        setCurrentPrompt('Этап (GROUP/QUARTER_FINAL/SEMI_FINAL/FINAL): ');
        break;
      }

      case 'ADD_MATCH_STAGE': {
        const upper = val.toUpperCase();
        if (!['GROUP', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'].includes(upper)) {
          appendToHistory('Неверный этап.');
          setCurrentPrompt('Этап (GROUP/QUARTER_FINAL/SEMI_FINAL/FINAL): ');
          return;
        }
        const nextId = matches.length > 0 ? Math.max(...matches.map((m) => m.id)) + 1 : 1;
        const newMatch: Match = {
          id: nextId,
          tournamentId: step.tournamentId,
          team1: step.team1,
          team2: step.team2,
          matchDate: step.date,
          stage: upper as TournamentStage,
          status: 'SCHEDULED',
          score1: 0,
          score2: 0,
        };
        setMatches((prev) => [...prev, newMatch]);
        appendToHistory(`Матч добавлен. ID=${nextId}`);
        if (currentUser) printMenu(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // 5. START MATCH
      case 'START_MATCH_SELECT': {
        const choice = parseSafeInt(val, matches.length);
        if (choice === null || choice === 0) {
          appendToHistory('Ошибка: Неверный ввод (значение вне диапазона). Поток сброшен.');
        } else {
          const m = matches[choice - 1];
          if (m.status !== 'SCHEDULED') {
            appendToHistory('Ошибка: Начать можно только запланированный матч');
          } else {
            setMatches((prev) =>
              prev.map((item) => (item.id === m.id ? { ...item, status: 'LIVE' } : item))
            );
            appendToHistory('Матч переведён в статус LIVE.');
          }
        }
        if (currentUser) printMenu(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // 6. FINISH MATCH
      case 'FINISH_MATCH_SELECT': {
        const choice = parseSafeInt(val, matches.length);
        if (choice === null || choice === 0) {
          appendToHistory('Ошибка: Неверный ввод (значение вне диапазона). Поток сброшен.');
        } else {
          const m = matches[choice - 1];
          if (m.status !== 'LIVE') {
            appendToHistory('Ошибка: Завершить можно только идущий матч');
          } else {
            setMatches((prev) =>
              prev.map((item) => (item.id === m.id ? { ...item, status: 'FINISHED' } : item))
            );
            appendToHistory('Матч завершён.');
          }
        }
        if (currentUser) printMenu(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // 7. UPDATE SCORE
      case 'UPDATE_SCORE_SELECT': {
        const choice = parseSafeInt(val, matches.length);
        if (choice === null || choice === 0) {
          appendToHistory('Ошибка: Неверный ввод (значение вне диапазона). Поток сброшен.');
          if (currentUser) printMenu(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        const m = matches[choice - 1];
        if (m.status === 'FINISHED') {
          appendToHistory('Ошибка: Нельзя менять счёт завершённого матча');
          if (currentUser) printMenu(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        if (m.status === 'CANCELLED') {
          appendToHistory('Ошибка: Нельзя менять счёт отменённого матча');
          if (currentUser) printMenu(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        if (m.status === 'SCHEDULED') {
          appendToHistory('Ошибка: Нельзя менять счёт запланированного матча. Сначала начните матч (пункт 5)');
          if (currentUser) printMenu(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        setStep({ type: 'UPDATE_SCORE_S1', matchId: m.id });
        setCurrentPrompt('Счёт команды 1: ');
        break;
      }

      case 'UPDATE_SCORE_S1': {
        const s1 = parseSafeInt(val, 999);
        if (s1 === null) {
          appendToHistory('Ошибка: Неверный ввод. Счёт должен быть числом от 0 до 999. Поток сброшен.');
          setCurrentPrompt('Счёт команды 1: ');
          return;
        }
        setStep({ type: 'UPDATE_SCORE_S2', matchId: step.matchId, score1: s1 });
        setCurrentPrompt('Счёт команды 2: ');
        break;
      }

      case 'UPDATE_SCORE_S2': {
        const s2 = parseSafeInt(val, 999);
        if (s2 === null) {
          appendToHistory('Ошибка: Неверный ввод. Счёт должен быть числом от 0 до 999. Поток сброшен.');
          setCurrentPrompt('Счёт команды 2: ');
          return;
        }
        setMatches((prev) =>
          prev.map((m) => (m.id === step.matchId ? { ...m, score1: step.score1, score2: s2 } : m))
        );
        appendToHistory('Счёт обновлён.');
        if (currentUser) printMenu(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // 8. CANCEL MATCH
      case 'CANCEL_MATCH_SELECT': {
        const choice = parseSafeInt(val, matches.length);
        if (choice === null || choice === 0) {
          appendToHistory('Ошибка: Неверный ввод (значение вне диапазона). Поток сброшен.');
        } else {
          const m = matches[choice - 1];
          if (m.status === 'FINISHED') {
            appendToHistory('Ошибка: Нельзя отменить завершённый матч');
          } else if (m.status === 'CANCELLED') {
            appendToHistory('Ошибка: Матч уже отменён');
          } else {
            setMatches((prev) =>
              prev.map((item) => (item.id === m.id ? { ...item, status: 'CANCELLED' } : item))
            );
            appendToHistory('Матч отменён.');
          }
        }
        if (currentUser) printMenu(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // 10. ADD TOURNAMENT
      case 'ADD_TOURNAMENT_NAME': {
        if (!val) {
          appendToHistory('Поле не может быть пустым.');
          setCurrentPrompt('Название турнира: ');
          return;
        }
        setStep({ type: 'ADD_TOURNAMENT_START', name: val });
        setCurrentPrompt('Дата начала (dd.MM.yyyy): ');
        break;
      }

      case 'ADD_TOURNAMENT_START': {
        const iso = parseDate(val);
        if (!iso) {
          appendToHistory('Неверный формат даты.');
          setCurrentPrompt('Дата начала (dd.MM.yyyy): ');
          return;
        }
        setStep({ type: 'ADD_TOURNAMENT_END', name: step.name, start: iso });
        setCurrentPrompt('Дата окончания (dd.MM.yyyy): ');
        break;
      }

      case 'ADD_TOURNAMENT_END': {
        const isoEnd = parseDate(val);
        if (!isoEnd) {
          appendToHistory('Неверный формат даты.');
          setCurrentPrompt('Дата окончания (dd.MM.yyyy): ');
          return;
        }
        if (isoEnd < step.start) {
          appendToHistory('Ошибка: Дата окончания не может быть раньше даты начала');
          if (currentUser) printMenu(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        const nextId = tournaments.length > 0 ? Math.max(...tournaments.map((t) => t.id)) + 1 : 1;
        const newTour: Tournament = {
          id: nextId,
          name: step.name,
          startDate: step.start,
          endDate: isoEnd,
        };
        setTournaments((prev) => [...prev, newTour]);
        appendToHistory(`Турнир добавлен. ID=${nextId}`);
        if (currentUser) printMenu(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // 12. ADD USER
      case 'ADD_USER_LOGIN': {
        if (!val) {
          appendToHistory('Поле не может быть пустым.');
          setCurrentPrompt('Логин: ');
          return;
        }
        if (users.some((u) => u.username.toLowerCase() === val.toLowerCase())) {
          appendToHistory('Ошибка: Пользователь с таким логином уже существует');
          if (currentUser) printMenu(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        setStep({ type: 'ADD_USER_PASSWORD', username: val });
        setCurrentPrompt('Пароль: ');
        break;
      }

      case 'ADD_USER_PASSWORD': {
        if (!val) {
          appendToHistory('Поле не может быть пустым.');
          setCurrentPrompt('Пароль: ');
          return;
        }
        const hash = sha256Hash(val);
        setStep({ type: 'ADD_USER_ROLE', username: step.username, passwordHash: hash });
        setCurrentPrompt('Роль (ADMIN/USER/GUEST, по умолчанию USER): ');
        break;
      }

      case 'ADD_USER_ROLE': {
        let roleStr = val.toUpperCase();
        let role: UserRole = 'USER';
        if (!roleStr) {
          role = 'USER';
        } else if (['ADMIN', 'USER', 'GUEST'].includes(roleStr)) {
          role = roleStr as UserRole;
        } else {
          appendToHistory('Неверная роль. Установлена USER.');
          role = 'USER';
        }

        const nextId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
        const newUser: User = {
          id: nextId,
          username: step.username,
          password_hash: step.passwordHash,
          role,
        };
        setUsers((prev) => [...prev, newUser]);
        appendToHistory(`Пользователь создан. ID=${nextId}`);
        if (currentUser) printMenu(currentUser);
        setStep({ type: 'MENU' });
        break;
      }
    }
  };

  // Keyboard navigation for history (Up/Down)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      }
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setHistory([]);
    }
  };

  const restartConsole = () => {
    setCurrentUser(null);
    setHistory([
      '=== Агрегатор матчей ===',
      'Перезапуск pksmatches.ui.ConsoleApp...',
    ]);
    setStep({ type: 'LOGIN_USERNAME' });
    setCurrentPrompt('Логин: ');
    setInputVal('');
    inputRef.current?.focus();
  };

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setTournaments(INITIAL_TOURNAMENTS);
    setMatches(INITIAL_MATCHES);
    localStorage.removeItem('pks_users');
    localStorage.removeItem('pks_tournaments');
    localStorage.removeItem('pks_matches');
    restartConsole();
  };

  const quickFillAuth = (u: string, p: string) => {
    appendToHistory(`${currentPrompt}${u}`);
    const hash = sha256Hash(p);
    const legacy = legacyHashCodeHex(p);
    const user = users.find(
      (usr) => usr.username === u && (usr.password_hash === hash || usr.password_hash === legacy)
    );
    if (!user) {
      appendToHistory('Пароль: ' + p, 'Неверный логин или пароль.', 'Выход.');
      appendToHistory('', '=== Агрегатор матчей ===');
      setCurrentPrompt('Логин: ');
      setStep({ type: 'LOGIN_USERNAME' });
      return;
    }
    if (user.password_hash !== hash) {
      user.password_hash = hash;
      setUsers([...users]);
    }
    appendToHistory('Пароль: ' + '••••');
    setCurrentUser(user);
    appendToHistory(`Добро пожаловать, ${user.username}!`);
    printMenu(user);
    setStep({ type: 'MENU' });
    setInputVal('');
  };

  return (
    <div
      className="h-screen w-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-mono select-text overflow-hidden"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] select-none shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#f85149] inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-[#d29922] inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-[#3fb950] inline-block"></span>
          </div>
          <span className="text-[#8b949e] font-semibold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#58a6ff]" />
            PowerShell / Bash — mvn exec:java (pksmatches.Main)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick login aids */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#8b949e] mr-2">
            <span>Вход:</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                quickFillAuth('admin', 'admin');
              }}
              className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] transition cursor-pointer"
            >
              admin / admin
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                quickFillAuth('user', 'user');
              }}
              className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] border border-[#30363d] transition cursor-pointer"
            >
              user / user
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              restartConsole();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] transition cursor-pointer"
            title="Перезапустить консоль"
          >
            <RotateCcw className="w-3 h-3 text-[#8b949e]" />
            Перезапуск
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              resetAllData();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f85149] border border-[#30363d] transition cursor-pointer"
            title="Сбросить тестовую базу данных"
          >
            <Trash2 className="w-3 h-3" />
            Сброс БД
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-5 overflow-y-auto leading-relaxed text-sm space-y-1">
        {history.map((line, idx) => {
          let lineStyle = 'text-[#c9d1d9]';
          if (line.startsWith('===') || line.startsWith('Запуск')) {
            lineStyle = 'text-[#58a6ff] font-bold';
          } else if (line.startsWith('Ошибка') || line.includes('Неверн') || line.includes('Требуются права')) {
            lineStyle = 'text-[#f85149] font-bold';
          } else if (line.includes('успешно') || line.includes('Добро пожаловать') || line.includes('добавлен') || line.includes('создан')) {
            lineStyle = 'text-[#3fb950] font-semibold';
          } else if (line.startsWith('Пользователь:')) {
            lineStyle = 'text-[#d29922] font-semibold';
          } else if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.') || line.startsWith('6.') || line.startsWith('7.') || line.startsWith('8.') || line.startsWith('9.') || line.startsWith('10.') || line.startsWith('11.') || line.startsWith('12.') || line.startsWith('0.')) {
            lineStyle = 'text-[#8b949e]';
          } else if (line.startsWith('===============')) {
            lineStyle = 'text-[#30363d]';
          }

          return (
            <div key={idx} className={`whitespace-pre-wrap ${lineStyle}`}>
              {line}
            </div>
          );
        })}

        {/* Current Active Input Prompt */}
        <form onSubmit={handleCommandSubmit} className="flex items-center gap-1 pt-1">
          <span className="text-[#3fb950] font-bold shrink-0">{currentPrompt}</span>
          <input
            ref={inputRef}
            type={step.type === 'LOGIN_PASSWORD' ? 'password' : 'text'}
            value={inputVal}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length > 100) {
                appendToHistory(
                  `[Превышение потока ввода: ${val.length} симв.]`,
                  'Ошибка: Неверный ввод (слишком длинное предложение, лимит 100 символов). Ввод сброшен.'
                );
                setInputVal('');
              } else {
                setInputVal(val);
              }
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-[#c9d1d9] font-mono text-sm p-0 m-0 focus:ring-0"
            spellCheck={false}
            autoComplete="off"
            maxLength={120}
          />
        </form>

        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Status bar */}
      <div className="px-4 py-1.5 bg-[#161b22] border-t border-[#30363d] text-[11px] text-[#8b949e] flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <span>
            Статус:{' '}
            <strong className="text-[#3fb950]">
              {currentUser ? `В сети (${currentUser.username} - ${currentUser.role})` : 'Ожидание авторизации'}
            </strong>
          </span>
          <span className="text-[#30363d]">|</span>
          <span>Навигация: ↑ / ↓ (история ввода)</span>
        </div>
        <div>
          <span>chcp 65001 • UTF-8 • Java 24 (pks_matches)</span>
        </div>
      </div>
    </div>
  );
}
