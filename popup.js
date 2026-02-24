'use strict';

const currentEl = document.getElementById('current');
const statusEl = document.getElementById('status');
const syncBtn = document.getElementById('sync');

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

chrome.storage.local.get(['themeName', 'themeCSS'], (result) => {
  currentEl.textContent = result.themeName ? formatName(result.themeName) : 'No theme set';
  applyColors(result.themeCSS);
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
    setTimeout(() => { statusEl.textContent = 'Syncs every 60s'; }, 2000);
  });
});
