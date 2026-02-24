'use strict';

const currentEl = document.getElementById('current');
const statusEl = document.getElementById('status');
const syncBtn = document.getElementById('sync');
const intervalInput = document.getElementById('interval');
const infoToggle = document.getElementById('info-toggle');
const infoDetails = document.getElementById('info');

function formatName(name) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function applyColors(css) {
  if (!css) return;
  const bg = css.match(/--bgColor-default:\s*([^;]+)/);
  const fg = css.match(/--fgColor-default:\s*([^;]+)/);
  if (bg) document.body.style.background = bg[1].trim();
  if (fg) document.body.style.color = fg[1].trim();
}

// Load saved interval
chrome.storage.local.get(['themeName', 'themeCSS', 'pollInterval'], (result) => {
  currentEl.textContent = result.themeName ? formatName(result.themeName) : 'No theme set';
  applyColors(result.themeCSS);
  if (result.pollInterval) intervalInput.value = result.pollInterval;
});

syncBtn.addEventListener('click', () => {
  statusEl.textContent = 'Syncing...';
  chrome.runtime.sendMessage({ action: 'sync' }, (response) => {
    if (response && response.theme) {
      currentEl.textContent = formatName(response.theme);
      statusEl.textContent = 'Synced!';
      chrome.storage.local.get('themeCSS', (r) => applyColors(r.themeCSS));
    } else {
      statusEl.textContent = 'Native host unavailable';
    }
    setTimeout(() => { statusEl.textContent = ''; }, 2000);
  });
});

intervalInput.addEventListener('change', () => {
  const mins = Math.max(1, Math.min(60, parseInt(intervalInput.value) || 1));
  intervalInput.value = mins;
  chrome.storage.local.set({ pollInterval: mins });
  chrome.runtime.sendMessage({ action: 'set_interval', minutes: mins });
});

infoToggle.addEventListener('click', () => {
  infoDetails.open = !infoDetails.open;
});
