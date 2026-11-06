import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  Search,
  Shield,
  Loader2,
  Sparkles
} from 'lucide-react';
import {
  AppUser,
  getLocalUsers,
  loadUsersFromFirestore,
  updateUserCode,
  findUserByCode,
  formatUserName
} from '../utils/userAuth';
import { getUserProfile } from '../data/avatars';

interface LoginModalProps {
  onLogin: (station: 'Estación 1' | 'Estación 2', userName: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [users, setUsers] = useState<AppUser[]>(() => getLocalUsers());

  // Login form state
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [station, setStation] = useState<'Estación 1' | 'Estación 2' | null>(null);
  const [loginError, setLoginError] = useState('');

  // Forgot password state
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showNewCode, setShowNewCode] = useState(false);
  const [forgotStation, setForgotStation] = useState<'Estación 1' | 'Estación 2' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Sync users with Firestore on mount
  useEffect(() => {
    let isMounted = true;
    loadUsersFromFirestore()
      .then(loaded => {
        if (isMounted && loaded && loaded.length > 0) {
          setUsers(loaded);
        }
      })
      .catch(err => console.warn('[LoginModal] Firestore sync error:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!code.trim()) {
      setLoginError('Por favor ingrese su código de acceso.');
      return;
    }
    if (!station) {
      setLoginError('Por favor seleccione una estación (Estación 1 o Estación 2).');
      return;
    }

    const matchedUser = findUserByCode(code.trim(), users);
    if (matchedUser) {
      onLogin(station, matchedUser.name);
    } else {
      setLoginError('Código incorrecto. Si lo olvidaste, pulsa "¿Has olvidado tu código?" abajo.');
    }
  };

  const handleUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!selectedUser) {
      setForgotError('Por favor selecciona tu perfil de la lista.');
      return;
    }

    const cleanCode = newCode.trim();
    if (!cleanCode || cleanCode.length < 3) {
      setForgotError('El código debe tener al menos 3 caracteres o dígitos.');
      return;
    }

    if (cleanCode !== confirmCode.trim()) {
      setForgotError('Los códigos no coinciden. Verifícalos e intenta de nuevo.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateUserCode(selectedUser.name, cleanCode);
      if (res.success) {
        // Refresh local users list
        const updatedUsers = users.map(u =>
          u.name.toLowerCase() === selectedUser.name.toLowerCase()
            ? { ...u, password: cleanCode }
            : u
        );
        setUsers(updatedUsers);
        setForgotSuccess(`¡Código actualizado con éxito para ${formatUserName(selectedUser.name)}!`);

        // If station was selected, allow immediate entry after brief pause
        if (forgotStation) {
          setTimeout(() => {
            onLogin(forgotStation, selectedUser.name);
          }, 1200);
        } else {
          // Prefill in login view and return
          setTimeout(() => {
            setCode(cleanCode);
            setMode('login');
            setLoginError('');
            setForgotSuccess('');
            setSelectedUser(null);
            setNewCode('');
            setConfirmCode('');
          }, 1400);
        }
      } else {
        setForgotError(res.error || 'Error al actualizar el código.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Error de conexión al actualizar el código.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchFilter.trim().toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#1c1e28]/85 backdrop-blur-md p-4 overflow-y-auto">
      {mode === 'login' ? (
        /* ======================== LOGIN VIEW ======================== */
        <div className="bg-[#262835] border border-[#3e4153] w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-200">
          {/* Logo / Badge */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#b82733] to-[#e63946] flex items-center justify-center shadow-lg shadow-rose-950/40 mb-3 border border-rose-400/30">
              <KeyRound className="w-7 h-7 text-white stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Acceso STS Security
            </h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>AI-zen · Asistente Control y Monitoreo</span>
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Password input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Código de Inicio
              </label>
              <div className="relative">
                <input
                  type={showCode ? 'text' : 'password'}
                  placeholder="Ingrese su código de acceso"
                  value={code}
                  onChange={e => {
                    setCode(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  autoFocus
                  className="w-full px-4 py-3.5 pr-12 rounded-xl bg-[#1d1f2b] border border-[#3e4153] text-white placeholder-slate-500 focus:border-[#ca4048] focus:ring-2 focus:ring-[#ca4048]/20 outline-none transition-all text-base tracking-wider font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                  title={showCode ? 'Ocultar código' : 'Mostrar código'}
                >
                  {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Station selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Seleccione su Estación
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['Estación 1', 'Estación 2'] as const).map(s => {
                  const isSelected = station === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setStation(s);
                        if (loginError) setLoginError('');
                      }}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#ca4048] to-[#b5343c] border-[#ca4048] text-white shadow-md shadow-rose-950/30 scale-[1.02]'
                          : 'bg-[#1d1f2b] border-[#3e4153] text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
                      <span>{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ca4048] to-[#b82733] text-white font-bold text-base hover:from-[#b5343c] hover:to-[#a11f2a] transition-all shadow-lg shadow-rose-900/30 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Ingresar al Sistema</span>
            </button>

            {/* Forgot Password Button */}
            <div className="pt-2 text-center border-t border-[#3e4153]/50">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setSelectedUser(null);
                  setNewCode('');
                  setConfirmCode('');
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>¿Has olvidado tu código?</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ======================== FORGOT / CHANGE CODE VIEW ======================== */
        <div className="bg-[#262835] border border-[#3e4153] w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-200 my-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#3e4153]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setForgotError('');
                setForgotSuccess('');
              }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio de sesión</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400 bg-[#1d1f2b] px-2.5 py-1 rounded-full border border-[#3e4153]">
              Recuperación de Código
            </span>
          </div>

          <div className="mt-4 mb-5">
            <h3 className="text-xl font-extrabold text-white">¿Has olvidado tu código?</h3>
            <p className="text-xs text-slate-400 mt-1">
              Selecciona tu perfil de usuario para crear y asignar un nuevo código de acceso.
            </p>
          </div>

          {/* Quick search input */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por tu nombre..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1d1f2b] border border-[#3e4153] text-sm text-white placeholder-slate-500 focus:border-[#ca4048] outline-none transition-all"
            />
          </div>

          {/* User profile selection grid */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Selecciona tu perfil ({filteredUsers.length} disponibles)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
              {filteredUsers.map(u => {
                const isSelected = selectedUser?.name.toLowerCase() === u.name.toLowerCase();
                const profile = getUserProfile(u.name);
                const isAdmin = u.name.toLowerCase() === 'fabian';

                return (
                  <button
                    key={u.name}
                    type="button"
                    onClick={() => {
                      setSelectedUser(u);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-rose-950/40 border-[#ca4048] ring-2 ring-[#ca4048]/30 shadow-md scale-[1.02]'
                        : 'bg-[#1d1f2b] border-[#3e4153] hover:border-slate-500 hover:bg-[#202230]'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                      style={{
                        backgroundColor: profile.bgColor || '#334155',
                        color: profile.textColor || '#ffffff'
                      }}
                    >
                      {profile.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">
                        {formatUserName(u.name)}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        {isAdmin ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> Admin
                          </span>
                        ) : (
                          <span>Operador</span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-rose-400 stroke-[3] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* New Code Form (Active when user selected) */}
          {selectedUser ? (
            <form onSubmit={handleUpdateCode} className="space-y-4 pt-4 border-t border-[#3e4153]/80">
              <div className="flex items-center justify-between bg-[#1d1f2b] p-3 rounded-xl border border-[#3e4153]">
                <div className="text-xs">
                  <span className="text-slate-400">Perfil seleccionado:</span>{' '}
                  <span className="font-bold text-white text-sm">
                    {formatUserName(selectedUser.name)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Cambiar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* New code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nuevo Código
                  </label>
                  <div className="relative">
                    <input
                      type={showNewCode ? 'text' : 'password'}
                      placeholder="Mínimo 3 dígitos"
                      value={newCode}
                      onChange={e => setNewCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#1d1f2b] border border-[#3e4153] text-sm text-white placeholder-slate-500 focus:border-[#ca4048] outline-none font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewCode(!showNewCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showNewCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirmar Código
                  </label>
                  <input
                    type={showNewCode ? 'text' : 'password'}
                    placeholder="Repita el código"
                    value={confirmCode}
                    onChange={e => setConfirmCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1d1f2b] border border-[#3e4153] text-sm text-white placeholder-slate-500 focus:border-[#ca4048] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Station selection if they want to enter directly */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Estación (Opcional para ingresar directamente)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['Estación 1', 'Estación 2'] as const).map(s => {
                    const isSelected = forgotStation === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForgotStation(isSelected ? null : s)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ca4048] border-[#ca4048] text-white'
                            : 'bg-[#1d1f2b] border-[#3e4153] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status messages */}
              {forgotError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  className="w-1/3 py-3 rounded-xl bg-[#1d1f2b] border border-[#3e4153] text-slate-300 text-xs font-bold hover:bg-[#202230] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ca4048] to-[#b82733] text-white font-bold text-sm hover:from-[#b5343c] hover:to-[#a11f2a] transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>
                      {forgotStation
                        ? 'Guardar código e ingresar'
                        : 'Actualizar nuevo código'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 px-4 rounded-2xl bg-[#1d1f2b]/60 border border-dashed border-[#3e4153] text-slate-400 text-xs">
              Toca o haz clic sobre tu nombre en la lista de arriba para asignarte un nuevo código.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
