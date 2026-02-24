#!/bin/bash
#
# Install omarchy-chromium-bridge for all detected chromium-based browsers.
# Can be run standalone or from the omarchy installer.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_ID="dmapojlcklnkobakfjmnnlplnplchhmh"

echo "Installing Omarchy Chromium Bridge..."

# Install native host script
mkdir -p ~/.config/omarchy-theme
cp "$SCRIPT_DIR/native-host/omarchy_theme_host.sh" ~/.config/omarchy-theme/
chmod +x ~/.config/omarchy-theme/omarchy_theme_host.sh

HOST_PATH="$HOME/.config/omarchy-theme/omarchy_theme_host.sh"

# Build native messaging manifest
TEMP_MANIFEST=$(mktemp)
cat >"$TEMP_MANIFEST" <<EOF
{
    "name": "com.omarchy.theme",
    "description": "Omarchy theme bridge - returns current theme CSS for browser extension",
    "path": "$HOST_PATH",
    "type": "stdio",
    "allowed_origins": [
        "chrome-extension://$EXT_ID/"
    ]
}
EOF

cmd_present() {
  command -v "$1" &>/dev/null
}

install_for_browser() {
  local cmd="$1"
  local label="$2"
  local config_dir="$3"

  cmd_present "$cmd" || return 0

  # Symlink extension into browser profile
  local ext_dir="$config_dir/Default/Extensions/$EXT_ID"
  if [[ ! -d "$ext_dir" ]]; then
    mkdir -p "$config_dir/Default/Extensions"
    ln -sf "$SCRIPT_DIR" "$ext_dir"
  fi

  # Register native messaging host
  mkdir -p "$config_dir/NativeMessagingHosts"
  cp "$TEMP_MANIFEST" "$config_dir/NativeMessagingHosts/com.omarchy.theme.json"

  echo "  ✓ $label"
}

install_for_browser chromium             "Chromium"  "$HOME/.config/chromium"
install_for_browser brave                "Brave"     "$HOME/.config/BraveSoftware/Brave-Browser"
install_for_browser helium-browser       "Helium"    "$HOME/.config/helium-browser"
install_for_browser google-chrome-stable "Chrome"    "$HOME/.config/google-chrome"

rm "$TEMP_MANIFEST"

echo ""
echo "Done! Extension auto-syncs theme changes every 60s."
echo "Restart your browser to activate."
