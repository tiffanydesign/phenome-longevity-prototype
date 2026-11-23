#!/bin/sh
# Capture every Health Monitor metric × period into data2/mon/<metric>/<period>_<n>.png
# Run from capture/, with the monitor screen open. D is stepped back $BACK days.
export MSYS_NO_PATHCONV=1
BACK=${BACK:-6}
snapall() { # $1 dir $2 prefix
  prev=""
  for n in $(seq 0 ${MAXF:-4}); do
    out=$(python -I tools/snap.py "$1" "$2_$n")
    sig=$(echo "$out" | sed 's/^\[[^]]*\]\[[^]]*\] //' | sort | md5sum)
    if [ "$sig" = "$prev" ]; then rm -f data2/$1/$2_$n.*; break; fi
    prev=$sig
    adb shell input swipe 640 2000 640 1100 500; sleep 1.2
  done
  for k in 1 2 3 4 5; do adb shell input swipe 640 900 640 2400 200; done; sleep 0.8
}
for M in "$@"; do
  python -I tools/cap.py tap "^(Step Count|Calories|Step Distance|Respiratory Rate|Blood Pressure|Blood Oxygen.*|Resting Heart Rate|Heart Rate|Heart Rate Variability|Sleep Score|Sleep Consistency|Sleep Efficiency|Hours vs Needs|Restorative Sleep)$" >/dev/null 2>&1
  sleep 1.2
  python -I tools/cap.py tap "^$M$" >/dev/null || { echo "no item $M"; adb shell input tap 634 442; sleep 1; continue; }
  sleep 2.5
  slug=$(echo "$M" | tr 'A-Z ' 'a-z_' | tr -cd 'a-z_')
  for P in ${PERIODS:-W M 6M Y D}; do
    python -I tools/cap.py tap "^$P$" >/dev/null; sleep 2.2
    if [ $P = D ]; then python -I tools/prev.py ${DAY:-17}; sleep 1.5; fi
    snapall "mon/$slug" "$P"
    echo "done $slug $P"
  done
done
