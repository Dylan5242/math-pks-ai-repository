import React, { useState } from 'react';
import { Match, Tournament, TournamentStage } from '../types/pks';
import { X, AlertCircle, PlusCircle } from 'lucide-react';

interface AddMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournaments: Tournament[];
  onAddMatch: (match: Omit<Match, 'id'>) => void;
}

export const AddMatchModal: React.FC<AddMatchModalProps> = ({
  isOpen,
  onClose,
  tournaments,
  onAddMatch,
}) => {
  const [tournamentId, setTournamentId] = useState<number>(tournaments[0]?.id || 1);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [matchDate, setMatchDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [stage, setStage] = useState<TournamentStage>('GROUP');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const t1 = team1.trim();
    const t2 = team2.trim();

    if (!tournamentId) {
      setError('Турнир обязателен.');
      return;
    }
    if (!t1) {
      setError('Название первой команды не может быть пустым.');
      return;
    }
    if (!t2) {
      setError('Название второй команды не может быть пустым.');
      return;
    }
    if (t1.toLowerCase() === t2.toLowerCase()) {
      setError('Команды должны различаться (team1 <> team2)!');
      return;
    }
    if (!matchDate) {
      setError('Дата и время матча обязательны.');
      return;
    }

    onAddMatch({
      tournamentId,
      team1: t1,
      team2: t2,
      matchDate,
      stage,
      status: 'SCHEDULED',
      score1: 0,
      score2: 0,
    });

    setTeam1('');
    setTeam2('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            Добавить новый матч
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Турнир
            </label>
            <select
              value={tournamentId}
              onChange={(e) => setTournamentId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Команда 1 (Хозяева)
              </label>
              <input
                type="text"
                placeholder="например: Локомотив"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Команда 2 (Гости)
              </label>
              <input
                type="text"
                placeholder="например: Ростов"
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Дата и время проведения
            </label>
            <input
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Этап турнира (Stage)
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as TournamentStage)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="GROUP">Групповой этап (GROUP)</option>
              <option value="QUARTER_FINAL">1/4 финала (QUARTER_FINAL)</option>
              <option value="SEMI_FINAL">1/2 финала (SEMI_FINAL)</option>
              <option value="FINAL">Финал (FINAL)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow cursor-pointer transition"
            >
              Создать матч
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
