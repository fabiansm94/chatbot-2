import React, { useState } from 'react';
import { USERS } from '../data/users';

interface LoginModalProps {
  onLogin: (station: 'Estación 1' | 'Estación 2', userName: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [station, setStation] = useState<'Estación 1' | 'Estación 2' | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = USERS.find(u => u.password === code);
    if (user && station) {
      onLogin(station, user.name);
    } else {
      setError('Código inválido o estación no seleccionada');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2f3140]/85 backdrop-blur-md p-4">
      <form onSubmit={handleSubmit} className="bg-[#2f3140] p-8 rounded-3xl border border-[#3e4153] w-full max-w-sm space-y-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center">Acceso STS Security</h2>
        
        <input
          type="password"
          placeholder="Ingrese su código"
          value={code}
          onChange={e => setCode(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[#262835] border border-[#3e4153] text-white focus:border-[#ca4048] outline-none"
        />

        <div className="grid grid-cols-2 gap-4">
          {['Estación 1', 'Estación 2'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStation(s as any)}
              className={`py-3 rounded-xl border ${station === s ? 'bg-[#ca4048] border-[#ca4048]' : 'bg-[#262835] border-[#3e4153]'} text-white font-semibold transition-all`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <p className="text-[#ca4048] text-xs text-center font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-[#ca4048] text-white font-bold text-lg hover:bg-[#b5343c] transition-all shadow-md active:scale-98"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
};

