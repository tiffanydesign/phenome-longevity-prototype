#!/bin/sh
# cmp.sh <screen> [state]: snap the phone now and diff its labels against capture/screens/<screen>/<state>.xml
export MSYS_NO_PATHCONV=1
S=$1; T=${2:-top}
python -I tools/snap.py check/$S $T > /dev/null
python -I tools/labels.py screens/$S/$T.xml | tail -n +2 | sed 's/^\[[^]]*\]\[[^]]*\] //' | sort -u > /tmp/c_old.txt
python -I tools/labels.py data2/check/$S/$T.xml | tail -n +2 | sed 's/^\[[^]]*\]\[[^]]*\] //' | sort -u > /tmp/c_new.txt
echo "=== $S/$T"; diff /tmp/c_old.txt /tmp/c_new.txt | grep '^[<>]' | head -${N:-12}
