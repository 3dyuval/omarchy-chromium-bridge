'use strict';

const currentEl = document.getElementById('current');
const statusEl = document.getElementById('status');
const syncBtn = document.getElementById('sync');

function formatName(name) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

chrome.storage.local.get('themeName', (result) => {
  currentEl.textContent = result.themeName ? formatName(result.themeName) : 'No theme set';
});

syncBtn.addEventListener('click', () => {
  statusEl.textContent = 'Syncing...';
  chrome.runtime.sendMessage({ action: 'sync' }, (response) => {
    if (response && response.theme) {
      currentEl.textContent = formatName(response.theme);
      statusEl.textContent = 'Synced!';
    } else {
      statusEl.textContent = 'Native host unavailable';
    }
    setTimeout(() => { statusEl.textContent = 'Syncs every 60s'; }, 2000);
  });
});
