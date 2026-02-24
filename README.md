# omarchy-chromium-bridge

Chrome MV3 extension that injects [omarchy](https://github.com/basecamp/omarchy) theme CSS into rendered markdown on GitHub, GitLab, Codeberg, Bitbucket, and any URL ending in `.md`.

## What it does

- Content script injects your current omarchy theme's `markdown-github.css` into pages with `.markdown-body` elements
- Background service worker polls a native messaging host every 60s to pick up theme changes
- Popup shows the current theme name with a manual sync button
- Native host reads `~/.config/omarchy/current/theme` symlink and returns the CSS

## Install

### Standalone

```sh
git clone https://github.com/3dyuval/omarchy-chromium-bridge.git
cd omarchy-chromium-bridge
./install.sh
```

The install script detects which chromium-based browsers you have (chromium, brave, helium, chrome) and for each one:
- Symlinks the extension into the browser's `Default/Extensions/` directory
- Registers the native messaging host manifest in `NativeMessagingHosts/`
- Copies the host script to `~/.config/omarchy-theme/`

Restart your browser after installing.

### As part of omarchy

Added as a git submodule at `install/chromium-bridge/`. The omarchy installer menu (item "Theme Bridge") and `omarchy-upgrade` both delegate to `install/chromium-bridge/install.sh`.

## Files

```
manifest.json       # MV3 extension manifest
content.js          # Injects CSS from chrome.storage.local into <head>
background.js       # Polls native host, stores theme CSS in storage
popup.html/js       # Shows current theme, manual sync button
native-host/        # Shell script + manifest template for native messaging
install.sh          # Detects browsers, symlinks extension, registers host
```
