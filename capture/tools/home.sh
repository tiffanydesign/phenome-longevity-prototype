#!/bin/sh
# go to a bottom-nav tab from anywhere: home.sh [Home|Insights|Store|Profile]
export MSYS_NO_PATHCONV=1
T=${1:-Home}
for i in 1 2 3 4 5 6 7 8; do
  N=$(python -I tools/cap.py nodes)
  if ! echo "$N" | grep -q "focus: com.szalongevity"; then adb shell am start -n com.szalongevity.sza_mobile/.MainActivity >/dev/null 2>&1; sleep 3; continue; fi
  if echo "$N" | grep -q "'Insights'$"; then python -I tools/cap.py tap "^$T$" >/dev/null; sleep 2.5; exit 0; fi
  adb shell input keyevent KEYCODE_BACK; sleep 1.5
done
echo "home.sh: could not reach tab bar"; exit 1
