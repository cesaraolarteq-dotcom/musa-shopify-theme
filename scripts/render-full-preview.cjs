// Compose a design-only homepage from a supplied design snapshot and this catalog branch.
const fs=require('fs'), path=require('path'), os=require('os');
const catalogRoot=path.resolve(__dirname,'..');
const design=path.resolve(process.argv[2] || catalogRoot);
const {Liquid}=require(path.join(catalogRoot,'..','.musa-tools','node_modules','liquidjs'));
const output=path.resolve(process.env.MUSA_FULL_PREVIEW_OUTPUT || path.join(catalogRoot,'..','musa-full-preview'));
const partials=fs.mkdtempSync(path.join(os.tmpdir(),'musa-full-'));
fs.mkdirSync(output,{recursive:true});
const clean=text=>text.replace(/\{% schema %\}[\s\S]*?\{% endschema %\}/g,'').replace(/\{% form([^%]*)%\}/g,(_,args)=>`<form data-preview-form${args.includes('localization')?' class="locale-form"':''}>`).replace(/\{% endform %\}/g,'</form>');
for(const base of [design,catalogRoot])for(const file of fs.readdirSync(path.join(base,'snippets'))){
 if(base!==design && !file.startsWith('catalog-planning-'))continue;
 fs.writeFileSync(path.join(partials,file),clean(fs.readFileSync(path.join(base,'snippets',file),'utf8')));
}
const engine=new Liquid({root:partials,partials,extname:'.liquid'});
function asset(file){
 const base=file.startsWith('musa-catalog')?catalogRoot:design;
 const mime=file.endsWith('.svg')?'image/svg+xml':file.endsWith('.woff2')?'font/woff2':file.endsWith('.png')?'image/png':'application/octet-stream';
 return `data:${mime};base64,${fs.readFileSync(path.join(base,'assets',file)).toString('base64')}`;
}
engine.registerFilter('asset_url',asset);
engine.registerFilter('stylesheet_tag',()=> '');
engine.registerFilter('default_errors',()=> '');
(async()=>{
 for(const language of ['es','en']){
  const dict=JSON.parse(fs.readFileSync(path.join(design,'locales',language==='en'?'en.default.json':'es.json'),'utf8'));
  engine.registerFilter('t',key=>key.split('.').reduce((a,k)=>a?.[k],dict)??key);
  const context={request:{locale:{iso_code:language}},shop:{name:'MUSA',policies:[]},routes:{root_url:`index-${language}.html`,all_products_collection_url:'#the-edit',cart_url:'#preview-note',search_url:'#the-edit'},cart:{item_count:0},settings:{},localization:{available_languages:[{iso_code:'en'},{iso_code:'es'}],language:{iso_code:language},available_countries:[]},form:{errors:[],posted_successfully:false}};
  async function render(type,id,settings={}){
   const base=type==='catalog-planning'?catalogRoot:design;
   const source=fs.readFileSync(path.join(base,'sections',type+'.liquid'),'utf8');
   const schema=JSON.parse(source.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/)[1]);
   const defaults=Object.fromEntries((schema.settings||[]).filter(x=>x.default!==undefined).map(x=>[x.id,x.default]));
   const scope={...context,section:{id,settings:{...defaults,...settings},blocks:[]}};
   return engine.parseAndRender(clean(source).replace(/<script[^>]+src=[\s\S]*?<\/script>/g,''),scope,{globals:scope});
  }
  let body=await render('header','header');
  body+='<main id="MainContent">';
  const index=JSON.parse(fs.readFileSync(path.join(design,'templates/index.json'),'utf8'));
  for(const id of index.order){const section=index.sections[id];body+=['featured-collection','catalog-planning'].includes(section.type)?await render('catalog-planning','real-catalog'):await render(section.type,id,section.settings);}
  body+='</main>'+await render('footer','footer');
  let css=fs.readFileSync(path.join(design,'assets/musa.css'),'utf8').replaceAll("url('grain.svg')",`url('${asset('grain.svg')}')`)+fs.readFileSync(path.join(catalogRoot,'assets/musa-catalog.css'),'utf8');
  const layout=fs.readFileSync(path.join(design,'layout/theme.liquid'),'utf8');
  const fonts=layout.match(/<style>\s*(@font-face[\s\S]*?)<\/style>/);
  if(fonts)css=await engine.parseAndRender(fonts[1],context)+css;
  const note=language==='es'?'Vista previa completa · Catálogo del pedido · Fotos y precios pendientes · Compras y formularios no conectados':'Full design preview · Order catalog · Photography and pricing pending · Shopping and forms disconnected';
  const previewScript=`document.querySelectorAll('[data-preview-form]').forEach(form=>{const submit=()=>{const language=form.querySelector('[name=locale_code]');if(language)location.href='index-'+language.value+'.html';else{const note=document.getElementById('preview-note');note.textContent=${JSON.stringify(note)};note.scrollIntoView();}};form.submit=submit;form.addEventListener('submit',e=>{e.preventDefault();submit();});});`;
  const themeJS=fs.readFileSync(path.join(design,'assets/musa.js'),'utf8');
  const silkJS=fs.readFileSync(path.join(design,'assets/musa-silk.js'),'utf8');
  const catalogJS=fs.readFileSync(path.join(catalogRoot,'assets/musa-catalog.js'),'utf8');
  const html=`<!doctype html><html lang="${language}" class="no-js"><head><script>document.documentElement.className="js";</script><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MUSA — welcome to your new era</title><style>${css}#preview-note{padding:10px 18px;text-align:center;font:12px/1.5 Arial,sans-serif;background:#e8e1d7;color:#3f2519}.musa-catalog{scroll-margin-top:20px}</style></head><body>${body}<aside id="preview-note">${note}</aside><script>${previewScript}</script><script>${themeJS}</script><script>${catalogJS}</script><script data-silk-script>${silkJS}</script></body></html>`;
  fs.writeFileSync(path.join(output,`index-${language}.html`),html.replace(/[ \t]+$/gm,''));
 }
 console.log('Complete bilingual homepage preview generated in '+output);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>fs.rmSync(partials,{recursive:true,force:true}));
