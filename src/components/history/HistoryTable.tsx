import React, { useState } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatDateDisplay, formatTimeDisplay, formatDuration, calculateLateMinutes } from '../../utils/timeUtils';
import { exportToCSV, exportToPDF, parseCSVImport } from '../../utils/exportImportUtils';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Search, 
  Filter, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Edit3, 
  Trash2, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock 
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { AttendanceEntry, AttendanceStatus } from '../../types';
import { format, parseISO, isValid } from 'date-fns';

export const HistoryTable: React.FC = () => {
  const { records, updateRecord, deleteRecord, importRecords, settings } = useAttendance();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');

  // Selected date for edit modal
  const [editingDateStr, setEditingDateStr] = useState<string | null>(null);
  const [originalDateStr, setOriginalDateStr] = useState<string | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [editLogin, setEditLogin] = useState('');
  const [editLogout, setEditLogout] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editWork, setEditWork] = useState('');
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('completed');

  const isSundayDate = (dateStr: string) => {
    if (!dateStr) return false;
    const d = parseISO(dateStr);
    return isValid(d) && d.getDay() === 0;
  };

  const allEntries = Object.values(records).sort((a, b) => b.date.localeCompare(a.date));

  const filteredEntries = allEntries.filter(entry => {
    const matchesSearch = 
      entry.date.includes(searchQuery) ||
      (entry.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.todayWork || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (entry: AttendanceEntry) => {
    setOriginalDateStr(entry.date);
    setEditingDateStr(entry.date);
    setIsNewEntry(false);
    setEditLogin(entry.loginTime ? format(new Date(entry.loginTime), "HH:mm") : '');
    setEditLogout(entry.logoutTime ? format(new Date(entry.logoutTime), "HH:mm") : '');
    setEditNotes(entry.notes || '');
    setEditWork(entry.todayWork || '');
    setEditStatus(entry.status);
  };

  const handleCreateNewEntry = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setOriginalDateStr(null);
    setEditingDateStr(todayStr);
    setIsNewEntry(true);
    const isSun = isSundayDate(todayStr);
    setEditLogin(isSun ? '11:00' : '09:00');
    setEditLogout(isSun ? '20:00' : '18:00');
    setEditNotes('');
    setEditWork('');
    setEditStatus('completed');
  };

  const handleDateChange = (newDateStr: string) => {
    setEditingDateStr(newDateStr);
    if (isSundayDate(newDateStr)) {
      setEditLogin('11:00');
      setEditLogout('20:00');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingDateStr) return;
    let loginIso: string | null = null;
    let logoutIso: string | null = null;

    if (editLogin) loginIso = `${editingDateStr}T${editLogin}:00`;
    if (editLogout) logoutIso = `${editingDateStr}T${editLogout}:00`;

    // If user modified date for an existing record, delete the old date key
    if (originalDateStr && originalDateStr !== editingDateStr) {
      await deleteRecord(originalDateStr);
    }

    await updateRecord(editingDateStr, {
      loginTime: loginIso,
      logoutTime: logoutIso,
      status: editStatus,
      notes: editNotes,
      todayWork: editWork
    });
    setEditingDateStr(null);
    setOriginalDateStr(null);
  };

  const handleImportCsv = async () => {
    if (!csvRawText.trim()) return;
    const parsed = parseCSVImport(csvRawText, '2026-07', settings.officeStartTime);
    if (parsed.length > 0) {
      await importRecords(parsed);
      setCsvRawText('');
      setIsImportModalOpen(false);
    } else {
      alert('Could not parse valid records from CSV. Please check formatting.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Filters */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Attendance Records History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage shift logs, manual corrections, CSV imports, and exports
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCreateNewEntry}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Log Manual Shift</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 text-xs font-bold transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => exportToCSV(records)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => exportToPDF(records, currentUser?.name)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-dark-border/40">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by date, work summary, notes... (Press /)"
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed 🟢</option>
              <option value="late">Late Arrival 🟡</option>
              <option value="half_day">Half Day 🟣</option>
              <option value="vacation">Vacation 🟣</option>
              <option value="absent">Absent 🔴</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-dark-border/50 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Login</th>
                <th className="py-3 px-4">Logout</th>
                <th className="py-3 px-4">Worked</th>
                <th className="py-3 px-4">Punctuality</th>
                <th className="py-3 px-4">Overtime</th>
                <th className="py-3 px-4">Notes & Work</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border/40 text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr 
                    key={entry.date}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formatDateDisplay(entry.date)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {formatTimeDisplay(entry.loginTime)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {formatTimeDisplay(entry.logoutTime)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatDuration(entry.workedMinutes)}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const actualLateMins = entry.loginTime 
                          ? calculateLateMinutes(entry.loginTime, settings.officeStartTime)
                          : 0;
                        return actualLateMins > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {actualLateMins}m Late
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            On Time
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {entry.overtimeMinutes > 0 ? `+${entry.overtimeMinutes}m` : '-'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                      {entry.todayWork || entry.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
                          title="Edit Record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteRecord(entry.date)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Entry Modal */}
      {editingDateStr && (
        <Modal
          isOpen={Boolean(editingDateStr)}
          onClose={() => { setEditingDateStr(null); setOriginalDateStr(null); }}
          title={isNewEntry ? `Create Manual Shift Entry` : `Edit Shift Entry - ${editingDateStr}`}
        >
          <div className="space-y-4">
            
            {/* Target Date Selector Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date (Select date to log or backfill missing days)
              </label>
              <input
                type="date"
                value={editingDateStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {isSundayDate(editingDateStr) && (
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                  🌅 Sunday detected: Default full-time shift 11:00 AM – 08:00 PM (9h) applied.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="completed">Completed / Present 🟢</option>
                <option value="late">Late Arrival 🟡</option>
                <option value="half_day">Half Day 🟣</option>
                <option value="vacation">Vacation 🟣</option>
                <option value="absent">Absent 🔴</option>
              </select>
            </div>

            {/* Quick Shift Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Quick Shift:</span>
              <button
                type="button"
                onClick={() => { setEditLogin('09:00'); setEditLogout('18:00'); }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
              >
                ☀️ Standard (09:00 - 18:00)
              </button>
              <button
                type="button"
                onClick={() => { setEditLogin('11:00'); setEditLogout('20:00'); }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                🌅 Sunday (11:00 - 20:00)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Login Time
                </label>
                <input
                  type="time"
                  value={editLogin}
                  onChange={(e) => setEditLogin(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Logout Time
                </label>
                <input
                  type="time"
                  value={editLogout}
                  onChange={(e) => setEditLogout(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Today Work
              </label>
              <input
                type="text"
                value={editWork}
                onChange={(e) => setEditWork(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-dark-border">
              <button
                onClick={() => setEditingDateStr(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CSV & Google Sheets Import Modal */}
      {isImportModalOpen && (
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Attendance Data (Google Sheets / CSV)"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                Supports Direct Copy-Paste from Google Sheets!
              </p>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                You can select rows in your Google Sheet (with columns: Day, Login, Logout, Hours, Remarks), press <kbd className="px-1 rounded bg-slate-200 dark:bg-slate-700 font-mono">Ctrl+C</kbd>, and paste directly below!
              </p>
            </div>

            <textarea
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              rows={9}
              placeholder="Paste Google Sheets rows or CSV text here...&#10;&#10;Example (Google Sheets format):&#10;July&#10;1	11:30 AM	8:15 PM	8.75&#10;2	11:10 AM	8:00 PM	8.83&#10;6	0	0	0.00	Leave"
              className="w-full p-3 font-mono text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-dark-border">
              <span className="text-[11px] text-slate-400">
                Auto-calculates worked & overtime minutes
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportCsv}
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all"
                >
                  Import Month Data
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
