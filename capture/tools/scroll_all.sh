#!/bin/sh
# usage: scroll_all.sh <screen> <first_state>  — swipe until the frame stops changing
export MSYS_NO_PATHCONV=1
S=$1; prev=$2; i=${START:-1}
while [ $i -le $(( ${START:-1} + ${MAX:-15} - 1 )) ]; do
  adb shell input swipe 640 2100 640 1000 500; sleep 1.2
  python -I tools/cap.py shot $S scroll_$i --from $S/$prev --action "swipe up 1100px" > .last_shot.txt; cat .last_shot.txt; if grep -q FOREIGN_WINDOW .last_shot.txt; then python -I tools/cap.py drop $S/scroll_$i; echo "ABORT: left the app"; exit 2; fi
  if python -I tools/same.py screens/$S/$prev.png screens/$S/scroll_$i.png; then python -I tools/cap.py drop $S/scroll_$i; echo "END: $S/$prev is bottom"; break; fi
  prev=scroll_$i; i=$((i+1))
done
