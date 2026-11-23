#!/bin/sh
# cmpall.sh <screen> <frames>: scroll the phone screen top→bottom, diff all labels vs every capture/screens/<screen>/*.xml
export MSYS_NO_PATHCONV=1
S=$1; n=${2:-6}
i=0; while [ $i -le $n ]; do python -I tools/snap.py check/$S f$i > /dev/null; adb shell input swipe 640 2100 640 1000 500; sleep 1.2; i=$((i+1)); done
python -I tools/labels.py screens/$S/*.xml | grep -v '^==' | sed 's/^\[[^]]*\]\[[^]]*\] //' | sort -u > /tmp/c_old.txt
python -I tools/labels.py data2/check/$S/f*.xml | grep -v '^==' | sed 's/^\[[^]]*\]\[[^]]*\] //' | sort -u > /tmp/c_new.txt
echo "=== $S"; diff /tmp/c_old.txt /tmp/c_new.txt | grep '^[<>]' | head -${N:-40}
