import React, { useState } from 'react';
import { UserPlus, ChevronRight } from 'lucide-react';
import { Pet } from '../../types';
import { Modal } from '../ui/Modal';
import { processImageUpload } from '../../lib/utils';

export function AddPetForm({ onAdd }: { onAdd: (pet: Omit<Pet, 'id'>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Perro');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({ name, species, breed, birthDate: birthDate || undefined, photoUrl: photoUrl || undefined });
    setName(''); setBreed(''); setBirthDate(''); setPhotoUrl('');
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 flex justify-between items-center font-bold text-slate-700 hover:bg-slate-50 transition-colors rounded-2xl"
      >
        <span className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-rose-500" />
          Registrar Mascota
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Registrar Mascota">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
            <input type="text" placeholder="Nombre de la mascota" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Especie</label>
            <select className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500" value={species} onChange={e => setSpecies(e.target.value)}>
              <option>Perro</option><option>Gato</option><option>Otro</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Raza</label>
            <input type="text" placeholder="Raza (opcional)" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500" value={breed} onChange={e => setBreed(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cumpleaños</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-rose-500" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Foto (Opcional)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center justify-center w-full p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors text-sm text-slate-500">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {photoUrl ? "Cambiar foto" : "Subir archivo de imagen"}
              </label>
              {photoUrl && <img src={photoUrl} alt="Vista previa" className="w-12 h-12 object-cover rounded-full shadow-sm flex-shrink-0" />}
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-100 mt-4">Registrar Mascota</button>
        </form>
      </Modal>
    </>
  );
}
