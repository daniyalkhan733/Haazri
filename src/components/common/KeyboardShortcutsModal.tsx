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
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-semibold">
          <Command className="w-4 h-4 shrink-0" />
          <span>Press any shortcut key anywhere on the dashboard for instant navigation.</span>
        </div>

        <div className="divide-y divide-oneui-border/60 dark:divide-dark-border/60">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="flex items-center justify-between py-3">
              <span className="text-sm text-oneui-text dark:text-white font-medium">
                {sc.description}
              </span>
              <kbd className="px-3 py-1 rounded-xl bg-oneui-subcard dark:bg-dark-subcard border border-oneui-border dark:border-dark-border text-xs font-mono font-black text-brand-600 dark:text-brand-400 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
