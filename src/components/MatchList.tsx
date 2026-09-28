import React, { useState } from 'react';
import { Match, Tournament, MatchStatus, TournamentStage, User } from '../types/pks';
import {
  Play,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Trophy,
  Calendar,
  Clock,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  tournaments: Tournament[];
  currentUser: User | null;
  onStartMatch: (id: number) => void;
  onFinishMatch: (id: number) => void;
  onUpdateScore: (id: number, score1: number, score2: number) => void;
  onCancelMatch: (id: number) => void;
  onDeleteMatch: (id: number) => void;
  onOpenAddModal: () => void;
}

const STAGE_LABELS: Record<TournamentStage, { label: string; color: string }> = {
  GROUP: { label: 'Групповой этап', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  QUARTER_FINAL: { label: '1/4 финала', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  SEMI_FINAL: { label: '1/2 финала', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  FINAL: { label: 'Финал', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

const STATUS_CONFIG: Record<MatchStatus, { label: string; badge: string }> = {
  SCHEDULED: { label: 'Запланирован', badge: 'bg-slate-700/60 text-slate-300 border-slate-600' },
  LIVE: { label: 'В ПРЯМОМ ЭФИРЕ', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse' },
  FINISHED: { label: 'Завершён', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  CANCELLED: { label: 'Отменён', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
};

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  tournaments,
  currentUser,
  onStartMatch,
  onFinishMatch,
  onUpdateScore,
  onCancelMatch,
  onDeleteMatch,
  onOpenAddModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatchStatus>('ALL');
  const [tournamentFilter, setTournamentFilter] = useState<number | 'ALL'>('ALL');
  const [editingScoreId, setEditingScoreId] = useState<number | null>(null);
  const [score1Input, setScore1Input] = useState<number>(0);
  const [score2Input, setScore2Input] = useState<number>(0);

  const filteredMatches = matches.filter(m => {
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (tournamentFilter !== 'ALL' && m.tournamentId !== tournamentFilter) return false;
    return true;
  });

  const liveCount = matches.filter(m => m.status === 'LIVE').length;

  const handleOpenScoreEdit = (m: Match) => {
    setEditingScoreId(m.id);
    setScore1Input(m.score1);
    setScore2Input(m.score2);
  };

  const handleSaveScore = (id: number) => {
    onUpdateScore(id, Math.max(0, score1Input), Math.max(0, score2Input));
    setEditingScoreId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top action & Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Все ({matches.length})
          </button>
          <button
            onClick={() => setStatusFilter('LIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'LIVE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            Live ({liveCount})
          </button>
          <button
            onClick={() => setStatusFilter('SCHEDULED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              statusFilter === 'SCHEDULED'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Запланированные
          </button>
          <button
            onClick={() => setStatusFilter('FINISHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              statusFilter === 'FINISHED'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Завершённые
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Отменённые
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={tournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Все турниры</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            Добавить матч
          </button>
        </div>
      </div>

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Матчей не найдено</p>
          <p className="text-xs text-slate-500 mt-1">
            Измените фильтр или создайте новый матч с помощью кнопки выше.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map(m => {
            const tournament = tournaments.find(t => t.id === m.tournamentId);
            const stageConfig = STAGE_LABELS[m.stage] || { label: m.stage, color: 'bg-slate-800 text-slate-400' };
            const statusConfig = STATUS_CONFIG[m.status];
            const isEditingThisScore = editingScoreId === m.id;

            return (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Tournament & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs text-indigo-400 font-medium flex items-center gap-1 truncate max-w-[200px]">
                      <Trophy className="w-3.5 h-3.5 shrink-0" />
                      {tournament?.name || 'Турнир не указан'}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${stageConfig.color}`}>
                        {stageConfig.label}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${statusConfig.badge}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Teams and Score Presentation */}
                  <div className="my-4 bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
                    <div className="flex items-center justify-between gap-4">
                      {/* Team 1 */}
                      <div className="flex-1 text-right">
                        <div className="text-base font-bold text-slate-100 truncate" title={m.team1}>
                          {m.team1}
                        </div>
                        <div className="text-[11px] text-slate-500">Хозяева</div>
                      </div>

                      {/* Score Box */}
                      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-700/80">
                        {isEditingThisScore ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={score1Input}
                              onChange={(e) => setScore1Input(Number(e.target.value))}
                              className="w-12 bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-center text-sm font-bold text-white"
                            />
                            <span className="text-slate-500 font-bold">:</span>
                            <input
                              type="number"
                              min="0"
                              value={score2Input}
                              onChange={(e) => setScore2Input(Number(e.target.value))}
                              className="w-12 bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-center text-sm font-bold text-white"
                            />
                          </div>
                        ) : (
                          <div className="text-xl font-mono font-black tracking-wider text-slate-100">
                            {m.score1} : {m.score2}
                          </div>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div className="flex-1 text-left">
                        <div className="text-base font-bold text-slate-100 truncate" title={m.team2}>
                          {m.team2}
                        </div>
                        <div className="text-[11px] text-slate-500">Гости</div>
                      </div>
                    </div>

                    {isEditingThisScore && (
                      <div className="flex justify-center gap-2 mt-3 pt-3 border-t border-slate-800">
                        <button
                          onClick={() => handleSaveScore(m.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded cursor-pointer transition"
                        >
                          Сохранить счёт
                        </button>
                        <button
                          onClick={() => setEditingScoreId(null)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded cursor-pointer transition"
                        >
                          Отмена
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Match Date and Info */}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {m.matchDate.replace('T', ' ')}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>ID #{m.id}</span>
                  </div>
                </div>

                {/* Match Operations Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Action: Start match (Only for SCHEDULED) */}
                    {m.status === 'SCHEDULED' && (
                      <button
                        onClick={() => onStartMatch(m.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium rounded border border-emerald-500/40 cursor-pointer transition"
                        title="Перевести матч в Live"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Начать Live
                      </button>
                    )}

                    {/* Action: Update score (LIVE or SCHEDULED) */}
                    {m.status !== 'CANCELLED' && !isEditingThisScore && (
                      <button
                        onClick={() => handleOpenScoreEdit(m)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded border border-slate-700 cursor-pointer transition"
                      >
                        Счёт {m.status === 'LIVE' ? '⚡' : ''}
                      </button>
                    )}

                    {/* Quick increment for Live matches */}
                    {m.status === 'LIVE' && !isEditingThisScore && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdateScore(m.id, m.score1 + 1, m.score2)}
                          className="px-1.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-[11px] rounded border border-indigo-800 cursor-pointer"
                          title={`+1 для ${m.team1}`}
                        >
                          +1 {m.team1.slice(0, 4)}
                        </button>
                        <button
                          onClick={() => onUpdateScore(m.id, m.score1, m.score2 + 1)}
                          className="px-1.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-[11px] rounded border border-indigo-800 cursor-pointer"
                          title={`+1 для ${m.team2}`}
                        >
                          +1 {m.team2.slice(0, 4)}
                        </button>
                      </div>
                    )}

                    {/* Action: Finish match (Only for LIVE) */}
                    {m.status === 'LIVE' && (
                      <button
                        onClick={() => onFinishMatch(m.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded cursor-pointer transition"
                        title="Завершить матч со текущим счётом"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Завершить
                      </button>
                    )}

                    {/* Action: Cancel match (SCHEDULED or LIVE, not FINISHED) */}
                    {m.status !== 'FINISHED' && m.status !== 'CANCELLED' && (
                      <button
                        onClick={() => onCancelMatch(m.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs rounded border border-rose-800/50 cursor-pointer transition"
                        title="Отменить матч"
                      >
                        <XCircle className="w-3 h-3" />
                        Отменить
                      </button>
                    )}
                  </div>

                  {/* Delete match */}
                  <button
                    onClick={() => onDeleteMatch(m.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer ml-auto"
                    title="Удалить запись матча"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
