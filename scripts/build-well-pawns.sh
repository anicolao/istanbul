#!/bin/sh
# Run from the repository root on macOS (uses the built-in sips utility).
# Crop transparent source margins, then prefilter to a stable display resolution.
set -eu
mkdir -p static/art/game/pieces/wells
while read name width height left top; do
  sips -c "$height" "$width" --cropOffset "$top" "$left" "static/art/game/pieces/$name-transparent.png" --out "static/art/game/pieces/wells/$name.png" >/dev/null
  sips --resampleWidth 256 "static/art/game/pieces/wells/$name.png" >/dev/null
done <<'BOUNDS'
merchant-ruby 713 1123 215 137
merchant-saffron 713 1184 224 130
merchant-teal 737 1230 184 87
merchant-indigo 749 1206 186 110
merchant-plum 795 1271 138 71
neutral-merchant 664 1093 235 120
governor 763 1265 182 39
smuggler 743 1206 211 57
BOUNDS
