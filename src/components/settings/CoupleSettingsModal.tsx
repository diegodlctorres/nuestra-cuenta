import React, { useState } from 'react';
import { UserPlus, ChevronRight } from 'lucide-react';
import { CoupleSettings } from '../../types';
import { PartnerForm } from './PartnerForm';
import { Modal } from '../ui/Modal';

export function CoupleSettingsModal({
  coupleSettings,
  setCoupleSettings
}: {
  coupleSettings: CoupleSettings,
  setCoupleSettings: (s: CoupleSettings) => Promise<void>
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftSettings, setDraftSettings] = useState<CoupleSettings>(coupleSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpen = () => {
    setDraftSettings(coupleSettings);
    setIsOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setCoupleSettings(draftSettings);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button onClick={handleOpen} className="w-full p-6 bg-white rounded-3xl border border-slate-200 flex justify-between items-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
        <span className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-xl"><UserPlus className="w-6 h-6 text-primary-600" /></div>
          Detalles de la Pareja
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Detalles de la Pareja">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <PartnerForm
            title="Mi perfil"
            partner={draftSettings.partner1}
            onChange={(p) => setDraftSettings({ ...draftSettings, partner1: p })}
          />
          <PartnerForm
            title="Mi pareja"
            partner={draftSettings.partner2}
            onChange={(p) => setDraftSettings({ ...draftSettings, partner2: p })}
            disabled
          />
          
          <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-100 mt-4 disabled:opacity-60">
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </Modal>
    </>
  );
}
