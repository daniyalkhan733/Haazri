import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AttendanceProvider, useAttendance } from './contexts/AttendanceContext';
import { Header } from './components/common/Header';
import { Sidebar, NavigationTab } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { AuthModal } from './components/auth/AuthModal';

import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { ReportsPage } from './pages/ReportsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { toggleTheme } = useTheme();
  const { clockIn, clockOut, todayEntry } = useAttendance();

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key.toUpperCase()) {
        case 'C':
          e.preventDefault();
          if (todayEntry && todayEntry.status === 'working') {
            clockOut();
          } else {
            clockIn();
          }
          break;
        case 'D':
          e.preventDefault();
          setCurrentTab('dashboard');
          break;
        case 'M':
          e.preventDefault();
          setCurrentTab('calendar');
          break;
        case 'R':
          e.preventDefault();
          setCurrentTab('reports');
          break;
        case 'H':
          e.preventDefault();
          setCurrentTab('history');
          break;
        case 'S':
          e.preventDefault();
          setCurrentTab('settings');
          break;
        case 'T':
          e.preventDefault();
          toggleTheme();
          break;
        case '?':
          e.preventDefault();
          setIsShortcutsOpen(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clockIn, clockOut, todayEntry, toggleTheme]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text font-sans antialiased transition-colors duration-200 flex flex-col">
      
      {/* Header */}
      <Header
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-8">
        
        {/* Sidebar Navigation */}
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Page Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigateToHistory={() => setCurrentTab('history')} />
          )}
          {currentTab === 'calendar' && <CalendarPage />}
          {currentTab === 'reports' && <ReportsPage />}
          {currentTab === 'history' && <HistoryPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AttendanceProvider>
          <AppContent />
        </AttendanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
