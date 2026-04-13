import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, Loader2, LogOut } from 'lucide-react';

export function OnboardingView() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleCreateHousehold = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Llamada al RPC
      const { data, error } = await supabase.rpc('create_household_and_insert_admin', {
        p_theme: 'default'
      });
      console.log('>> DEBUG RPC Result:', data, 'Error:', error);
      if (error) throw error;
      
      // Forzamos actualización del contexto para redirigir
      await refreshProfile();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear el hogar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans flex-col">
      <div className="w-full flex justify-end mb-4 max-w-md">
        <button onClick={signOut} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
      
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 text-center">
            ¡Hola, {profile?.name || 'Compañero'}!
          </h1>
          <p className="text-sm text-slate-500 mt-2 text-center">
            Para continuar, necesitas crear un espacio de cuenta compartida o unirte a uno mediante una invitación.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-secondary-50 text-secondary-600 text-sm font-semibold p-3 rounded-xl mb-6 text-center border border-secondary-100">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleCreateHousehold}
            disabled={isLoading}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-100 hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Home className="w-5 h-5" />}
            Crear Nueva Cuenta Compartida
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">o también</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
          
          <button 
            disabled
            className="w-full py-4 bg-white text-slate-400 rounded-2xl font-bold text-sm border-2 border-dashed border-slate-200 cursor-not-allowed"
          >
            Tengo un código de invitación
          </button>
        </div>
      </div>
    </div>
  );
}
