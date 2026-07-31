import React from 'react';
import { AttendanceCalendar } from '../components/calendar/AttendanceCalendar';

export const CalendarPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AttendanceCalendar />
    </div>
  );
};
