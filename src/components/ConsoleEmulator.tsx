import React, { useState, useEffect, useRef } from 'react';
import { User, Tournament, Match, javaHashCodeHex } from '../types/pks';
import { Terminal, CornerDownLeft, RotateCcw, Play, ShieldAlert, Sparkles } from 'lucide-react';

interface ConsoleEmulatorProps {
  users: User[];
  tournaments: Tournament[];
  matches: Match[];
  currentUser: User | null;
  onSetCurrentUser: (user: User | null) => void;
  onAddMatch: (match: Omit<Match, 'id'>) => void;
  onStartMatch: (id: number) => void;
  onFinishMatch: (id: number) => void;
  onUpdateScore: (id: number, score1: number, score2: number) => void;
  onCancelMatch: (id: number) => void;
  onAddTournament: (tournament: Omit<Tournament, 'id'>) => void;
  onAddUser: (user: Omit<User, 'id'>) => void;
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
  | { type: 'UPDATE_SCORE_1'; matchId: number }
  | { type: 'UPDATE_SCORE_2'; matchId: number; score1: number }
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

export const ConsoleEmulator: React.FC<ConsoleEmulatorProps> = ({
  users,
  tournaments,
  matches,
  currentUser,
  onSetCurrentUser,
  onAddMatch,
  onStartMatch,
  onFinishMatch,
  onUpdateScore,
  onCancelMatch,
  onAddTournament,
  onAddUser,
}) => {
  const [lines, setLines] = useState<string[]>([
    '=== Агрегатор матчей (Java 24 / Maven CLI Emulator) ===',
    'Запуск класса pksmatches.ui.ConsoleApp...',
    'Для входа используйте: admin / admin (или user / user)',
    'Логин: '
  ]);
  const [step, setStep] = useState<Step>({ type: 'LOGIN_USERNAME' });
  const [inputVal, setInputVal] = useState('');
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const addLine = (text: string) => {
    setLines(prev => [...prev, text]);
  };

  const printMenuPrompt = (user: User) => {
    setLines(prev => [
      ...prev,
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
      '0. Выход',
      'Выбор: '
    ]);
  };

  const printMatchesList = (list: Match[]) => {
    if (list.length === 0) {
      addLine('Матчей не найдено.');
      return;
    }
    const output: string[] = [];
    for (const m of list) {
      const tour = tournaments.find(t => t.id === m.tournamentId);
      const tourName = tour ? tour.name : 'Неизвестный турнир';
      const formattedDt = formatDateTime(m.matchDate);

      if (m.status === 'SCHEDULED') {
        output.push(`Матч команд ${m.team1} и ${m.team2} запланирован на ${formattedDt} стадии ${m.stage}`);
        output.push(`Турнир: ${tourName}`);
        output.push('===============');
      } else if (m.status === 'CANCELLED') {
        output.push(`Матч команд ${m.team1} и ${m.team2} отменён`);
        output.push(`Турнир: ${tourName}`);
        output.push('===============');
      } else if (m.status === 'FINISHED') {
        output.push(`Матч команд ${m.team1} и ${m.team2} завершён со счётом ${m.score1}:${m.score2}`);
        output.push(`Турнир: ${tourName}`);
        output.push('===============');
      } else if (m.status === 'LIVE') {
        output.push(`Матч команд ${m.team1} и ${m.team2} идёт со счётом ${m.score1}:${m.score2}`);
        output.push(`Турнир: ${tourName}`);
        output.push('===============');
      }
    }
    setLines(prev => [...prev, ...output]);
  };

  const handleCommand = (rawVal: string) => {
    const val = rawVal.trim();
    setInputVal('');
    addLine(`> ${rawVal}`);

    switch (step.type) {
      case 'LOGIN_USERNAME': {
        if (!val) {
          addLine('Логин не может быть пустым.');
          addLine('Логин: ');
          return;
        }
        setStep({ type: 'LOGIN_PASSWORD', username: val });
        addLine('Пароль: ');
        break;
      }

      case 'LOGIN_PASSWORD': {
        const username = step.username;
        const passwordHash = javaHashCodeHex(val);
        const user = users.find(u => u.username === username && u.password_hash === passwordHash);
        if (!user) {
          addLine('Неверный логин или пароль.');
          addLine('Попробуйте снова.');
          addLine('Логин: ');
          setStep({ type: 'LOGIN_USERNAME' });
          return;
        }
        onSetCurrentUser(user);
        addLine(`Добро пожаловать, ${user.username}!`);
        printMenuPrompt(user);
        setStep({ type: 'MENU' });
        break;
      }

      case 'MENU': {
        if (!currentUser) {
          addLine('Сессия завершена. Логин: ');
          setStep({ type: 'LOGIN_USERNAME' });
          return;
        }

        const choice = parseInt(val, 10);
        if (isNaN(choice)) {
          addLine('Введите целое число.');
          addLine('Выбор: ');
          return;
        }

        switch (choice) {
          case 1: { // Все матчи
            printMatchesList(matches);
            printMenuPrompt(currentUser);
            break;
          }
          case 2: { // Live-матчи
            printMatchesList(matches.filter(m => m.status === 'LIVE'));
            printMenuPrompt(currentUser);
            break;
          }
          case 3: { // Матчи турнира
            if (tournaments.length === 0) {
              addLine('Турниров нет.');
              printMenuPrompt(currentUser);
              return;
            }
            addLine('Выберите турнир:');
            tournaments.forEach((t, i) => {
              addLine(`${i + 1}. ${t.name}`);
            });
            addLine('Номер турнира: ');
            setStep({ type: 'SELECT_TOURNAMENT_FOR_MATCHES' });
            break;
          }
          case 4: { // Добавить матч
            if (tournaments.length === 0) {
              addLine('Сначала создайте хотя бы один турнир.');
              printMenuPrompt(currentUser);
              return;
            }
            addLine('Выберите турнир для нового матча:');
            tournaments.forEach((t, i) => {
              addLine(`${i + 1}. ${t.name}`);
            });
            addLine('Номер турнира: ');
            setStep({ type: 'ADD_MATCH_SELECT_TOURNAMENT' });
            break;
          }
          case 5: { // Начать матч
            const scheduled = matches.filter(m => m.status === 'SCHEDULED');
            if (scheduled.length === 0) {
              addLine('Нет запланированных матчей для запуска.');
              printMenuPrompt(currentUser);
              return;
            }
            addLine('Выберите матч для запуска в Live:');
            scheduled.forEach((m, idx) => {
              addLine(`${idx + 1}. Матч команд ${m.team1} и ${m.team2} (ID=${m.id})`);
            });
            addLine('Выберите матч: ');
            setStep({ type: 'START_MATCH_SELECT' });
            break;
          }
          case 6: { // Завершить матч
            const live = matches.filter(m => m.status === 'LIVE');
            if (live.length === 0) {
              addLine('Нет идущих Live-матчей для завершения.');
              printMenuPrompt(currentUser);
              return;
            }
            addLine('Выберите Live-матч для завершения:');
            live.forEach((m, idx) => {
              addLine(`${idx + 1}. Матч ${m.team1} vs ${m.team2} (${m.score1}:${m.score2})`);
            });
            addLine('Выберите матч: ');
            setStep({ type: 'FINISH_MATCH_SELECT' });
            break;
          }
          case 7: { // Обновить счёт
            if (matches.length === 0) {
              addLine('Матчей нет.');
              printMenuPrompt(currentUser);
              return;
            }
            addLine('Выберите матч для обновления счёта:');
            matches.forEach((m, idx) => {
              addLine(`${idx + 1}. Матч ${m.team1} vs ${m.team2} [${m.status}] (Счёт ${m.score1}:${m.score2})`);
            });
            addLine('Выберите матч: ');
            setStep({ type: 'UPDATE_SCORE_SELECT' });
            break;
          }
          case 8: { // Отменить матч
            const cancellable = matches.filter(m => m.status !== 'FINISHED' && m.status !== 'CANCELLED');
            if (cancellable.length === 0) {
              addLine('Нет доступных матчей для отмены (завершённые матчи отменять нельзя).');
              printMenuPrompt(currentUser);
              return;
            }
            addLine('Выберите матч для отмены:');
            cancellable.forEach((m, idx) => {
              addLine(`${idx + 1}. Матч ${m.team1} vs ${m.team2} [${m.status}]`);
            });
            addLine('Выберите матч: ');
            setStep({ type: 'CANCEL_MATCH_SELECT' });
            break;
          }
          case 9: { // Список турниров
            if (tournaments.length === 0) {
              addLine('Турниров нет.');
            } else {
              tournaments.forEach(t => {
                const s = formatDate(t.startDate);
                const e = t.endDate ? formatDate(t.endDate) : 'не указана';
                addLine(`Турнир ${t.name} начинается ${s}, заканчивается ${e}`);
              });
            }
            printMenuPrompt(currentUser);
            break;
          }
          case 10: { // Добавить турнир (ADMIN only)
            if (currentUser.role !== 'ADMIN') {
              addLine('Ошибка: Требуются права администратора.');
              printMenuPrompt(currentUser);
              return;
            }
            addLine('Название турнира: ');
            setStep({ type: 'ADD_TOURNAMENT_NAME' });
            break;
          }
          case 11: { // Список пользователей (ADMIN only)
            if (currentUser.role !== 'ADMIN') {
              addLine('Ошибка: Требуются права администратора.');
              printMenuPrompt(currentUser);
              return;
            }
            users.forEach(u => {
              addLine(`${u.id}. Пользователь ${u.username} имеет роль ${u.role}`);
            });
            printMenuPrompt(currentUser);
            break;
          }
          case 12: { // Добавить пользователя (ADMIN only)
            if (currentUser.role !== 'ADMIN') {
              addLine('Ошибка: Требуются права администратора.');
              printMenuPrompt(currentUser);
              return;
            }
            addLine('Логин: ');
            setStep({ type: 'ADD_USER_LOGIN' });
            break;
          }
          case 0: { // Выход
            addLine('До свидания.');
            onSetCurrentUser(null);
            addLine('');
            addLine('=== Агрегатор матчей ===');
            addLine('Логин: ');
            setStep({ type: 'LOGIN_USERNAME' });
            break;
          }
          default:
            addLine('Неверный пункт меню.');
            addLine('Выбор: ');
        }
        break;
      }

      case 'SELECT_TOURNAMENT_FOR_MATCHES': {
        const idx = parseInt(val, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= tournaments.length) {
          addLine('Неверный выбор.');
        } else {
          const tour = tournaments[idx];
          const tourMatches = matches.filter(m => m.tournamentId === tour.id);
          printMatchesList(tourMatches);
        }
        if (currentUser) printMenuPrompt(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // ADD MATCH WIZARD
      case 'ADD_MATCH_SELECT_TOURNAMENT': {
        const idx = parseInt(val, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= tournaments.length) {
          addLine('Неверный выбор турнира. Отмена.');
          if (currentUser) printMenuPrompt(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        const selectedTour = tournaments[idx];
        setStep({ type: 'ADD_MATCH_TEAM1', tournamentId: selectedTour.id });
        addLine(`Выбран турнир: ${selectedTour.name}`);
        addLine('Команда 1: ');
        break;
      }

      case 'ADD_MATCH_TEAM1': {
        if (!val) {
          addLine('Название команды не может быть пустым. Команда 1: ');
          return;
        }
        setStep({ type: 'ADD_MATCH_TEAM2', tournamentId: step.tournamentId, team1: val });
        addLine('Команда 2: ');
        break;
      }

      case 'ADD_MATCH_TEAM2': {
        if (!val) {
          addLine('Название команды не может быть пустым. Команда 2: ');
          return;
        }
        if (val.trim().toLowerCase() === step.team1.trim().toLowerCase()) {
          addLine('Ошибка: Команды должны различаться (team1 <> team2)!');
          addLine('Команда 2: ');
          return;
        }
        setStep({
          type: 'ADD_MATCH_DATE',
          tournamentId: step.tournamentId,
          team1: step.team1,
          team2: val,
        });
        addLine('Дата и время матча (формат dd.MM.yyyy HH:mm, например 15.07.2024 18:00): ');
        break;
      }

      case 'ADD_MATCH_DATE': {
        // Parse dd.MM.yyyy HH:mm
        const regex = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/;
        const match = val.match(regex);
        let isoDate = '';
        if (match) {
          const [, day, month, year, hours, minutes] = match;
          isoDate = `${year}-${month}-${day}T${hours}:${minutes}`;
        } else {
          addLine('Неверный формат даты и времени. Используем текущую дату/время.');
          isoDate = new Date().toISOString().slice(0, 16);
        }
        setStep({
          type: 'ADD_MATCH_STAGE',
          tournamentId: step.tournamentId,
          team1: step.team1,
          team2: step.team2,
          date: isoDate,
        });
        addLine('Этап (GROUP/QUARTER_FINAL/SEMI_FINAL/FINAL): ');
        break;
      }

      case 'ADD_MATCH_STAGE': {
        let stage: any = val.toUpperCase();
        if (!['GROUP', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'].includes(stage)) {
          addLine('Неверный этап. Установлен GROUP.');
          stage = 'GROUP';
        }
        onAddMatch({
          tournamentId: step.tournamentId,
          team1: step.team1,
          team2: step.team2,
          matchDate: step.date,
          stage,
          status: 'SCHEDULED',
          score1: 0,
          score2: 0,
        });
        addLine('Матч успешно добавлен!');
        if (currentUser) printMenuPrompt(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // START MATCH
      case 'START_MATCH_SELECT': {
        const scheduled = matches.filter(m => m.status === 'SCHEDULED');
        const idx = parseInt(val, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= scheduled.length) {
          addLine('Неверный выбор.');
        } else {
          onStartMatch(scheduled[idx].id);
          addLine(`Матч ${scheduled[idx].team1} vs ${scheduled[idx].team2} переведён в статус LIVE!`);
        }
        if (currentUser) printMenuPrompt(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // FINISH MATCH
      case 'FINISH_MATCH_SELECT': {
        const live = matches.filter(m => m.status === 'LIVE');
        const idx = parseInt(val, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= live.length) {
          addLine('Неверный выбор.');
        } else {
          onFinishMatch(live[idx].id);
          addLine(`Матч ${live[idx].team1} vs ${live[idx].team2} завершён! Финальный счёт: ${live[idx].score1}:${live[idx].score2}`);
        }
        if (currentUser) printMenuPrompt(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // UPDATE SCORE
      case 'UPDATE_SCORE_SELECT': {
        const idx = parseInt(val, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= matches.length) {
          addLine('Неверный выбор.');
          if (currentUser) printMenuPrompt(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        const target = matches[idx];
        if (target.status === 'CANCELLED') {
          addLine('Ошибка: Нельзя менять счёт отменённого матча');
          if (currentUser) printMenuPrompt(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        setStep({ type: 'UPDATE_SCORE_1', matchId: target.id });
        addLine(`Счёт для команды ${target.team1}: `);
        break;
      }

      case 'UPDATE_SCORE_1': {
        const s1 = parseInt(val, 10);
        if (isNaN(s1) || s1 < 0) {
          addLine('Счёт не может быть отрицательным. Счёт для команды 1: ');
          return;
        }
        const target = matches.find(m => m.id === step.matchId);
        setStep({ type: 'UPDATE_SCORE_2', matchId: step.matchId, score1: s1 });
        addLine(`Счёт для команды ${target ? target.team2 : '2'}: `);
        break;
      }

      case 'UPDATE_SCORE_2': {
        const s2 = parseInt(val, 10);
        if (isNaN(s2) || s2 < 0) {
          addLine('Счёт не может быть отрицательным. Счёт для команды 2: ');
          return;
        }
        onUpdateScore(step.matchId, step.score1, s2);
        addLine(`Счёт обновлён: ${step.score1} : ${s2}`);
        if (currentUser) printMenuPrompt(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // CANCEL MATCH
      case 'CANCEL_MATCH_SELECT': {
        const cancellable = matches.filter(m => m.status !== 'FINISHED' && m.status !== 'CANCELLED');
        const idx = parseInt(val, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= cancellable.length) {
          addLine('Неверный выбор.');
        } else {
          onCancelMatch(cancellable[idx].id);
          addLine(`Матч ${cancellable[idx].team1} vs ${cancellable[idx].team2} отменён.`);
        }
        if (currentUser) printMenuPrompt(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // ADD TOURNAMENT
      case 'ADD_TOURNAMENT_NAME': {
        if (!val) {
          addLine('Поле не может быть пустым. Название турнира: ');
          return;
        }
        setStep({ type: 'ADD_TOURNAMENT_START', name: val });
        addLine('Дата начала (dd.MM.yyyy): ');
        break;
      }

      case 'ADD_TOURNAMENT_START': {
        const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
        const match = val.match(regex);
        if (!match) {
          addLine('Неверный формат даты. Дата начала (dd.MM.yyyy): ');
          return;
        }
        const iso = `${match[3]}-${match[2]}-${match[1]}`;
        setStep({ type: 'ADD_TOURNAMENT_END', name: step.name, start: iso });
        addLine('Дата окончания (dd.MM.yyyy): ');
        break;
      }

      case 'ADD_TOURNAMENT_END': {
        const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
        const match = val.match(regex);
        if (!match) {
          addLine('Неверный формат даты. Дата окончания (dd.MM.yyyy): ');
          return;
        }
        const isoEnd = `${match[3]}-${match[2]}-${match[1]}`;
        if (isoEnd < step.start) {
          addLine('Ошибка: Дата окончания не может быть раньше даты начала');
          addLine('Дата окончания (dd.MM.yyyy): ');
          return;
        }
        onAddTournament({
          name: step.name,
          startDate: step.start,
          endDate: isoEnd,
        });
        addLine(`Турнир "${step.name}" успешно добавлен.`);
        if (currentUser) printMenuPrompt(currentUser);
        setStep({ type: 'MENU' });
        break;
      }

      // ADD USER
      case 'ADD_USER_LOGIN': {
        if (!val) {
          addLine('Логин не может быть пустым. Логин: ');
          return;
        }
        if (users.some(u => u.username.toLowerCase() === val.toLowerCase())) {
          addLine('Ошибка: Пользователь с таким логином уже существует');
          if (currentUser) printMenuPrompt(currentUser);
          setStep({ type: 'MENU' });
          return;
        }
        setStep({ type: 'ADD_USER_PASSWORD', username: val });
        addLine('Пароль: ');
        break;
      }

      case 'ADD_USER_PASSWORD': {
        if (!val) {
          addLine('Пароль не может быть пустым. Пароль: ');
          return;
        }
        const hash = javaHashCodeHex(val);
        setStep({ type: 'ADD_USER_ROLE', username: step.username, passwordHash: hash });
        addLine('Роль (ADMIN/USER/GUEST, по умолчанию USER): ');
        break;
      }

      case 'ADD_USER_ROLE': {
        let role: any = val.toUpperCase();
        if (!['ADMIN', 'USER', 'GUEST'].includes(role)) {
          addLine('Неверная роль. Установлена USER.');
          role = 'USER';
        }
        onAddUser({
          username: step.username,
          password_hash: step.passwordHash,
          role,
        });
        addLine(`Пользователь "${step.username}" (${role}) успешно создан.`);
        if (currentUser) printMenuPrompt(currentUser);
        setStep({ type: 'MENU' });
        break;
      }
    }
  };

  const resetTerminal = () => {
    onSetCurrentUser(null);
    setLines([
      '=== Агрегатор матчей (Java 24 / Maven CLI Emulator) ===',
      'Перезапуск pksmatches.ui.ConsoleApp...',
      'Логин: '
    ]);
    setStep({ type: 'LOGIN_USERNAME' });
  };

  const quickLogin = (u: string, p: string) => {
    addLine(`> Быстрый вход: ${u} / ${p}`);
    const hash = javaHashCodeHex(p);
    const user = users.find(usr => usr.username === u && usr.password_hash === hash);
    if (user) {
      onSetCurrentUser(user);
      addLine(`Добро пожаловать, ${user.username}!`);
      printMenuPrompt(user);
      setStep({ type: 'MENU' });
    } else {
      addLine('Ошибка аутентификации.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-sm">
      {/* Top Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-xs text-slate-400 font-semibold tracking-wide ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            pksmatches.ui.ConsoleApp — JVM Terminal
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetTerminal}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition border border-slate-700 cursor-pointer"
            title="Перезапустить CLI"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            Перезапуск
          </button>
        </div>
      </div>

      {/* Quick Access Badges for Testing */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 flex-wrap text-xs text-slate-400">
        <span className="text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Быстрый логин:
        </span>
        <button
          onClick={() => quickLogin('admin', 'admin')}
          className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900 transition cursor-pointer"
        >
          🔑 admin / admin (ADMIN)
        </button>
        <button
          onClick={() => quickLogin('user', 'user')}
          className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
        >
          👤 user / user (USER)
        </button>
        {currentUser && (
          <span className="ml-auto text-emerald-400 flex items-center gap-1 font-sans text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Сессия: <strong>{currentUser.username}</strong> ({currentUser.role})
          </span>
        )}
      </div>

      {/* Output Console View */}
      <div
        className="flex-1 p-4 overflow-y-auto space-y-1.5 text-xs sm:text-sm bg-slate-950 select-text"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, idx) => {
          let lineClass = 'text-slate-300';
          if (line.startsWith('===')) lineClass = 'text-amber-400 font-bold';
          else if (line.startsWith('>')) lineClass = 'text-emerald-400 font-semibold';
          else if (line.startsWith('Ошибка') || line.includes('Неверн') || line.includes('Требуются права')) lineClass = 'text-rose-400 font-semibold';
          else if (line.includes('успешно') || line.includes('Добро пожаловать')) lineClass = 'text-emerald-300';
          else if (line.startsWith('Пользователь:')) lineClass = 'text-cyan-300 font-semibold';
          else if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.')) lineClass = 'text-slate-400';
          else if (line.startsWith('=======')) lineClass = 'text-slate-600';

          return (
            <div key={idx} className={`leading-relaxed whitespace-pre-wrap ${lineClass}`}>
              {line}
            </div>
          );
        })}
        <div ref={terminalBottomRef} />
      </div>

      {/* Input Prompt bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCommand(inputVal);
        }}
        className="flex items-center gap-2 p-3 bg-slate-900 border-t border-slate-800"
      >
        <span className="text-emerald-400 font-bold select-none">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Введите команду или ответ на запрос консоли..."
          className="flex-1 bg-transparent border-0 text-white placeholder-slate-500 focus:outline-none focus:ring-0 font-mono text-sm"
          autoFocus
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-sans font-medium flex items-center gap-1.5 cursor-pointer transition shadow"
        >
          <span>Ввод</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
