import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRightLeft, Mail, Lock, Loader2 } from 'lucide-react';

export function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error en la autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Nuestra Cuenta
          </h1>
          <p className="text-sm text-slate-500 mt-2 text-center">
            {isLogin ? 'Inicia sesión para continuar sincronizando.' : 'Crea tu cuenta individual para empezar.'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-secondary-50 text-secondary-600 text-sm font-semibold p-3 rounded-xl mb-6 text-center border border-secondary-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre Completo</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ej. Ana Pérez"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Correo Electrónico</label>
            <div className="relative">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="tu@correo.com"
              />
              <Mail className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contraseña</label>
            <div className="relative">
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="••••••••"
                minLength={6}
              />
              <Lock className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-100 hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLogin ? 'Ingresar' : 'Registrarme'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold text-primary-600 hover:text-primary-800"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Ingresa aquí'}
          </button>
        </div>

      </div>
    </div>
  );
}
