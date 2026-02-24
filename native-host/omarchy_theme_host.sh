#!/bin/bash
#
# Native messaging host for Omarchy Theme chrome extension.
# Reads requests from stdin (Chrome native messaging protocol: 4-byte length + JSON),
# and returns theme name + CSS content from the omarchy themes directory.
#

THEMES_DIR="$HOME/.config/omarchy/themes"
CURRENT_THEME_LINK="$HOME/.config/omarchy/current/theme"

read_message() {
  local len_bytes
  len_bytes=$(dd bs=1 count=4 2>/dev/null)
  [[ -z "$len_bytes" ]] && exit 0

  local len
  len=$(printf '%d' "0x$(echo -n "$len_bytes" | od -An -tx1 | tr -d ' ' | sed 's/\(.\{2\}\)\(.\{2\}\)\(.\{2\}\)\(.\{2\}\)/\4\3\2\1/')")

  dd bs=1 count="$len" 2>/dev/null
}

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

# Main: read one request, respond, exit
request=$(read_message)
action=$(echo "$request" | jq -r '.action // ""')
req_theme=$(echo "$request" | jq -r '.theme // ""')

case "$action" in
  get_current)
    theme=$(get_current_theme)
    css=$(get_theme_css "$theme")
    send_message "$(jq -n --arg theme "$theme" --arg css "$css" '{theme: $theme, css: $css}')"
    ;;

  get_theme)
    css=$(get_theme_css "$req_theme")
    send_message "$(jq -n --arg theme "$req_theme" --arg css "$css" '{theme: $theme, css: $css}')"
    ;;

  *)
    theme=$(get_current_theme)
    css=$(get_theme_css "$theme")
    send_message "$(jq -n --arg theme "$theme" --arg css "$css" '{theme: $theme, css: $css}')"
    ;;
esac
