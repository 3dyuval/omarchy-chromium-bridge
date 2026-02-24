#!/bin/bash
#
# Native messaging host for Omarchy Theme chrome extension.
# Reads requests from stdin (Chrome native messaging protocol: 4-byte length + JSON),
# and returns theme name + CSS content from the omarchy themes directory.
#

THEMES_DIR="$HOME/.config/omarchy/themes"
CURRENT_THEME_LINK="$HOME/.config/omarchy/current/theme"

# Read a native messaging request: 4-byte little-endian length, then JSON
read_message() {
  local len_bytes
  len_bytes=$(dd bs=1 count=4 2>/dev/null)
  [[ -z "$len_bytes" ]] && exit 0

  local len
  len=$(printf '%d' "0x$(echo -n "$len_bytes" | od -An -tx1 | tr -d ' ' | sed 's/\(.\{2\}\)\(.\{2\}\)\(.\{2\}\)\(.\{2\}\)/\4\3\2\1/')")

  dd bs=1 count="$len" 2>/dev/null
}

# Write a native messaging response
send_message() {
  local message="$1"
  local len=${#message}
  printf "$(printf '\\x%02x\\x%02x\\x%02x\\x%02x' \
    $((len & 0xFF)) \
    $(((len >> 8) & 0xFF)) \
    $(((len >> 16) & 0xFF)) \
    $(((len >> 24) & 0xFF))
  )%s" "$message"
}

get_current_theme() {
  if [[ -L "$CURRENT_THEME_LINK" ]]; then
    basename "$(readlink "$CURRENT_THEME_LINK")"
  else
    echo ""
  fi
}

get_theme_css() {
  local css_file="$THEMES_DIR/$1/markdown-github.css"
  [[ -f "$css_file" ]] && cat "$css_file" || echo ""
}

# Build JSON via python for safety (handles escaping)
build_json() {
  python3 -c "$1"
}

# Main
request=$(read_message)
action=$(echo "$request" | python3 -c "import sys,json; print(json.load(sys.stdin).get('action',''))" 2>/dev/null)
req_theme=$(echo "$request" | python3 -c "import sys,json; print(json.load(sys.stdin).get('theme',''))" 2>/dev/null)

case "$action" in
  get_current)
    theme=$(get_current_theme)
    css=$(get_theme_css "$theme")
    response=$(build_json "
import json, sys
css = sys.stdin.read()
print(json.dumps({'theme': '$theme', 'css': css}))
" <<< "$css")
    send_message "$response"
    ;;

  get_theme)
    css=$(get_theme_css "$req_theme")
    response=$(build_json "
import json, sys
css = sys.stdin.read()
print(json.dumps({'theme': '$req_theme', 'css': css}))
" <<< "$css")
    send_message "$response"
    ;;

  list_themes)
    response=$(python3 -c "
import os, json

themes_dir = os.path.expanduser('$THEMES_DIR')
themes = []
for name in sorted(os.listdir(themes_dir)):
    theme_dir = os.path.join(themes_dir, name)
    if not os.path.isdir(theme_dir):
        continue
    kitty_conf = os.path.join(theme_dir, 'kitty.conf')
    bg, fg = '#1e1e2e', '#cdd6f4'
    if os.path.isfile(kitty_conf):
        for line in open(kitty_conf):
            parts = line.strip().split()
            if len(parts) == 2:
                if parts[0] == 'background': bg = parts[1]
                elif parts[0] == 'foreground': fg = parts[1]
    label = name.replace('-', ' ').title()
    themes.append({'name': name, 'label': label, 'bg': bg, 'fg': fg})
print(json.dumps({'themes': themes}))
")
    send_message "$response"
    ;;

  *)
    theme=$(get_current_theme)
    css=$(get_theme_css "$theme")
    response=$(build_json "
import json, sys
css = sys.stdin.read()
print(json.dumps({'theme': '$theme', 'css': css}))
" <<< "$css")
    send_message "$response"
    ;;
esac
