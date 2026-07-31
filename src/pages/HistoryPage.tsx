import React from 'react';
import { HistoryTable } from '../components/history/HistoryTable';

export const HistoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <HistoryTable />
    </div>
  );
};
