/**
 * Smart Automation Engine Utilities for Haazri
 */
import { UserSettings, AttendanceEntry } from '../types';
import { isWithinGeofence, Coordinates } from './geoUtils';

/**
 * Check if today is a weekday (Monday - Friday)
 */
export function isWorkday(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // 1 = Monday, 5 = Friday
}

/**
 * Check if the current time is within [startHHMM, endHHMM]
 */
export function isCurrentTimeWithinWindow(
  startHHMM: string = '08:00',
  endHHMM: string = '16:00',
  now: Date = new Date()
): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = startHHMM.split(':').map(Number);
  const [endH, endM] = endHHMM.split(':').map(Number);

  const startTotal = startH * 60 + (startM || 0);
  const endTotal = endH * 60 + (endM || 0);

  return currentMinutes >= startTotal && currentMinutes <= endTotal;
}

/**
 * Determine if an auto clock-in should be triggered
 */
export function shouldAutoClockIn(
  settings: UserSettings,
  todayEntry: AttendanceEntry | null,
  userLocation: Coordinates | null = null,
  now: Date = new Date()
): { shouldClockIn: boolean; reason: string } {
  // Already clocked in today
  if (todayEntry && todayEntry.loginTime) {
    return { shouldClockIn: false, reason: 'Already clocked in today' };
  }

  // Check if today is a weekday
  if (!isWorkday(now)) {
    return { shouldClockIn: false, reason: 'Today is a weekend' };
  }

  // Geofencing check if enabled
  if (settings.enableGeofence && settings.officeLatitude && settings.officeLongitude) {
    if (!userLocation) {
      return { shouldClockIn: false, reason: 'Waiting for office GPS location detection' };
    }

    const { inGeofence, distanceMeters } = isWithinGeofence(
      userLocation,
      { latitude: settings.officeLatitude, longitude: settings.officeLongitude },
      settings.officeRadiusMeters || 200
    );

    if (!inGeofence) {
      return {
        shouldClockIn: false,
        reason: `Outside office geofence (${distanceMeters}m away, radius is ${settings.officeRadiusMeters || 200}m)`
      };
    }

    return { shouldClockIn: true, reason: 'Within office geofence' };
  }

  // Shift window auto clock-in
  if (settings.autoClockInOnOpen) {
    const windowStart = settings.autoClockInWindowStart || '08:00';
    const windowEnd = settings.autoClockInWindowEnd || '16:00';

    if (isCurrentTimeWithinWindow(windowStart, windowEnd, now)) {
      return { shouldClockIn: true, reason: 'Within auto clock-in shift window' };
    } else {
      return {
        shouldClockIn: false,
        reason: `Outside auto clock-in window (${windowStart} - ${windowEnd})`
      };
    }
  }

  return { shouldClockIn: false, reason: 'Auto clock-in is disabled' };
}

/**
 * Determine if an auto clock-out should be triggered
 */
export function shouldAutoClockOut(
  settings: UserSettings,
  todayEntry: AttendanceEntry | null,
  liveTimerSeconds: number,
  now: Date = new Date()
): { shouldClockOut: boolean; reason: string } {
  // Must be currently working
  if (!todayEntry || !todayEntry.loginTime || todayEntry.logoutTime || todayEntry.status === 'completed') {
    return { shouldClockOut: false, reason: 'Not currently working' };
  }

  // 1. Target Hours auto wrap
  if (settings.autoClockOutOnTarget) {
    const targetSeconds = (settings.targetWorkingHours || 9) * 3600;
    if (liveTimerSeconds >= targetSeconds) {
      return {
        shouldClockOut: true,
        reason: `Completed target ${settings.targetWorkingHours} working hours`
      };
    }
  }

  // 2. Cutoff time failsafe
  if (settings.autoClockOutCutoffTime) {
    const [cutoffH, cutoffM] = settings.autoClockOutCutoffTime.split(':').map(Number);
    const cutoffMinutes = cutoffH * 60 + (cutoffM || 0);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (currentMinutes >= cutoffMinutes) {
      return {
        shouldClockOut: true,
        reason: `Reached end-of-day cutoff time (${settings.autoClockOutCutoffTime})`
      };
    }
  }

  return { shouldClockOut: false, reason: 'Shift target not yet reached' };
}

/**
 * Generate a Windows PowerShell Auto-Logon / Task Scheduler script for the user
 */
export function generatePowerShellAutomationScript(uid: string = 'user'): string {
  return `# =====================================================================
# HAAZRI - Zero-Touch Windows Auto Clock In / Out Script
# Save this file as "haazri_attendance.ps1"
#
# To register in Windows Task Scheduler (Runs on User Logon & Shutdown):
# 1. Open Task Scheduler -> Create Basic Task
# 2. Trigger: "When I log on"
# 3. Action: Start a program -> powershell.exe
#    Arguments: -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\\path\\to\\haazri_attendance.ps1" -Action "clockin"
# =====================================================================

param (
    [string]$Action = "clockin",
    [string]$UserId = "${uid}"
)

$todayStr = (Get-Date).ToString("yyyy-MM-dd")
$nowIso = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$apiUrl = "https://haazri-default-rtdb.firebaseio.com/attendance/$UserId/$todayStr.json"

if ($Action -eq "clockin") {
    $body = @{
        date = $todayStr
        loginTime = $nowIso
        logoutTime = $null
        workedMinutes = 0
        status = "working"
        notes = "Auto Clocked In via Windows Logon"
        updatedAt = $nowIso
    } | ConvertTo-Json

    try {
        # Check if already clocked in today
        $existing = Invoke-RestMethod -Uri $apiUrl -Method Get -ErrorAction SilentlyContinue
        if (-not $existing.loginTime) {
            Invoke-RestMethod -Uri $apiUrl -Method Put -Body $body -ContentType "application/json"
            Write-Host "[Haazri] Successfully Clocked In at $nowIso"
        } else {
            Write-Host "[Haazri] Already clocked in today at $($existing.loginTime)"
        }
    } catch {
        Write-Warning "[Haazri] Failed to contact Firebase: $_"
    }
} elseif ($Action -eq "clockout") {
    try {
        $existing = Invoke-RestMethod -Uri $apiUrl -Method Get -ErrorAction Stop
        if ($existing.loginTime -and -not $existing.logoutTime) {
            $loginDate = [DateTime]::Parse($existing.loginTime)
            $workedMinutes = [Math]::Round(((Get-Date).ToUniversalTime() - $loginDate).TotalMinutes)
            
            $patchBody = @{
                logoutTime = $nowIso
                workedMinutes = $workedMinutes
                status = "completed"
                updatedAt = $nowIso
            } | ConvertTo-Json

            Invoke-RestMethod -Uri $apiUrl -Method Patch -Body $patchBody -ContentType "application/json"
            Write-Host "[Haazri] Successfully Clocked Out at $nowIso ($workedMinutes mins worked)"
        }
    } catch {
        Write-Warning "[Haazri] Error during Clock Out: $_"
    }
}
`;
}
