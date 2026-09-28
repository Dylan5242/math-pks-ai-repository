import React, { useState } from 'react';
import { Tournament, Match, User } from '../types/pks';
import { Trophy, Calendar, Plus, Trash2, AlertCircle, ShieldAlert, Check } from 'lucide-react';

interface TournamentsViewProps {
  tournaments: Tournament[];
  matches: Match[];
  currentUser: User | null;
  onAddTournament: (tournament: Omit<Tournament, 'id'>) => void;
  onDeleteTournament: (id: number) => void;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  tournaments,
  matches,
  currentUser,
  onAddTournament,
  onDeleteTournament,
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAdmin) {
      setError('Ошибка: Требуются права администратора (ADMIN). Войдите как admin.');
      return;
    }

    const tName = name.trim();
    if (!tName) {
      setError('Название турнира не может быть пустым.');
      return;
    }
    if (!startDate) {
      setError('Дата начала турнира обязательна.');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('Ошибка: Дата окончания не может быть раньше даты начала!');
      return;
    }

    onAddTournament({
      name: tName,
      startDate,
      endDate: endDate || null,
    });

    setName('');
    setStartDate('');
    setEndDate('');
    setSuccess(`Турнир "${tName}" успешно создан!`);
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tournaments List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-400" />
            Список турниров ({tournaments.length})
          </h2>
        </div>

        {tournaments.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            Нет доступных турниров.
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map((t) => {
              const tourMatches = matches.filter((m) => m.tournamentId === t.id);
              const liveInTour = tourMatches.filter((m) => m.status === 'LIVE').length;

              return (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        ID: {t.id}
                      </span>
                      <h3 className="text-base font-bold text-white">{t.name}</h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Период: {t.startDate} {t.endDate ? `— ${t.endDate}` : '(идет)'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>Матчей: <strong className="text-slate-200">{tourMatches.length}</strong></span>
                      {liveInTour > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[11px] font-semibold">
                          Live: {liveInTour}
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => onDeleteTournament(t.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer self-end sm:self-center"
                      title="Удалить турнир (каскадно удалит его матчи)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Tournament Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm h-fit">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-indigo-400" />
          Добавить турнир
        </h3>

        {!isAdmin && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Требуются права ADMIN:</strong> Только администратор может создавать турниры согласно Java-сервису.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Название турнира
            </label>
            <input
              type="text"
              placeholder="например: Кубок России 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Дата начала
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Дата окончания (необязательно)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={!isAdmin}
            className={`w-full py-2 px-4 rounded-lg text-xs font-semibold shadow transition flex items-center justify-center gap-1.5 ${
              isAdmin
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Создать турнир
          </button>
        </form>
      </div>
    </div>
  );
};
