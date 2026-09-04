import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { useAttendance } from '../../contexts/AttendanceContext';
import { exportToCSV, exportToPDF } from '../../utils/exportImportUtils';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  Zap, 
  PieChart as PieChartIcon 
} from 'lucide-react';
import { format, subDays, parseISO, isSameMonth } from 'date-fns';

export const AnalyticsCharts: React.FC = () => {
  const { records, stats } = useAttendance();
  const { currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'year'>('30days');

  // Prepare chart data for last N days
  const daysCount = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 365;
  const chartData = [];
  const now = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const dayObj = subDays(now, i);
    const dateStr = format(dayObj, 'yyyy-MM-dd');
    const entry = records[dateStr];

    const workedHours = entry ? Number((entry.workedMinutes / 60).toFixed(1)) : 0;
    const overtimeHours = entry ? Number((entry.overtimeMinutes / 60).toFixed(1)) : 0;
    const lateMinutes = entry ? entry.lateMinutes || 0 : 0;
    
    let loginHour = 0;
    if (entry && entry.loginTime) {
      const d = new Date(entry.loginTime);
      loginHour = d.getHours() + d.getMinutes() / 60;
    }

    chartData.push({
      date: dateStr,
      displayDate: format(dayObj, timeRange === 'year' ? 'MMM' : 'MMM dd'),
      workedHours,
      overtimeHours,
      lateMinutes,
      loginHour: loginHour > 0 ? Number(loginHour.toFixed(2)) : null,
    });
  }

  // Aggregate monthly data for year view if selected
  const monthlyAggregates: Record<string, { month: string; workedHours: number; overtimeHours: number; lateCount: number }> = {};
  if (timeRange === 'year') {
    chartData.forEach(item => {
      const monthKey = item.displayDate;
      if (!monthlyAggregates[monthKey]) {
        monthlyAggregates[monthKey] = { month: monthKey, workedHours: 0, overtimeHours: 0, lateCount: 0 };
      }
      monthlyAggregates[monthKey].workedHours += item.workedHours;
      monthlyAggregates[monthKey].overtimeHours += item.overtimeHours;
      if (item.lateMinutes > 0) monthlyAggregates[monthKey].lateCount += 1;
    });
  }

  const finalDailyData = timeRange === 'year' ? Object.values(monthlyAggregates) : chartData;

  // Pie chart data for hours distribution
  const onTimeCount = Object.values(records).filter(r => r.status === 'completed' || r.status === 'present').length;
  const lateCount = Object.values(records).filter(r => (r.lateMinutes && r.lateMinutes > 0) || r.status === 'late').length;
  const leaveCount = Object.values(records).filter(r => r.status === 'vacation' || r.status === 'half_day').length;
  const absentCount = Object.values(records).filter(r => r.status === 'absent').length;

  const pieData = [
    { name: 'On-Time Shifts', value: onTimeCount, color: '#10b981' },
    { name: 'Late Arrivals', value: lateCount, color: '#f59e0b' },
    { name: 'Vacation / Leaves', value: leaveCount, color: '#a855f7' },
    { name: 'Absent / Missed', value: absentCount, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      
      {/* Samsung One UI Top Header & Range Switcher */}
      <div className="oneui-card p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 shadow-sm">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-oneui-text dark:text-white tracking-tight">
              Reports & Performance
            </h2>
            <p className="text-xs text-oneui-subtext dark:text-dark-subtext font-medium">
              Interactive visualizations of worked hours, overtime, and punctuality
            </p>
          </div>
        </div>

        {/* Range Switcher & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-oneui-subcard dark:bg-dark-subcard p-1 rounded-full border border-oneui-border dark:border-dark-border shadow-sm text-xs font-bold">
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3.5 py-1.5 rounded-full transition-all active:scale-95 ${
                timeRange === '7days' ? 'bg-brand-500 text-white shadow-sm' : 'text-oneui-subtext dark:text-dark-subtext hover:text-oneui-text'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3.5 py-1.5 rounded-full transition-all active:scale-95 ${
                timeRange === '30days' ? 'bg-brand-500 text-white shadow-sm' : 'text-oneui-subtext dark:text-dark-subtext hover:text-oneui-text'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3.5 py-1.5 rounded-full transition-all active:scale-95 ${
                timeRange === 'year' ? 'bg-brand-500 text-white shadow-sm' : 'text-oneui-subtext dark:text-dark-subtext hover:text-oneui-text'
              }`}
            >
              Year
            </button>
          </div>

          <button
            onClick={() => exportToCSV(records)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => exportToPDF(records, currentUser?.name)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-xs font-bold transition-all active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Worked Hours Trend */}
        <div className="oneui-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              Worked Hours Trend
            </h3>
            <span className="text-xs font-bold text-brand-500 font-mono">
              Target: 9.0h / day
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finalDailyData as any}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E60F2" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#1E60F2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey={timeRange === 'year' ? 'month' : 'displayDate'} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="h" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161922', borderColor: '#252B3B', borderRadius: '16px', color: '#fff' }} 
                />
                <Area type="monotone" dataKey="workedHours" stroke="#1E60F2" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Overtime Hours Bar Chart */}
        <div className="oneui-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              Overtime Hours Logged
            </h3>
            <span className="text-xs font-bold text-emerald-500 font-mono">
              Total: {(stats.overtimeMinutesTotal / 60).toFixed(1)}h
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finalDailyData as any}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey={timeRange === 'year' ? 'month' : 'displayDate'} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="h" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111622', borderColor: '#1D2636', borderRadius: '12px', color: '#fff' }} 
                />
                <Bar dataKey="overtimeHours" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Late Arrival Minutes */}
        <div className="oneui-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Late Arrival Minutes
            </h3>
            <span className="text-xs font-bold text-amber-500 font-mono">
              {stats.lateDaysCount} Late Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey={timeRange === 'year' ? 'month' : 'displayDate'} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="m" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161922', borderColor: '#252B3B', borderRadius: '16px', color: '#fff' }} 
                />
                <Bar dataKey="lateMinutes" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Attendance Status Distribution Pie */}
        <div className="oneui-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-oneui-text dark:text-white text-base flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-500" />
              Shift Distribution
            </h3>
            <span className="text-xs font-bold text-purple-500 font-mono">
              {stats.attendancePercentage}% Punctuality
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-xs text-slate-400">No shift data recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111622', borderColor: '#1D2636', borderRadius: '12px', color: '#fff' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
