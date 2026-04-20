export const reminderOffsetLabel: Record<string, string> = {
  "1day": "1 day early",
  "3days": "3 days early",
  "1week": "1 week early",
  "2weeks": "2 weeks early",
};

export function getReminderOffsetMs(reminderOffset: string) {
  switch (reminderOffset) {
    case "1day":
      return 24 * 60 * 60 * 1000;
    case "3days":
      return 3 * 24 * 60 * 60 * 1000;
    case "1week":
      return 7 * 24 * 60 * 60 * 1000;
    case "2weeks":
      return 14 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}
