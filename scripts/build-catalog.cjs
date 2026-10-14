// Generate the optional prelaunch section from cost-free, owner-confirmed product data.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog/musa-products.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bilingual = labels => `{% if request.locale.iso_code == 'es' %}${escape(labels.es)}{% else %}${escape(labels.en)}{% endif %}`;
const copy = {
  title:{es:'Tu próxima era, en movimiento.',en:'Your next era, in motion.'},
  intro:{es:'Descubre los modelos de nuestra próxima colección. Los sets se venden completos. Fotografías y precios de venta próximamente.',en:'Explore the styles in our upcoming collection. Sets are sold complete. Photography and retail pricing coming soon.'},
  all:{es:'Todos',en:'All styles'},'sets-2':{es:'Sets de 2 piezas',en:'2-piece sets'},'sets-3':{es:'Sets de 3 piezas',en:'3-piece sets'},bodysuits:{es:'Enterizos',en:'Bodysuits'},leggings:{es:'Leggings',en:'Leggings'},
  color:{es:'Color',en:'Colour'},sizes:{es:'Tallas previstas',en:'Planned sizes'},photo:{es:'Fotografía próximamente',en:'Photography coming soon'},coming:{es:'Próximamente',en:'Coming soon'},
  options:{es:'Ver colores y tallas',en:'View colours and sizes'},reference:{es:'Referencia',en:'Reference'},
  note:{es:'Los nombres de color son descriptivos y se confirmarán con las fotografías finales. Las tallas corresponden al pedido; no indican disponibilidad actual.',en:'Colour names are descriptive and will be confirmed with final photography. Sizes reflect the order, not current availability.'}
};
const cards=catalog.products.map((p,index)=>{
 const imageSetting=`image_${String(index+1).padStart(2,'0')}`;
 const options=p.colors.map((c,i)=>`<option value="${i}" data-sizes="${escape(c.sizes.join(' · '))}">${bilingual(c.label)}</option>`).join('');
 const matrix=p.colors.map(c=>`<li><span>${bilingual(c.label)}</span><span>${escape(c.sizes.join(' · '))}</span></li>`).join('');
 const card = `<article class="musa-catalog-card" data-catalog-card data-category="${p.category}" data-reference="${p.id}">
<div class="musa-catalog-art{% if section.settings.${imageSetting} %} musa-catalog-art--photo{% endif %}">{% if section.settings.${imageSetting} %}{% capture catalog_image_alt %}${bilingual(p.title)}{% endcapture %}{{ section.settings.${imageSetting} | image_url: width: 1200 | image_tag: loading: 'lazy', widths: '400,600,900,1200', sizes: '(min-width: 901px) 33vw, (min-width: 551px) 50vw, 100vw', alt: catalog_image_alt }}{% else %}<span class="musa-catalog-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><span class="musa-catalog-type">${bilingual(copy[p.category])}</span><span class="musa-catalog-photo">${bilingual(copy.photo)}</span>{% endif %}</div>
<div class="musa-catalog-card-body"><p class="musa-catalog-ref">${bilingual(copy.reference)} ${p.id}</p><h3>${bilingual(p.title)}</h3><p class="musa-catalog-unit">${bilingual(copy[p.category])} / ${bilingual(copy.coming)}</p>
<div data-catalog-color-control hidden><label for="CatalogColor-{{ section.id }}-${p.id}">${bilingual(copy.color)}</label><select id="CatalogColor-{{ section.id }}-${p.id}" data-catalog-color>${options}</select><p class="musa-catalog-sizes">${bilingual(copy.sizes)}: <span data-catalog-sizes aria-live="polite">${escape(p.colors[0].sizes.join(' · '))}</span></p></div>
<details data-catalog-matrix><summary>${bilingual(copy.options)}</summary><ul>${matrix}</ul></details></div></article>`;
 fs.writeFileSync(path.join(root, 'snippets', `catalog-planning-${p.id.toLowerCase()}.liquid`), card+'\n');
 return `{% render 'catalog-planning-${p.id.toLowerCase()}', section: section %}`;
}).join('\n');
const section=`{{ 'musa-catalog.css' | asset_url | stylesheet_tag }}
<script src="{{ 'musa-catalog.js' | asset_url }}" defer></script>
<section id="the-edit" class="musa-catalog" data-musa-catalog aria-labelledby="CatalogTitle-{{ section.id }}">
<header class="musa-catalog-intro"><p class="musa-catalog-eyebrow">MUSA — WELCOME TO YOUR NEW ERA</p><h2 id="CatalogTitle-{{ section.id }}">${bilingual(copy.title)}</h2><p>${bilingual(copy.intro)}</p></header>
<div class="musa-catalog-filters" data-catalog-filters hidden role="group" aria-label="{% if request.locale.iso_code == 'es' %}Tipo de producto{% else %}Product type{% endif %}">${['all','sets-2','sets-3','bodysuits','leggings'].map(cat=>`<button type="button" data-catalog-filter="${cat}" aria-pressed="${cat==='all'}">${bilingual(copy[cat])}</button>`).join('')}</div>
<p class="musa-catalog-count" role="status" data-catalog-count data-label="{% if request.locale.iso_code == 'es' %}modelos{% else %}styles{% endif %}">${catalog.products.length} {% if request.locale.iso_code == 'es' %}modelos{% else %}styles{% endif %}</p>
<div class="musa-catalog-grid">${cards}</div><p class="musa-catalog-note">${bilingual(copy.note)}</p>
</section>
{% schema %}
${JSON.stringify({name:'MUSA Upcoming collection',settings:catalog.products.map((p,i)=>({type:'image_picker',id:`image_${String(i+1).padStart(2,'0')}`,label:`Photo — ${p.id}`})),presets:[{name:'MUSA Upcoming collection'}]})}
{% endschema %}
`;
fs.writeFileSync(path.join(root,'sections/catalog-planning.liquid'),section);
console.log(`Generated catalog-planning.liquid: ${catalog.products.length} sale references.`);
