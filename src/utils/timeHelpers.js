// Helper functions for date and time calculations

// Format a time string (HH:MM:SS or HH:MM) or Date object to 12-hour format (e.g., 09:18 AM)
export function formatTime12(timeInput) {
  if (!timeInput) return '--:--';
  
  let hours, minutes;
  if (timeInput instanceof Date) {
    hours = timeInput.getHours();
    minutes = timeInput.getMinutes();
  } else {
    const parts = timeInput.split(':');
    if (parts.length < 2) return timeInput;
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  }
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

// Format a time string (HH:MM:SS or HH:MM) or Date to 24-hour format (e.g., 09:18 or 18:12)
export function formatTime24(timeInput) {
  if (!timeInput) return '--:--';
  
  let hours, minutes;
  if (timeInput instanceof Date) {
    hours = timeInput.getHours();
    minutes = timeInput.getMinutes();
  } else {
    const parts = timeInput.split(':');
    if (parts.length < 2) return timeInput;
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  }
  
  const displayHours = hours < 10 ? `0${hours}` : hours;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes}`;
}

// Format date to local short format, e.g., '01 Jul'
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  return `${day} ${month}`;
}

// Get short day name, e.g., 'Tue'
export function getDayName(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

// Calculate work hours and minutes between two time strings on a specific date
// checkInTime: 'HH:MM:SS', checkOutTime: 'HH:MM:SS'
export function calculateWorkDuration(checkInTime, checkOutTime) {
  if (!checkInTime || !checkOutTime) return { hours: 0, minutes: 0, totalMinutes: 0, decimalHours: 0 };
  
  const [inH, inM, inS = 0] = checkInTime.split(':').map(Number);
  const [outH, outM, outS = 0] = checkOutTime.split(':').map(Number);
  
  const startMinutes = inH * 60 + inM + inS / 60;
  const endMinutes = outH * 60 + outM + outS / 60;
  
  let totalMin = endMinutes - startMinutes;
  if (totalMin < 0) totalMin = 0; // Negative time guards
  
  const hours = Math.floor(totalMin / 60);
  const minutes = Math.floor(totalMin % 60);
  const decimalHours = parseFloat((totalMin / 60).toFixed(2));
  
  return {
    hours,
    minutes,
    totalMinutes: Math.floor(totalMin),
    decimalHours
  };
}

// Determine if check-in is late compared to standard office start time
// e.g. checkInTime: '09:15:00', standardStart: '09:00'
export function isLate(checkInTime, standardStart = '09:00') {
  if (!checkInTime) return false;
  const [inH, inM] = checkInTime.split(':').map(Number);
  const [stdH, stdM] = standardStart.split(':').map(Number);
  
  const checkInMin = inH * 60 + inM;
  const stdMin = stdH * 60 + stdM;
  
  return checkInMin > stdMin;
}

// Determine if check-out is early compared to standard office end time
// e.g. checkOutTime: '17:45:00', standardEnd: '18:00'
export function isEarlyLeave(checkOutTime, standardEnd = '18:00') {
  if (!checkOutTime) return false;
  const [outH, outM] = checkOutTime.split(':').map(Number);
  const [stdH, stdM] = standardEnd.split(':').map(Number);
  
  const checkOutMin = outH * 60 + outM;
  const stdMin = stdH * 60 + stdM;
  
  return checkOutMin < stdMin;
}

// Returns the date in YYYY-MM-DD format
export function getYYYYMMDD(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Returns the time in HH:MM:SS format
export function getHHMMSS(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Get nice visual formatting for hours/minutes: e.g. '8h 45m'
export function formatDurationString(hours, minutes) {
  if (hours === 0 && minutes === 0) return '0m';
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
