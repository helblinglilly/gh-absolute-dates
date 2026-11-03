import { formatTimestamp } from "./format";
import { DEFAULTS, loadSettings, type Settings } from "./settings";

const SELECTOR = "relative-time, time-ago";

// Null until storage has loaded; we don't touch the page before then.
let settings: Settings | null = null;

// Roots we already watch, so we never attach two observers to one root.
const watched = new WeakSet<ShadowRoot>();

function format(el: Element): string | null {
  const iso = el.getAttribute("datetime");
  if (!iso || !settings) return null;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  try {
    return formatTimestamp(date, settings);
  } catch {
    // Invalid user pattern: fall back to the default rather than breaking the page.
    return formatTimestamp(date, { ...settings, format: DEFAULTS.format });
  }
}

function apply(el: Element): void {
  const text = format(el);
  if (text === null) return;

  const root = el.shadowRoot;
  if (!root) return;

  const span = root.querySelector("span") ?? root.firstElementChild;
  if (span) {
    // Only write when different: our own write re-triggers the observer.
    if (span.textContent !== text) span.textContent = text;
  } else if (root.textContent !== text) {
    root.textContent = text;
  }

  if (!watched.has(root)) {
    watched.add(root);
    // The element re-renders itself (timer / React); put our text back.
    new MutationObserver(() => apply(el)).observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
}

function scan(node: Node): void {
  if (!(node instanceof Element)) return;
  if (node.matches(SELECTOR)) apply(node);
  node.querySelectorAll(SELECTOR).forEach(apply);
}

// Elements can be upgraded (shadow root created) after insertion, so retry
// shortly for any that don't have a root yet.
function scanWithRetry(node: Node): void {
  scan(node);
  setTimeout(() => scan(node), 300);
}

const rescan = () => scanWithRetry(document.documentElement);

new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === "childList") m.addedNodes.forEach(scanWithRetry);
    // GitHub may change `datetime` when re-using an element.
    else if (m.type === "attributes" && m.target instanceof Element) apply(m.target);
  }
}).observe(document, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["datetime"],
});

document.addEventListener("DOMContentLoaded", rescan);
// Soft navigations (Turbo / React) don't reload the page.
document.addEventListener("turbo:render", rescan);
document.addEventListener("turbo:load", rescan);

loadSettings().then((s) => {
  settings = s;
  rescan();
});

// Apply popup changes live, without a page reload.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  settings = { ...(settings ?? DEFAULTS) };
  for (const [key, { newValue }] of Object.entries(changes)) {
    (settings as unknown as Record<string, unknown>)[key] = newValue;
  }
  rescan();
});
