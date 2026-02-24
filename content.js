'use strict';

function applyTheme(css) {
  let style = document.getElementById('omarchy-theme');
  if (!css) {
    if (style) style.remove();
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = 'omarchy-theme';
    document.head.appendChild(style);
  }
  style.textContent = css;
}

chrome.storage.local.get('themeCSS', (result) => {
  if (result.themeCSS) applyTheme(result.themeCSS);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.themeCSS) {
    applyTheme(changes.themeCSS.newValue || '');
  }
});
