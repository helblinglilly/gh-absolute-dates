export interface Settings {
  /** When the timestamp is from today, drop everything date-related. */
  hideDateToday: boolean;
  /** When the timestamp is from the current year, drop the year. */
  hideYearThisYear: boolean;
  /** One pattern for the whole timestamp, e.g. "d MMM yyyy, HH:mm". */
  format: string;
}

export const DEFAULTS: Settings = {
  hideDateToday: false,
  hideYearThisYear: false,
  format: "d MMM yyyy, HH:mm",
};

export async function loadSettings(): Promise<Settings> {
  return (await chrome.storage.sync.get(DEFAULTS)) as unknown as Settings;
}
