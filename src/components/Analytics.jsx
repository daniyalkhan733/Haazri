import React, { useMemo } from 'react';
import { getAttendanceRecords, getSettings } from '../services/dbService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  Timer, 
  Calendar,
  AlertOctagon,
  Smile,
  Zap,
  TrendingDown
} from 'lucide-react';
import { formatDurationString } from '../utils/timeHelpers';

export default function Analytics({ user }) {
  const settings = getSettings();
  
  // Load data
  const rawRecords = useMemo(() => {
    return getAttendanceRecords(user?.role === 'admin' ? null : user?.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first for charts
  }, [user]);

  // Filter completed shifts for analysis (records with check_out_time and valid total_hours)
  const completedRecords = useMemo(() => {
    return rawRecords.filter(r => r.check_out_time && r.total_hours > 0);
  }, [rawRecords]);

  // 1. Calculate General Statistics
  const stats = useMemo(() => {
    const totalDays = rawRecords.filter(r => r.status !== 'Holiday').length;
    const presentDays = rawRecords.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Half-Day').length;
    const absentDays = rawRecords.filter(r => r.status === 'Absent').length;
    const holidayDays = rawRecords.filter(r => r.status === 'Holiday').length;
    
    const totalHours = completedRecords.reduce((sum, r) => sum + r.total_hours, 0);
    const avgHours = presentDays > 0 ? (totalHours / completedRecords.length).toFixed(2) : 0;
    
    // Longest / Shortest working days
    let longest = { hours: 0, date: '--' };
    let shortest = { hours: 999, date: '--' };

    completedRecords.forEach(r => {
      if (r.total_hours > longest.hours) {
        longest = { hours: r.total_hours, date: r.date };
      }
      if (r.total_hours < shortest.hours) {
        shortest = { hours: r.total_hours, date: r.date };
      }
    });

    if (shortest.hours === 999) shortest = { hours: 0, date: '--' };

    // Late entries / Early exits
    const lateEntries = rawRecords.filter(r => r.status === 'Late').length;
    
    // Early exit check
    const stdEnd = settings.officeEndTime;
    let earlyExits = 0;
    completedRecords.forEach(r => {
      if (r.check_out_time) {
        const [outH, outM] = r.check_out_time.split(':').map(Number);
        const [stdH, stdM] = stdEnd.split(':').map(Number);
        if (outH * 60 + outM < stdH * 60 + stdM) {
          earlyExits++;
        }
      }
    });

    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      holidayDays,
      totalHours: totalHours.toFixed(1),
      avgHours,
      longest,
      shortest,
      lateEntries,
      earlyExits,
      attendanceRate
    };
  }, [rawRecords, completedRecords, settings]);

  // 2. Format data for Daily Working Hours Chart (last 12 days)
  const barChartData = useMemo(() => {
    return completedRecords.slice(-12).map(r => {
      const dateObj = new Date(r.date);
      const label = dateObj.toLocaleDateString([], { day: 'numeric', month: 'short' });
      return {
        name: label,
        Hours: r.total_hours,
        Target: settings.standardWorkingHours
      };
    });
  }, [completedRecords, settings]);

  // 3. Format data for Entry / Exit Trends (last 12 days)
  const lineChartData = useMemo(() => {
    return completedRecords.slice(-12).map(r => {
      const dateObj = new Date(r.date);
      const label = dateObj.toLocaleDateString([], { day: 'numeric', month: 'short' });

      // Convert clock-in e.g., "09:15:00" to decimal hours e.g., 9.25
      const [inH, inM] = r.check_in_time.split(':').map(Number);
      const clockInDecimal = parseFloat((inH + inM / 60).toFixed(2));

      let clockOutDecimal = null;
      if (r.check_out_time) {
        const [outH, outM] = r.check_out_time.split(':').map(Number);
        clockOutDecimal = parseFloat((outH + outM / 60).toFixed(2));
      }

      return {
        name: label,
        'Clock In': clockInDecimal,
        'Clock Out': clockOutDecimal,
        'Standard Start': 9.0, // 09:00 AM
        'Standard End': 18.0   // 06:00 PM
      };
    });
  }, [completedRecords]);

  // 4. Pie Chart data for status distribution
  const pieChartData = useMemo(() => {
    const counts = { Present: 0, Late: 0, Absent: 0, 'Half-Day': 0, Holiday: 0 };
    rawRecords.forEach(r => {
      if (counts[r.status] !== undefined) {
        counts[r.status]++;
      }
    });

    return [
      { name: 'Present', value: counts.Present, color: '#10b981' },
      { name: 'Late Entry', value: counts.Late, color: '#f59e0b' },
      { name: 'Half-Day', value: counts.Half-Day, color: '#eab308' },
      { name: 'Absent', value: counts.Absent, color: '#ef4444' },
      { name: 'Holiday', value: counts.Holiday, color: '#3b82f6' }
    ].filter(item => item.value > 0); // Only show statuses that have records
  }, [rawRecords]);

  // Helper formats duration e.g. 8.5 to "8h 30m"
  const decimalToDuration = (dec) => {
    const hrs = Math.floor(dec);
    const mins = Math.round((dec - hrs) * 60);
    return formatDurationString(hrs, mins);
  };

  return (
    <div className="space-y-6">
      
      {/* High-level stats panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Present/Rate */}
        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Attendance Rate</span>
            <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white leading-tight">
              {stats.attendanceRate}%
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">
              {stats.presentDays} Present / {stats.totalDays} Workdays
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Total Working hours */}
        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Hours Logged</span>
            <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white leading-tight">
              {stats.totalHours}h
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">
              Across completed shifts
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <Timer className="h-6 w-6" />
          </div>
        </div>

        {/* Avg daily hours */}
        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Average Daily Shift</span>
            <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white leading-tight">
              {stats.avgHours}h
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">
              Target standard: {settings.standardWorkingHours}h
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Tardy/Late Ratios */}
        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Late / Early Exit Count</span>
            <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white leading-tight">
              {stats.lateEntries} / {stats.earlyExits}
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">
              Commute tardiness stamps
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertOctagon className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Extreme limits days info banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Longest Shift Recorded</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {decimalToDuration(stats.longest.hours)} on {new Date(stats.longest.date).toLocaleDateString([], { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <TrendingDown className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Shortest Shift Recorded</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {decimalToDuration(stats.shortest.hours)} on {new Date(stats.shortest.date).toLocaleDateString([], { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Daily hours chart */}
        <div className="glass-card p-5 flex flex-col justify-between min-h-[380px]">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
              Daily Hours Logged
            </span>
            <p className="text-xs text-slate-400 mb-6">
              Shows your actual total hours worked per day compared to target hours.
            </p>
          </div>

          <div className="h-[250px] w-full text-xs">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f293730" />
                  <XAxis dataKey="name" stroke="#6b7280" dy={10} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111827', 
                      borderRadius: '12px', 
                      borderColor: '#374151',
                      color: '#f9fafb'
                    }} 
                  />
                  <Bar dataKey="Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={35} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No shift hours recorded yet.</div>
            )}
          </div>
        </div>

        {/* Clock In / Out time trends */}
        <div className="glass-card p-5 flex flex-col justify-between min-h-[380px]">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
              Clock In / Out Trends
            </span>
            <p className="text-xs text-slate-400 mb-6">
              Tracks consistency of entry and exit times against the standard office hours.
            </p>
          </div>

          <div className="h-[250px] w-full text-xs">
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f293730" />
                  <XAxis dataKey="name" stroke="#6b7280" dy={10} />
                  <YAxis 
                    stroke="#6b7280" 
                    domain={[7, 20]} 
                    tickFormatter={(val) => {
                      const hour = Math.floor(val);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const dispHour = hour % 12 || 12;
                      return `${dispHour} ${ampm}`;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111827', 
                      borderRadius: '12px', 
                      borderColor: '#374151',
                      color: '#f9fafb'
                    }}
                    formatter={(value, name) => [
                      `${Math.floor(value)}:${String(Math.round((value - Math.floor(value)) * 60)).padStart(2, '0')}`,
                      name
                    ]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="Clock In" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Clock Out" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No logs recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Distribution breakdown chart */}
      <div className="glass-card p-5 xl:max-w-md">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-4">
          Attendance Distribution
        </span>

        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
          <div className="h-[180px] w-[180px] text-xs relative">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-450">No logs</div>
            )}
          </div>

          <div className="space-y-2">
            {pieChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="h-3.5 w-3.5 rounded-full block border" style={{ backgroundColor: `${item.color}20`, borderColor: item.color }} />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.value} {item.value === 1 ? 'Day' : 'Days'}</span>
                <span className="text-slate-450">({item.name})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
