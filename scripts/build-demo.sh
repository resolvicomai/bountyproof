#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <opening-shot> <form-shot> <evidence-shot>" >&2
  exit 2
fi

for command in magick ffmpeg; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

for image in "$@"; do
  if [ ! -f "$image" ]; then
    echo "Screenshot not found: $image" >&2
    exit 1
  fi
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/output"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

OPENING_SHOT="$1"
FORM_SHOT="$2"
EVIDENCE_SHOT="$3"
FONT_BOLD="/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REGULAR="/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_MONO="/System/Library/Fonts/SFNSMono.ttf"
BACKGROUND="#06100c"
GREEN="#7df0a0"
WHITE="#eef8f1"
MUTED="#91a69b"
AMBER="#efc06c"

mkdir -p "$OUTPUT_DIR"

magick -size 1280x720 "xc:$BACKGROUND" \
  -font "$FONT_MONO" -pointsize 24 -fill "$GREEN" -gravity northwest \
  -annotate +76+62 'BOUNTYPROOF' \
  -font "$FONT_BOLD" -pointsize 72 -fill "$WHITE" \
  -annotate +76+150 $'A $1,500 bounty can\nstill be a bad bet.' \
  -font "$FONT_REGULAR" -pointsize 31 -fill "$MUTED" \
  -annotate +80+430 $'Verify payment, competition, scope,\nand expected value before writing code.' \
  -font "$FONT_MONO" -pointsize 22 -fill "$AMBER" \
  -annotate +80+625 'EVIDENCE BEFORE ENGINEERING' \
  "$WORK_DIR/01-title.png"

magick "$OPENING_SHOT" -auto-orient -resize '1280x720^' -gravity center -extent 1280x720 \
  -fill '#06100ce6' -draw 'rectangle 0,0 1280,84' \
  -font "$FONT_BOLD" -pointsize 30 -fill "$WHITE" -gravity north \
  -annotate +0+22 '1  Start with the advertised reward.' \
  "$WORK_DIR/02-opening.png"

magick "$FORM_SHOT" -auto-orient -resize '1280x720^' -gravity center -extent 1280x720 \
  -fill '#06100ce6' -draw 'rectangle 0,0 1280,84' \
  -font "$FONT_BOLD" -pointsize 30 -fill "$WHITE" -gravity north \
  -annotate +0+22 '2  Paste the issue and your actual stack.' \
  "$WORK_DIR/03-form.png"

magick "$EVIDENCE_SHOT" -auto-orient -resize '1280x720^' -gravity center -extent 1280x720 \
  -fill '#06100ce6' -draw 'rectangle 0,0 1280,84' \
  -font "$FONT_BOLD" -pointsize 30 -fill "$WHITE" -gravity north \
  -annotate +0+22 '3  $1,500 headline. 11 competitors. Large scope. SKIP.' \
  "$WORK_DIR/04-evidence.png"

magick -size 1280x720 "xc:$BACKGROUND" \
  -font "$FONT_MONO" -pointsize 22 -fill "$GREEN" -gravity northwest \
  -annotate +76+62 'AGENT-CALLABLE' \
  -font "$FONT_BOLD" -pointsize 54 -fill "$WHITE" \
  -annotate +76+135 'The same decision is an API call.' \
  -font "$FONT_MONO" -pointsize 27 -fill "$AMBER" \
  -annotate +80+275 'POST https://bountyproof.vercel.app/api/scan' \
  -font "$FONT_REGULAR" -pointsize 29 -fill "$MUTED" \
  -annotate +80+365 $'OpenAPI contract\nDeterministic JSON\nEvidence links and risk flags\nNo GitHub login required' \
  "$WORK_DIR/05-api.png"

magick -size 1280x720 "xc:$BACKGROUND" \
  -font "$FONT_MONO" -pointsize 22 -fill "$GREEN" -gravity northwest \
  -annotate +76+62 'FIRST REVENUE OFFER' \
  -font "$FONT_BOLD" -pointsize 60 -fill "$WHITE" \
  -annotate +76+145 'Bounty Viability Audit' \
  -font "$FONT_BOLD" -pointsize 82 -fill "$AMBER" \
  -annotate +76+285 '10 USDT' \
  -font "$FONT_REGULAR" -pointsize 31 -fill "$MUTED" \
  -annotate +80+435 $'One paid GitHub issue\nEvidence report delivered within 4 hours\nEscrow-backed marketplace order' \
  "$WORK_DIR/06-service.png"

magick -size 1280x720 "xc:$BACKGROUND" \
  -font "$FONT_MONO" -pointsize 24 -fill "$GREEN" -gravity northwest \
  -annotate +76+62 'BOUNTYPROOF' \
  -font "$FONT_BOLD" -pointsize 64 -fill "$WHITE" \
  -annotate +76+165 $'Spend engineering time\nwhere it can actually pay.' \
  -font "$FONT_MONO" -pointsize 27 -fill "$AMBER" \
  -annotate +80+470 'bountyproof.vercel.app' \
  -font "$FONT_MONO" -pointsize 24 -fill "$GREEN" \
  -annotate +80+615 '#OKXAI' \
  "$WORK_DIR/07-close.png"

make_segment() {
  local input="$1"
  local duration="$2"
  local fade_out="$3"
  local output="$4"
  ffmpeg -hide_banner -loglevel error -y \
    -loop 1 -framerate 30 -i "$input" -t "$duration" \
    -vf "scale=1280:720,format=yuv420p,fade=t=in:st=0:d=0.35,fade=t=out:st=$fade_out:d=0.35" \
    -r 30 -c:v libx264 -pix_fmt yuv420p -an "$output"
}

make_segment "$WORK_DIR/01-title.png" 6 5.65 "$WORK_DIR/01.mp4"
make_segment "$WORK_DIR/02-opening.png" 7 6.65 "$WORK_DIR/02.mp4"
make_segment "$WORK_DIR/03-form.png" 8 7.65 "$WORK_DIR/03.mp4"
make_segment "$WORK_DIR/04-evidence.png" 10 9.65 "$WORK_DIR/04.mp4"
make_segment "$WORK_DIR/05-api.png" 7 6.65 "$WORK_DIR/05.mp4"
make_segment "$WORK_DIR/06-service.png" 8 7.65 "$WORK_DIR/06.mp4"
make_segment "$WORK_DIR/07-close.png" 6 5.65 "$WORK_DIR/07.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -i "$WORK_DIR/01.mp4" -i "$WORK_DIR/02.mp4" -i "$WORK_DIR/03.mp4" \
  -i "$WORK_DIR/04.mp4" -i "$WORK_DIR/05.mp4" -i "$WORK_DIR/06.mp4" \
  -i "$WORK_DIR/07.mp4" \
  -filter_complex '[0:v][1:v][2:v][3:v][4:v][5:v][6:v]concat=n=7:v=1:a=0[v]' \
  -map '[v]' -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an \
  "$OUTPUT_DIR/bountyproof-okx-demo.mp4"

magick "$WORK_DIR/04-evidence.png" "$OUTPUT_DIR/bountyproof-okx-thumbnail.png"

echo "$OUTPUT_DIR/bountyproof-okx-demo.mp4"
echo "$OUTPUT_DIR/bountyproof-okx-thumbnail.png"
