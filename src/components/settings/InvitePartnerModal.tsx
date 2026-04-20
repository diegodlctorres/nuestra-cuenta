import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link, Copy, Check, X, Loader2 } from 'lucide-react';
import { getFriendlyErrorMessage } from '../../lib/errors';

export function InvitePartnerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { householdId, user } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId || !user) return;
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (email.toLowerCase().trim() === user.email?.toLowerCase().trim()) {
        throw new Error('No puedes invitar a tu propio correo electrónico.');
      }

      // Generar token random
      const token = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 días de validez

      const { error } = await supabase.from('household_invitations').insert({
        household_id: householdId,
        email: email,
        token: token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      }).select().single();

      if (error) throw error;
      setInviteToken(token);
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err, 'No pudimos generar la invitación.'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteToken) {
      navigator.clipboard.writeText(inviteToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
          <Link className="w-6 h-6 text-primary-600" />
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2">Invitar pareja</h3>
        
        {inviteToken ? (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <p className="text-slate-500 text-sm mb-4">
              La invitación ha sido generada. Dale este código a tu pareja para unirse al grupo.
            </p>
            <div className="bg-slate-100 border-2 border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <span className="font-mono text-xl font-bold tracking-widest text-slate-800">
                {inviteToken}
              </span>
              <button 
                onClick={copyToClipboard}
                className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:border-primary-500 text-slate-600 transition-colors"
                title="Copiar código"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <button 
              onClick={onClose}
              className="mt-6 w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleInvite}>
            <p className="text-slate-500 text-sm mb-6">
              Genera un código seguro para que tu pareja se una a tu panel financiero. El código será válido por 7 días.
            </p>
            
            {errorMsg && (
              <div className="mb-4 text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
                {errorMsg}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email de la pareja</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pareja@correo.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Generar Código de Invitación
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
