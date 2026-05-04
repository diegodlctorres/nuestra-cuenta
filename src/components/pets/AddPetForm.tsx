import React, { useState } from 'react';
import { UserPlus, ChevronRight } from 'lucide-react';
import { Pet } from '../../types';
import { Modal } from '../ui/Modal';
import { cn, processImageUpload } from '../../lib/utils';
import { getActionErrorMessage } from '../../lib/networkStatus';

export function AddPetForm({ onAdd }: { onAdd: (pet: Omit<Pet, 'id' | 'household_id'>) => Promise<boolean> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Perro');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const nameError = name.trim().length === 0;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await processImageUpload(file);
        setPhotoUrl(url);
      } catch (err) {
        console.error("Error al procesar la imagen", err);
      }
    }
  };

  const resetForm = () => {
    setName('');
    setBreed('');
    setBirthDate('');
    setPhotoUrl('');
    setSubmitAttempted(false);
    setSaveError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setSaveError('');
    if (nameError || isSaving) return;

    setIsSaving(true);
    const wasSaved = await onAdd({
      name: name.trim(),
      species,
      breed,
      birth_date: birthDate || undefined,
      photo_url: photoUrl || undefined
    });
    setIsSaving(false);

    if (wasSaved) {
      resetForm();
      setIsOpen(false);
    } else {
      setSaveError(getActionErrorMessage('No se pudo registrar la mascota. Inténtalo nuevamente.'));
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 flex justify-between items-center font-bold text-slate-700 hover:bg-slate-50 transition-colors rounded-2xl"
      >
        <span className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-secondary-500" />
          Registrar Mascota
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => { if (!isSaving) { setIsOpen(false); setSubmitAttempted(false); setSaveError(''); } }} title="Registrar Mascota">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={cn("text-[10px] font-bold uppercase ml-1", submitAttempted && nameError ? "text-red-500" : "text-slate-400")}>Nombre</label>
            <input
              type="text"
              placeholder="Nombre de la mascota"
              className={cn(
                "w-full p-3 rounded-xl border text-sm transition focus:outline-none",
                submitAttempted && nameError
                  ? "border-red-300 bg-red-50 text-slate-900 focus:ring-2 focus:ring-red-200"
                  : "border-transparent bg-slate-50 text-slate-900 focus:ring-2 focus:ring-secondary-500"
              )}
              value={name}
              onChange={e => setName(e.target.value)}
              aria-invalid={submitAttempted && nameError}
            />
            {submitAttempted && nameError && (
              <p className="text-xs text-red-500 ml-1">El nombre de la mascota es obligatorio.</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Especie</label>
            <select className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-secondary-500" value={species} onChange={e => setSpecies(e.target.value)}>
              <option>Perro</option><option>Gato</option><option>Otro</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Raza</label>
            <input type="text" placeholder="Raza (opcional)" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-secondary-500" value={breed} onChange={e => setBreed(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cumpleaños</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-secondary-500" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Foto (Opcional)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center justify-center w-full p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors text-sm text-slate-500">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isSaving} />
                {photoUrl ? "Cambiar foto" : "Subir archivo de imagen"}
              </label>
              {photoUrl && <img src={photoUrl} alt="Vista previa" className="w-12 h-12 object-cover rounded-full shadow-sm flex-shrink-0" />}
            </div>
          </div>
          {saveError && (
            <p className="text-xs text-red-500 ml-1">{saveError}</p>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-secondary-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-secondary-100 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : 'Registrar Mascota'}
          </button>
        </form>
      </Modal>
    </>
  );
}
