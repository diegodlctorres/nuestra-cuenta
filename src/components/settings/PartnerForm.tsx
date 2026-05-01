import React from 'react';
import { Partner } from '../../types';
import { processImageUpload } from '../../lib/utils';
export function PartnerForm({
  title,
  partner,
  onChange,
  disabled = false
}: {
  title: string,
  partner: Partner,
  onChange: (p: Partner) => void,
  disabled?: boolean
}) {
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !disabled) {
      try {
        const url = await processImageUpload(file);
        onChange({ ...partner, photoUrl: url });
      } catch (err) {
        console.error("Error al procesar la imagen", err);
      }
    }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <h4 className="font-bold text-slate-700 text-sm">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
          <input type="text" disabled={disabled} className="w-full p-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-500" value={partner.name} onChange={e => onChange({ ...partner, name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Apodo</label>
          <input type="text" disabled={disabled} className="w-full p-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-500" value={partner.nickname || ''} onChange={e => onChange({ ...partner, nickname: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cumpleaños</label>
          <input type="date" disabled={disabled} className="w-full p-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-500" value={partner.birthDate || ''} onChange={e => onChange({ ...partner, birthDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Género</label>
          <select disabled={disabled} className="w-full p-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-500" value={partner.gender || ''} onChange={e => onChange({ ...partner, gender: e.target.value })}>
            <option value="">Seleccionar</option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
            <option value="Otro">Otro</option>
            <option value="Prefiero no decirlo">Prefiero no decirlo</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Foto</label>
        <div className="flex items-center gap-3">
          <label className={`flex items-center justify-center flex-1 p-2 border border-dashed rounded-xl text-xs transition-colors ${
            disabled
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white border-slate-300 text-slate-500 cursor-pointer hover:bg-slate-50'
          }`}>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={disabled} />
            {disabled ? 'La otra persona gestiona su foto' : partner.photoUrl ? "Cambiar foto" : "Subir foto"}
          </label>
          {partner.photoUrl && <img src={partner.photoUrl} alt="Vista previa" className="w-10 h-10 object-cover rounded-full shadow-sm flex-shrink-0" />}
        </div>
      </div>
    </div>
  );
}
