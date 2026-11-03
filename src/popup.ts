import { formatTimestamp } from "./format";
import { DEFAULTS, loadSettings, type Settings } from "./settings";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const hideDateToday = $<HTMLInputElement>("hideDateToday");
const hideYearThisYear = $<HTMLInputElement>("hideYearThisYear");
const format = $<HTMLInputElement>("format");
const preview = $("preview");

function current(): Settings {
  return {
    hideDateToday: hideDateToday.checked,
    hideYearThisYear: hideYearThisYear.checked,
    format: format.value,
  };
}

function render(s: Settings): void {
  hideDateToday.checked = s.hideDateToday;
  hideYearThisYear.checked = s.hideYearThisYear;
  format.value = s.format;
  updatePreview();
}

function updatePreview(): void {
  const s = current();
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), 0, 2, 9, 5);
  const earlier = new Date(now.getFullYear() - 1, 2, 7, 15, 4);
  try {
    preview.textContent = `Today: ${formatTimestamp(now, s)}\nThis year: ${formatTimestamp(thisYear, s)}\nOlder: ${formatTimestamp(earlier, s)}`;
  } catch (e) {
    preview.textContent = `Invalid format: ${e instanceof Error ? e.message : e}`;
  }
  preview.style.whiteSpace = "pre";
}

function save(): void {
  updatePreview();
  void chrome.storage.sync.set(current());
}

for (const el of [hideDateToday, hideYearThisYear, format]) {
  el.addEventListener("input", save);
}
$("reset").addEventListener("click", () => {
  render(DEFAULTS);
  save();
});

loadSettings().then(render);
