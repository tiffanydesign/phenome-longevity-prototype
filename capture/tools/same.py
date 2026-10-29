"""Exit 0 if two screenshots are visually the same (ignoring small animated regions)."""
import sys

import numpy as np
from PIL import Image

a, b = (np.asarray(Image.open(p).convert("L").resize((160, 347)), dtype=np.float32) for p in sys.argv[1:3])
rows_changed = (np.abs(a - b).mean(axis=1) > 6).mean()
sys.exit(0 if rows_changed < 0.25 else 1)
