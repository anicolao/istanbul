#!/usr/bin/env bash
set -euo pipefail

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick is required (run with nix shell nixpkgs#imagemagick)." >&2
  exit 1
fi

source_dir="art/source-atlases"
output_dir="static/art/game"
mkdir -p "$output_dir"/{locations,pieces,cards,mats,components}

split_atlas() {
  local atlas="$1"
  local geometry="$2"
  local destination="$3"
  shift 3
  local names=("$@")
  local temp_dir
  temp_dir="$(mktemp -d)"
  magick "$source_dir/$atlas" -crop "$geometry@" +repage +adjoin "$temp_dir/cell-%02d.webp"
  for index in "${!names[@]}"; do
    mv "$temp_dir/cell-$(printf '%02d' "$index").webp" "$output_dir/$destination/${names[$index]}.webp"
  done
  rmdir "$temp_dir"
}

split_atlas locations.png 4x4 locations \
  01-wainwright 02-fabric-warehouse 03-spice-warehouse 04-fruit-warehouse \
  05-post-office 06-caravansary 07-fountain 08-black-market \
  09-tea-house 10-large-market 11-small-market 12-police-station \
  13-sultans-palace 14-small-mosque 15-great-mosque 16-gemstone-dealer

split_atlas pieces.png 5x4 pieces \
  merchant-ruby merchant-saffron merchant-teal merchant-indigo merchant-plum \
  assistant-ruby assistant-saffron assistant-teal assistant-indigo assistant-plum \
  family-ruby family-saffron family-teal family-indigo family-plum \
  neutral-merchant governor smuggler first-player dice-pair

split_atlas bonus-cards.png 4x3 cards \
  gain-good gain-lira repeat-sultan repeat-post \
  repeat-gemstone return-family stay long-move \
  wild-small-market return-assistant card-back deck

split_atlas player-mats.png 1x5 mats ruby saffron teal indigo plum

split_atlas mosque-powers.png 2x2 components \
  mosque-fabric mosque-spice mosque-fruit mosque-jewelry

split_atlas components.png 5x4 components \
  fabric spice fruit jewelry lira \
  ruby wheelbarrow-extension die mail-marker bonus-deck \
  legacy-mosque-fabric legacy-mosque-spice legacy-mosque-fruit legacy-mosque-jewelry sultan-track \
  demand-large demand-small gemstone-track ruby-supply goods-supply

rm "$output_dir"/components/legacy-mosque-{fabric,spice,fruit,jewelry}.webp
