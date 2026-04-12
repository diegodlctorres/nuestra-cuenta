import React, { useState } from 'react';
import { Transaction, CoupleSettings } from '../../types';
import { TransactionItem } from './TransactionItem';
import { Modal } from '../ui/Modal';

export function TransactionGroup({ title, icon, transactions, coupleSettings }: { title: string, icon: React.ReactNode, transactions: Transaction[], coupleSettings: CoupleSettings }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (transactions.length === 0) return null;

  const displayTransactions = transactions.slice(0, 3);
  const hasMore = transactions.length > 3;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
        </div>
        {hasMore && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider"
          >
            Ver más ({transactions.length})
          </button>
        )}
      </div>
      <div className="space-y-3">
        {displayTransactions.map(t => (
          <TransactionItem key={t.id} t={t} coupleSettings={coupleSettings} />
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={title}>
        <div className="space-y-3">
          {transactions.map(t => (
            <TransactionItem key={t.id} t={t} coupleSettings={coupleSettings} />
          ))}
        </div>
      </Modal>
    </div>
  );
}
