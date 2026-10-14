const fs = require('fs');
const path = require('path');
const os = require('os');
const theme = path.resolve(__dirname, '..');
let Liquid;
try { ({Liquid} = require('liquidjs')); } catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  ({Liquid} = require(path.join(theme, '..', '.musa-tools', 'node_modules', 'liquidjs')));
}
const out = path.resolve(process.env.MUSA_OUTPUT_DIR || path.join(theme, '..', 'musa-deliverables'));
const input = fs.mkdtempSync(path.join(os.tmpdir(), 'musa-preview-'));
fs.mkdirSync(out,{recursive:true}); fs.mkdirSync(input,{recursive:true});
function source(file){return fs.readFileSync(path.join(theme,file),'utf8').replace(/\{% schema %\}[\s\S]*?\{% endschema %\}/g,'').replace(/\{% form[^%]*%\}/g,'<form data-preview-form>').replace(/\{% endform %\}/g,'</form>');}
for(const file of fs.readdirSync(path.join(theme,'snippets'))){fs.writeFileSync(path.join(input,file),source('snippets/'+file));}
const engine=new Liquid({root:input,partials:input,extname:'.liquid'});
engine.registerFilter('asset_url',file=>path.join(theme,'assets',file));
engine.registerFilter('default_errors',()=> '');
(async()=>{
for(const language of ['en','es']){
 const dictionary=JSON.parse(fs.readFileSync(path.join(theme,'locales',language==='en'?'en.default.json':'es.json'),'utf8'));
 engine.registerFilter('t',key=>key.split('.').reduce((x,k)=>x?.[k],dictionary)??key);
 const context={shop:{name:'MUSA',policies:[],privacy_policy:null},routes:{root_url:'index-'+language+'.html',all_products_collection_url:'#the-edit',cart_url:'#preview-note',search_url:'#preview-note'},cart:{item_count:0},localization:{available_languages:[{iso_code:'en'},{iso_code:'es'}],language:{iso_code:language},available_countries:[]},form:{errors:[],posted_successfully:false},section:{id:'preview',settings:{show_demo:true,collection:{products:[]},limit:4}}};
 let body='';
 for(const name of ['header','hero','manifesto','featured-collection','editorial','newsletter','footer'])body+=await engine.parseAndRender(source('sections/'+name+'.liquid'),context,{globals:context});
 const css=fs.readFileSync(path.join(theme,'assets/musa.css'),'utf8').replaceAll("url('grain.svg')",`url('data:image/svg+xml;base64,${fs.readFileSync(path.join(theme,'assets/grain.svg')).toString('base64')}')`);
 const script=fs.readFileSync(path.join(theme,'assets/musa.js'),'utf8');
 body=body.replace(/src="([^\"]+)"/g,(match,file)=>file.startsWith(path.join(theme, 'assets') + path.sep) ? `src="data:${file.endsWith('.svg')?'image/svg+xml':'image/png'};base64,${fs.readFileSync(file).toString('base64')}"` : match);
 const note=language==='en'?'DESIGN PREVIEW · Concept garments. Shopping and email submission are not connected.':'VISTA DE DISEÑO · Prendas de muestra. Las compras y el envío de correos no están conectados.';
 const html=`<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MUSA — welcome to your new era</title><style>${css}</style></head><body style="--menu-top:146px"><aside id="preview-note" style="padding:10px 22px;background:#e8e1d7;text-align:center;font-size:10px;position:relative;z-index:31">${note}</aside>${body}<script>${script}</script><script>document.querySelectorAll('[data-preview-form]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const language=form.querySelector('[name=locale_code]');if(language) location.href='index-'+language.value+'.html';else {const note=document.getElementById('preview-note');note.textContent=${JSON.stringify(note)};note.scrollIntoView();}}));</script></body></html>`;
 fs.writeFileSync(path.join(out,'index-'+language+'.html'),html.replace(/[ \t]+$/gm, ''));
}
const variants=[{id:101,options:['Espresso','S'],title:'Espresso / S',price:8900,compare_at_price:11000,available:true,quantity_rule:{min:1,increment:1,max:8}},{id:102,options:['Espresso','M'],title:'Espresso / M',price:9500,compare_at_price:null,available:false,quantity_rule:{min:2,increment:2,max:6}},{id:103,options:['Arena','L'],title:'Arena / L',price:9900,compare_at_price:null,available:true,quantity_rule:{min:3,increment:3,max:null}}];
engine.registerFilter('money',value=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(value)/100));
engine.registerFilter('placeholder_svg_tag',()=>'<div class="placeholder-svg"></div>');
engine.registerFilter('structured_data',()=> '{}');
const fixture={product:{title:'QA product',vendor:'MUSA',type:'Legging',options_with_values:[{name:'Color',selected_value:'Espresso',values:[{name:'Espresso',selected:true},{name:'Arena',selected:false}]},{name:'Size',selected_value:'S',values:[{name:'S',selected:true},{name:'M',selected:false},{name:'L',selected:false}]}],variants,selected_or_first_available_variant:variants[0],media:[],metafields:{custom:{}}},section:{id:'qa',settings:{},blocks:[]}};
const productBody=await engine.parseAndRender(source('sections/main-product.liquid'),fixture,{globals:fixture});
fs.mkdirSync(path.join(out,'qa'),{recursive:true});
fs.writeFileSync(path.join(out,'qa/product.html'),`<!doctype html><html><head><meta charset="utf-8"></head><body>${productBody}<script>${fs.readFileSync(path.join(theme,'assets/musa.js'),'utf8')}</script></body></html>`);
console.log('Both previews and variant QA fixture rendered from actual theme sections.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>fs.rmSync(input,{recursive:true,force:true}));
