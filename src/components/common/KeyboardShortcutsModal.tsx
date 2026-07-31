import React from 'react';
import { Modal } from './Modal';
import { Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'C', description: 'Clock In or Clock Out' },
    { key: 'D', description: 'Navigate to Dashboard' },
    { key: 'M', description: 'Navigate to Calendar' },
    { key: 'R', description: 'Navigate to Reports' },
    { key: 'H', description: 'Navigate to History' },
    { key: 'S', description: 'Navigate to Settings' },
    { key: 'T', description: 'Toggle Dark / Light Theme' },
    { key: 'Esc', description: 'Close Modals or Dialogs' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" maxWidth="max-w-md">
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs">
          <Command className="w-4 h-4 shrink-0" />
          <span>Press any of these shortcuts anywhere in the application to trigger quick actions.</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-dark-border/40">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {sc.description}
              </span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
