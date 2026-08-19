const PERIOD_KEY = 'leadflow_default_period_days';
const TIMEZONE_KEY = 'leadflow_timezone';

const VALID_PERIODS = [7, 30, 90, 180, 365];

export function getDefaultPeriodDays(): number {
  const stored = Number(localStorage.getItem(PERIOD_KEY));

  if (VALID_PERIODS.includes(stored)) {
    return stored;
  }

  return 30;
}

export function getTimezone(): string {
  return localStorage.getItem(TIMEZONE_KEY) || 'America/Bahia';
}

export function applyPreferences(defaultPeriodDays: number, timezone: string) {
  localStorage.setItem(PERIOD_KEY, String(defaultPeriodDays));
  localStorage.setItem(TIMEZONE_KEY, timezone);
}
