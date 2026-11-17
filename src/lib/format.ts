export const dateTimeFormat = new Intl.DateTimeFormat('en', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

export function formatDateTime(timestamp: number) {
  return dateTimeFormat.format(new Date(timestamp));
}

export function deliveryCode(id: number) {
  return `DL-${String(id).padStart(5, '0')}`;
}
