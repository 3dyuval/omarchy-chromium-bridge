'use strict';

const NATIVE_HOST = 'com.omarchy.theme';
const DEFAULT_INTERVAL = 1;

function queryNativeHost(request) {
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(NATIVE_HOST, request, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Omarchy native host unavailable:', chrome.runtime.lastError.message);
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

async function syncTheme() {
  const response = await queryNativeHost({ action: 'get_current' });
  if (!response || !response.theme || !response.css) return null;

  const current = await chrome.storage.local.get('themeName');
  if (current.themeName !== response.theme) {
    await chrome.storage.local.set({ themeName: response.theme, themeCSS: response.css });
  }
  return response;
}

async function createAlarm(minutes) {
  await chrome.alarms.clear('poll-theme');
  chrome.alarms.create('poll-theme', { periodInMinutes: minutes });
}

chrome.runtime.onInstalled.addListener(async () => {
  const { pollInterval } = await chrome.storage.local.get('pollInterval');
  createAlarm(pollInterval || DEFAULT_INTERVAL);
  syncTheme();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'poll-theme') syncTheme();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sync') {
    syncTheme().then((response) => {
      sendResponse(response || { error: 'Native host unavailable' });
    });
    return true;
  }
  if (message.action === 'set_interval') {
    createAlarm(message.minutes);
    sendResponse({ ok: true });
  }
});
