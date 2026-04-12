import React, { useState } from 'react';
import { UserPlus, ChevronRight } from 'lucide-react';
import { CoupleSettings } from '../../types';
import { PartnerForm } from './PartnerForm';
import { Modal } from '../ui/Modal';

export function CoupleSettingsModal({ coupleSettings, setCoupleSettings }: { coupleSettings: CoupleSettings, setCoupleSettings: (s: CoupleSettings) => void }) {
  const [isOpen, setIsOpen] = useState(false);


  return (
    <>
      <button onClick={() => setIsOpen(true)} className="w-full p-6 bg-white rounded-3xl border border-slate-200 flex justify-between items-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
        <span className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-xl"><UserPlus className="w-6 h-6 text-primary-600" /></div>
          Detalles de la Pareja
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Detalles de la Pareja">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <PartnerForm
            title="Pareja 1"
            partner={coupleSettings.partner1}
            onChange={(p) => setCoupleSettings({ ...coupleSettings, partner1: p })}
          />
          <PartnerForm
            title="Pareja 2"
            partner={coupleSettings.partner2}
            onChange={(p) => setCoupleSettings({ ...coupleSettings, partner2: p })}
          />
          

          <button onClick={() => setIsOpen(false)} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-100 mt-4">Guardar Cambios</button>
        </div>
      </Modal>
    </>
  );
}
