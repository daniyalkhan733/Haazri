import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Authenticating your workspace...',
  subMessage = 'Connecting securely and preparing your attendance dashboard'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text overflow-hidden select-none"
    >
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/3 -left-20 w-72 h-72 sm:w-96 sm:h-96 bg-brand-500/15 dark:bg-brand-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

      {/* Main Container Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full px-6 text-center">
        
        {/* Animated Brand Logo Icon */}
        <div className="relative mb-6">
          {/* Pulsing ring waves */}
          <motion.div
            className="absolute -inset-3 rounded-3xl bg-brand-500/20 dark:bg-brand-500/30 blur-md"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.9, 0.5],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -inset-6 rounded-3xl bg-indigo-500/15 dark:bg-indigo-500/20 blur-xl"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
          />

          {/* Core Logo Badge */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-brand-500/30 text-white font-black text-3xl sm:text-4xl tracking-wider">
            H
            {/* Sparkle decorative pin */}
            <motion.div 
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-400 text-slate-950 shadow-md"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </motion.div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">
          Haazri<span className="text-brand-500">.</span>
        </h1>

        {/* Dynamic Status Message */}
        <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 mb-1">
          {message}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
          {subMessage}
        </p>

        {/* Indeterminate Animated Progress Bar */}
        <div className="w-48 sm:w-56 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-brand-400 rounded-full"
            initial={{ x: '-100%', width: '45%' }}
            animate={{ x: ['-100%', '250%'] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Security & Cloud status tag */}
        <div className="mt-8 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-dark-border/40">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Securing session & local database</span>
        </div>

      </div>
    </motion.div>
  );
};
