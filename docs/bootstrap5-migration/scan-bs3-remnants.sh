#!/usr/bin/env bash
#
# Scan the Elektra source tree for leftover Bootstrap 3 (and BS4) class names and
# data attributes that the BS3->BS5 migration should have replaced.
#
# Covers all class syntaxes: ERB/HTML class="...", JSX className="..."/{`...`},
# HAML dot-notation (%tag.x / leading .x), Ruby class: '...'/content_tag, and
# dynamic strings built in JS.
#
# Excludes generated/vendored trees and common false positives. Every non-zero
# count MUST be reviewed by hand - this script flags candidates, it does not
# prove a remnant.
#
# Usage:  docs/bootstrap5-migration/scan-bs3-remnants.sh
# From the dev container:  bin/workspace bash docs/bootstrap5-migration/scan-bs3-remnants.sh

set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

INCLUDES=(--include=*.haml --include=*.erb --include=*.html
          --include=*.jsx --include=*.tsx --include=*.js --include=*.ts
          --include=*.rb)
ROOTS=(app plugins config lib)

# shared exclusion of generated/vendored output + comments + tests
exclude() {
  grep -vE 'app/assets/builds/|/node_modules/|/vendor/|/public/|\.min\.|//|/\*|\.test\.'
}

# $1 = human label, $2 = extended regex, $3 = extra per-line exclusion regex (optional)
scan() {
  local label="$1" re="$2" extra="${3:-}"
  local hits
  if [ -n "$extra" ]; then
    hits=$(grep -rnE "$re" "${INCLUDES[@]}" "${ROOTS[@]}" 2>/dev/null | exclude | grep -vE "$extra")
  else
    hits=$(grep -rnE "$re" "${INCLUDES[@]}" "${ROOTS[@]}" 2>/dev/null | exclude)
  fi
  local n
  n=$(printf '%s' "$hits" | grep -c . )
  if [ "$n" -gt 0 ]; then
    printf '\n### %s : %s hit(s)\n' "$label" "$n"
    printf '%s\n' "$hits"
  else
    printf '%-28s OK (0)\n' "$label"
  fi
}

echo "== Bootstrap 3/4 remnant scan =="
echo "(0 = clean; any hit = review by hand. app-owned well/btn-xs/caret are expected to still appear in markup.)"
echo

# --- removed/renamed classes (word-boundary; all syntaxes share the token) ---
scan "panel(-*)"            '(\.|class="|className="|class: .|class: '"'"')panel(-default|-heading|-body|-title|-footer|-group)?\b' 'juno-panel|tabpanel|data-testid'
scan "btn-default"          '\bbtn-default\b'
scan "btn-block"            '\bbtn-block\b'
scan "label-*"              '\blabel-(default|primary|success|info|warning|danger)\b' 'label-right|label-tooltip|label-greyscale|labelClassName|StateLabel|labelClassToBg|useStatus'
scan "well"                 '(^\s*|%[a-z0-9]+)\.well\b|class="[^"]*\bwell\b|className="[^"]*\bwell\b|class: .[^,]*\bwell\b' 'farewell|well-known|wellknown'
scan "page-header"          '\bpage-header\b'
scan "jumbotron"            '\bjumbotron\b'
scan "pull-left/right"      '\bpull-(left|right)\b'
scan "col-xs-*"             '\bcol-xs-[0-9]'
scan "hidden-xs/visible-xs" '\b(hidden-xs|hidden-sm|visible-xs|visible-sm)\b'
scan "img-responsive"       '\bimg-responsive\b'
scan "sr-only"              '\bsr-only\b' 'visually-hidden'
scan "input-group-addon/btn" '\binput-group-(addon|btn)\b'
scan "control-label"        '\bcontrol-label\b'
scan "help-block"           '\bhelp-block\b' 'help-block-text|help-block-popover'
scan "form-group"           '\bform-group\b' 'form-group-size'
scan "BS4 spacing ml/mr/pl/pr" '\b(ml|mr|pl|pr)-(0|1|2|3|4|5|auto)\b' 'tw-'
scan "badge-pill"           '\bbadge-pill\b'
scan "dropdown-menu-right"  '\bdropdown-menu-right\b'
scan "glyphicon"            '\bglyphicon'
scan "navbar BS3"           '\b(navbar-inverse|navbar-header|navbar-right|navbar-toggle|navbar-fixed-top|icon-bar)\b'
scan "alert-error/alert/notice" '\balert-(error|alert|notice)\b'

# --- BS3 data attributes (custom values excluded) ---
scan "data-toggle (BS)"     'data-toggle=' 'data-toggle="help"|paginationSpinner|show-error-details'
scan "data-dismiss (BS)"    'data-dismiss='
scan "data-target (BS #id)" 'data-target="#'
scan "data-ride/slide/backdrop/keyboard" 'data-(ride|slide|backdrop|keyboard)='

# --- BS3-only jQuery plugins (expect intentional/zero) ---
scan "jq .multiselect("     '\.multiselect\('
scan "bootstrap-select"     'bootstrap-select|\.selectpicker'
scan "jq .slider("          '\.slider\('
scan "datetimepicker"       'datetimepicker'
scan "jquery-ui autocomplete" '\.autocomplete\('

echo
echo "== done =="
