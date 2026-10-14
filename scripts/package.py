"""Package Shopify upload and complete handoff without dependency caches."""
import os
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root=Path(__file__).resolve().parents[1]
out=Path(os.environ.get('MUSA_OUTPUT_DIR', root.parent/'musa-deliverables')).resolve()
if out.is_relative_to(root):
    raise ValueError('MUSA_OUTPUT_DIR must be outside the checkout to avoid packaging generated files.')
out.mkdir(exist_ok=True)
theme_dirs={'assets','config','layout','locales','sections','snippets','templates'}
source_dirs=theme_dirs | {'docs','scripts','catalog','imports'}
source_files={'.gitignore','README.md','CLAUDE.md','AGENTS.md'}
files=[p for p in root.rglob('*') if p.is_file() and (p.relative_to(root).parts[0] in source_dirs or p.relative_to(root).as_posix() in source_files) and '__pycache__' not in p.parts]
with ZipFile(out/'MUSA-Atelier-Shopify.zip','w',ZIP_DEFLATED) as z:
    for p in files:
        if p.relative_to(root).parts[0] in theme_dirs:z.write(p,p.relative_to(root))
with ZipFile(out/'MUSA-Complete-Project.zip','w',ZIP_DEFLATED) as z:
    for p in files:z.write(p,Path('musa-shopify-theme')/p.relative_to(root))
    for name in ['index-en.html','index-es.html','MUSA-desktop.png','MUSA-mobile.png']:
        z.write(out/name,Path('design-preview')/name)
for filename in ['MUSA-Atelier-Shopify.zip','MUSA-Complete-Project.zip']:
    with ZipFile(out/filename) as z:
        assert z.testzip() is None
        print(filename,len(z.namelist()),'files; archive integrity passed')
with ZipFile(out/'MUSA-Atelier-Shopify.zip') as z:
    assert 'layout/theme.liquid' in z.namelist()
    assert all(Path(p).parts[0] in theme_dirs for p in z.namelist())
print('Shopify directories verified at archive root.')
