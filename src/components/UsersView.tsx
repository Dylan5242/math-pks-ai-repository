import React, { useState } from 'react';
import { User, UserRole, javaHashCodeHex } from '../types/pks';
import { Users, UserPlus, Key, ShieldCheck, Shield, User as UserIcon, Trash2, AlertCircle, Check } from 'lucide-react';

interface UsersViewProps {
  users: User[];
  currentUser: User | null;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onDeleteUser: (username: string) => void;
  onSelectAsCurrent: (user: User) => void;
}

const ROLE_BADGES: Record<UserRole, { label: string; color: string; icon: any }> = {
  ADMIN: { label: 'ADMIN', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: ShieldCheck },
  USER: { label: 'USER', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: Shield },
  GUEST: { label: 'GUEST', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30', icon: UserIcon },
};

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onAddUser,
  onDeleteUser,
  onSelectAsCurrent,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAdmin) {
      setError('Ошибка: Требуются права администратора (ADMIN).');
      return;
    }

    const u = username.trim();
    const p = password.trim();

    if (!u) {
      setError('Логин не может быть пустым.');
      return;
    }
    if (!p) {
      setError('Пароль не может быть пустым.');
      return;
    }
    if (users.some((user) => user.username.toLowerCase() === u.toLowerCase())) {
      setError('Ошибка: Пользователь с таким логином уже существует!');
      return;
    }

    const hash = javaHashCodeHex(p);
    onAddUser({
      username: u,
      password_hash: hash,
      role,
    });

    setUsername('');
    setPassword('');
    setSuccess(`Пользователь "${u}" успешно создан! (Хэш: ${hash})`);
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Users List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Зарегистрированные пользователи ({users.length})
          </h2>
          <span className="text-xs text-slate-400">
            Хэш паролей вычисляется методом <code>Integer.toHexString(hashCode())</code>
          </span>
        </div>

        <div className="space-y-3">
          {users.map((u) => {
            const roleConfig = ROLE_BADGES[u.role];
            const Icon = roleConfig.icon;
            const isSelf = currentUser?.id === u.id;

            return (
              <div
                key={u.id}
                className={`bg-slate-900 border rounded-xl p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelf ? 'border-indigo-500/60 ring-1 ring-indigo-500/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{u.username}</span>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-semibold">
                          Вы (активная сессия)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                      <span>ID: {u.id}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Key className="w-3 h-3" />
                        hash: {u.password_hash}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${roleConfig.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {roleConfig.label}
                  </span>

                  {!isSelf && (
                    <button
                      onClick={() => onSelectAsCurrent(u)}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer transition"
                      title="Войти под этим пользователем"
                    >
                      Войти
                    </button>
                  )}

                  {isAdmin && !isSelf && (
                    <button
                      onClick={() => onDeleteUser(u.username)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
                      title="Удалить пользователя"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add User Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm h-fit">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 text-indigo-400" />
          Добавить пользователя
        </h3>

        {!isAdmin && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Требуются права ADMIN:</strong> Создание новых пользователей доступно только администратору.
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
              Логин (username)
            </label>
            <input
              type="text"
              placeholder="например: referee1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Пароль
            </label>
            <input
              type="text"
              placeholder="пароль для хэширования"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
            {password && (
              <div className="mt-1 text-[11px] font-mono text-slate-400">
                Java hash: <span className="text-indigo-400">{javaHashCodeHex(password)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Роль пользователя
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="USER">USER (Пользователь)</option>
              <option value="ADMIN">ADMIN (Администратор)</option>
              <option value="GUEST">GUEST (Гость)</option>
            </select>
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
            <UserPlus className="w-3.5 h-3.5" />
            Создать пользователя
          </button>
        </form>
      </div>
    </div>
  );
};
