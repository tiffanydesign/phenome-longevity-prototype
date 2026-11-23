"""montage.py out.png scale file1.png file2.png ... (side by side)"""
import sys
from PIL import Image
s=float(sys.argv[2]); ims=[Image.open(f) for f in sys.argv[3:]]
ims=[i.resize((int(i.width*s),int(i.height*s))) for i in ims]
W=sum(i.width for i in ims)+6*(len(ims)-1); H=max(i.height for i in ims)
o=Image.new('RGB',(W,H),'red'); x=0
for i in ims: o.paste(i,(x,0)); x+=i.width+6
o.save(sys.argv[1])
