#!/bin/sh
# usage: visit.sh <screen> <from_id> <desc-regex> [nth] [--noback]
# tap node, wait, capture top + scroll to bottom, then go back
export MSYS_NO_PATHCONV=1
S=$1; FROM=$2; RX=$3; NTH=${4:-0}
python -I tools/cap.py tap "$RX" --nth $NTH || exit 1
sleep 3
python -I tools/cap.py shot $S top --from $FROM --via "$RX"
sh tools/scroll_all.sh $S top
python -I tools/cap.py nodes > screens/$S/_nodes_bottom.txt
if [ "$5" != "--noback" ]; then adb shell input keyevent KEYCODE_BACK; sleep 2; fi
