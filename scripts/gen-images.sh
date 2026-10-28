#!/usr/bin/env bash
# 스트레칭 사진을 codex CLI(이미지 생성)로 만든다. 턱 당기기 사진을 기준 인물로 넘겨 인물·옷·배경을 맞춘다.
# 결과 PNG 는 assets-src/ 에 쌓이고, 검수 후 1536px JPEG 로 줄여 assets/stretch/ 에 넣는다.
# 사용: scripts/gen-images.sh [이름...]   (인자 없으면 전부)
set -u
mkdir -p "$(dirname "$0")/../assets-src" && cd "$(dirname "$0")/../assets-src"
REF=../assets/stretch/chin_tuck.jpg
COMMON="Photorealistic studio photo, landscape 3:2. SAME man as in the attached reference photo (same face, same short black hair, same plain heather-grey crew-neck t-shirt, same black trousers), same seamless warm off-white studio background, same soft natural light. Calm, focused, mouth closed. Anatomically correct hands and arms. Whole relevant body part clearly visible with generous margins, subject centered. No text, no arrows, no logos, no watermark."

declare -A P
P[shoulder_roll]="Front view facing the camera, sitting upright on the same black mesh office chair. He is in the top of a big shoulder shrug: BOTH shoulders pulled very high up toward his ears so the neck looks visibly shorter and the trapezius bunches up, arms hanging straight down relaxed at his sides, head level, looking straight ahead. The shrug must be clearly exaggerated and obvious."
P[upper_trap]="Front view facing the camera, sitting upright on the same black office chair. Upper trapezius side-neck stretch. Described from the VIEWER's perspective: his head tilts toward the LEFT side of the image so his ear approaches the shoulder on the left side of the image; the arm on the LEFT side of the image goes up over the top of his head and its hand rests on the far side of his head (above the ear on the RIGHT side of the image), gently pulling the head toward the left side of the image; the arm on the RIGHT side of the image hangs straight down and its hand grips the edge of the chair seat, keeping that shoulder low. The neck on the RIGHT side of the image is visibly lengthened. Face points forward toward the camera, not rotated, eyes open looking forward. Gentle stretch."
P[levator]="Front view facing the camera, sitting upright on the same black office chair. Levator scapulae stretch: his head is rotated about 45 degrees to his left AND bent forward, nose pointing down toward his left knee / left armpit; his left hand rests on the back of his head gently adding pressure downward; his right hand holds the edge of the chair seat beside the right hip so the right shoulder stays down. Gentle stretch."
P[chest_open]="Standing, three-quarter rear-side view from his right side so both the chest line and the shoulder blades are visible. Chest-opening stretch: fingers interlaced behind his lower back, arms straightened and gently lifted backward and down, shoulder blades squeezed together, chest lifted and open, head level with chin neutral (NOT looking up), eyes looking forward. Full body from knees up."
P[w_retraction]="Standing, viewed from directly BEHIND (back view) so the shoulder blades are visible through the t-shirt. Scapular retraction 'W' exercise: both upper arms down at his sides, elbows bent about 90 degrees with forearms pointing up and slightly outward, palms facing forward, forming a W shape; elbows pulled down and back so the shoulder blades are squeezed together toward the spine. Head level. Shot from hips up."
P[neck_isometric]="Exact side profile view (facing left), sitting upright on the same black office chair. Isometric neck extension: both hands with fingers interlaced cupping the back of his head; he presses his head backward into his hands while the hands resist, so the head does not move; head stays perfectly level and upright with a slight chin tuck, elbows pointing forward and out to the sides, back straight. Visible gentle effort in forearms."
P[external_rotation]="Front three-quarter view (camera slightly to his left and slightly above chest height), standing upright. Shoulder external rotation exercise, end position. CRITICAL ARM GEOMETRY: both UPPER ARMS hang straight down and are pressed tightly against the sides of his torso (elbows touching the lower ribs); both ELBOWS are bent at a sharp 90-degree right angle; both FOREARMS are horizontal, parallel to the floor, and rotated outward away from the body so the two forearms form a wide V opening to the sides (like opening a pair of doors), hands roughly 70 cm apart; palms facing up, fingers relaxed. The arms are NOT straight and NOT raised; elbows stay at the waist. Shoulder blades pulled back, chest open, head level. Shot from hips up so both elbows, forearms and hands are fully visible."
P[break_walk]="Candid photorealistic photo of the same man (same grey t-shirt, black trousers) walking away from his desk down a bright, modern, minimal office hallway with plants and large windows, holding a glass of water, relaxed upright posture, mid-stride, soft daylight. Full body, three-quarter front view. No text, no logos."

NAMES=("$@"); [ ${#NAMES[@]} -eq 0 ] && NAMES=("${!P[@]}")
for n in "${NAMES[@]}"; do
  (
    codex exec --skip-git-repo-check -s workspace-write -C "$PWD" -i "$REF" -- \
      "Use your image generation tool to create ONE image, using the attached image only as the identity/style reference, and save it in the current directory as ${n}.png. Image: ${P[$n]} ${COMMON} Do nothing else besides generating and saving the image." \
      < /dev/null > "log-${n}.txt" 2>&1
    [ -f "${n}.png" ] && echo "ok ${n}" || echo "FAIL ${n}"
  ) &
done
wait
