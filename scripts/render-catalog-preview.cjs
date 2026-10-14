const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let Liquid;
try { ({Liquid} = require('liquidjs')); } catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  ({Liquid} = require(path.join(root,'..','.musa-tools','node_modules','liquidjs')));
}
const output=path.resolve(process.env.MUSA_CATALOG_OUTPUT_DIR || path.join(root,'..','musa-catalog-preview'));
fs.mkdirSync(output,{recursive:true});
const engine=new Liquid({root:path.join(root,'snippets'),partials:path.join(root,'snippets'),extname:'.liquid'});
engine.registerFilter('asset_url',x=>'data:'+(x.endsWith('.jpg')?'image/jpeg':'application/octet-stream')+';base64,'+fs.readFileSync(path.join(root,'assets',x)).toString('base64'));
engine.registerFilter('stylesheet_tag',()=> '');
const section=fs.readFileSync(path.join(root,'sections/catalog-planning.liquid'),'utf8').replace(/\{% schema %\}[\s\S]*?\{% endschema %\}/g,'').replace(/<script[^>]+src=[\s\S]*?<\/script>/g,'');
const css=fs.readFileSync(path.join(root,'assets/musa-catalog.css'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/musa-catalog.js'),'utf8');
const logo=fs.readFileSync(path.join(root,'assets/logo-espresso.svg')).toString('base64');
(async()=>{
 for(const lang of ['es','en']){
  const context={request:{locale:{iso_code:lang}},section:{id:'order-preview',settings:{}}};
  const content=await engine.parseAndRender(section,context,{globals:context});
  const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MUSA — ${lang==='es'?'Próxima colección':'Upcoming collection'}</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f3ee}img{display:block;max-width:100%}.preview-header{display:flex;justify-content:space-between;align-items:center;padding:24px 5vw;border-bottom:1px solid #3f251922}.preview-header a{color:#3f2519;font:14px Arial,sans-serif}.preview-header nav{display:flex;gap:18px}.preview-skip{position:absolute;left:-10000px}.preview-skip:focus{left:20px;top:10px;padding:10px;background:white}${css}</style></head><body><a class="preview-skip" href="#catalog-main">${lang==='es'?'Ir al catálogo':'Skip to catalog'}</a><header class="preview-header"><img src="data:image/svg+xml;base64,${logo}" width="130" height="31" alt="MUSA"><nav aria-label="${lang==='es'?'Idioma':'Language'}"><a href="index-es.html" lang="es" ${lang==='es'?'aria-current="page"':''}>ES</a><a href="index-en.html" lang="en" ${lang==='en'?'aria-current="page"':''}>EN</a></nav></header><main id="catalog-main">${content}</main><script>${js}</script></body></html>`;
  fs.writeFileSync(path.join(output,`index-${lang}.html`),html);
 }
 console.log('Catalog previews written to '+output);
})().catch(error=>{console.error(error);process.exitCode=1;});
