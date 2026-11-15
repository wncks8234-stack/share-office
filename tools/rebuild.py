"""Rebuild the deployed office page from project/Main.dc.html using the exported bundle as the shell."""
import re,json,sys,os
def camel(s):
    def tag(m):
        t=m.group(0)
        return re.sub(r'(\s)([a-z]+[A-Z][A-Za-z]*)(=)', lambda a: a.group(1)+'sc-camel-'+re.sub(r'([A-Z])',lambda b:'-'+b.group(1).lower(),a.group(2))+a.group(3), t)
    return re.sub(r'<[a-zA-Z][^<>]*?(?:"[^"]*"[^<>]*?)*>', tag, s)
def build(main_src, shell_path, out_path=None):
    d=open(shell_path).read()
    m=re.search(r'(<script type="__bundler/template">)(.*?)(</script>)',d,re.S)
    t=json.loads(m.group(2))
    ti=t.index('</helmet>'); mb=main_src[main_src.index('<x-dc>'):]
    body=camel(mb[mb.index('</helmet>'):])
    body=re.sub(r'<(/?)select(?=[\s>])', r'<\1sc-raw-select', body)
    # keep the export's normalized script tag, swap only the script body
    bi=body.index('<script type="text/x-dc"'); bj=body.index('>',bi)+1
    ti2=t.index('<script type="text/x-dc"',ti); tj=t.index('>',ti2)+1
    body=body[:bi]+t[ti2:tj]+body[bj:]
    new_t=t[:ti]+body
    return t, new_t, d, m
def _check(src_path):
    src=open(src_path).read()
    t,new_t,d,m=build(src,os.path.join(os.path.dirname(os.path.abspath(__file__)),'shell.html'))
    print('identical to export:', t==new_t)
    if t!=new_t:
        for i,(a,b) in enumerate(zip(t,new_t)):
            if a!=b: print(i, repr(t[i-100:i+100]),'\n',repr(new_t[i-100:i+100])); break
        print(len(t),len(new_t))

def write_site(main_dc_path, out_dir):
    """main_dc_path: the canvas's project/Main.dc.html; out_dir: this repo's root."""
    import os
    src=open(main_dc_path).read()
    t,new_t,d,m=build(src,os.path.join(os.path.dirname(os.path.abspath(__file__)),'shell.html'))
    tail_t=t[t.rindex('</script>'):]; new_t=new_t[:new_t.rindex('</script>')]+tail_t
    enc=json.dumps(new_t, ensure_ascii=False).replace('</','<\\u002F')
    page=d[:m.start(2)]+'\n'+enc+'\n  '+d[m.end(2):]
    ids=re.findall(r'/_blob/([0-9a-f]{32})', new_t)
    for i in set(ids):
        page=page.replace('/_blob/'+i, '_blob/'+i+'.svg')
    open(os.path.join(out_dir,'index.html'),'w').write(page)
    return sorted(set(ids))

if __name__=='__main__':
    # usage: python3 tools/rebuild.py path/to/Main.dc.html  (writes index.html in the repo root)
    root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(write_site(sys.argv[1], root))
