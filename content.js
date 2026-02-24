'use strict';

// Maps --ctp-* (used by catppuccin icon extension SVGs) to CSS variable
// names defined in our markdown-github.css. The content script extracts
// hex values from the injected CSS and promotes them to :root so the
// icon extension's SVGs pick up our theme colors.
//
// Some ctp colors (flamingo, rosewater, etc.) don't have exact matches
// in the markdown CSS, so we map them to the closest semantic equivalent.
const CTP_MAP = {
  'text':      '--fgColor-default',
  'red':       '--fgColor-danger',
  'green':     '--fgColor-success',
  'blue':      '--fgColor-accent',
  'yellow':    '--fgColor-attention',
  'pink':      '--fgColor-done',
  'teal':      '--color-prettylights-syntax-constant-other-reference-link',
  'mauve':     '--color-prettylights-syntax-keyword',
  'peach':     '--color-prettylights-syntax-entity-tag',
  'overlay1':  '--borderColor-default',
  'sky':       '--color-prettylights-syntax-constant',
  'sapphire':  '--color-prettylights-syntax-constant',
  'lavender':  '--borderColor-accent-emphasis',
  'rosewater': '--fgColor-done',
  'flamingo':  '--fgColor-done',
  'maroon':    '--fgColor-danger',
};

function extractVar(css, name) {
  const escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const m = css.match(new RegExp(escaped + ':\\s*(#[0-9a-fA-F]{6})\\b'));
  return m ? m[1] : null;
}

function buildCtpBlock(css) {
  const lines = [];
  for (const [ctp, srcVar] of Object.entries(CTP_MAP)) {
    const hex = extractVar(css, srcVar);
    if (hex) lines.push(`  --ctp-${ctp}: ${hex};`);
  }
  return lines.length ? `:root {\n${lines.join('\n')}\n}\n` : '';
}

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
  style.textContent = buildCtpBlock(css) + css;
}

chrome.storage.local.get('themeCSS', (result) => {
  if (result.themeCSS) applyTheme(result.themeCSS);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.themeCSS) {
    applyTheme(changes.themeCSS.newValue || '');
  }
});
