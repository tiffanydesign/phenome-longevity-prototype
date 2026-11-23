import re,sys
sys.stdout.reconfigure(encoding="utf-8")
for f in sys.argv[1:]:
  print("==",f)
  x=open(f,encoding='utf-8').read()
  for n in re.finditer(r'<node ([^>]*?)/?>',x):
    a=dict(re.findall(r'(\S+?)="([^"]*)"',n.group(1)));l=(a.get('content-desc') or a.get('text') or '').replace('&#10;',' | ')
    if l and l not in ('D','W','M','6M','Y','Your Health Monitor'): print(a['bounds'],l[:110])
