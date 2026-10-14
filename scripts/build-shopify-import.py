"""Export owner-confirmed catalog as unpublished drafts; never infer retail prices."""
import csv,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
products=json.loads((root/'catalog/musa-products.json').read_text())['products']
fields=['Handle','Title','Body (HTML)','Vendor','Type','Tags','Published','Option1 Name','Option1 Value','Option2 Name','Option2 Value','Variant SKU','Variant Inventory Tracker','Variant Inventory Qty','Variant Inventory Policy','Variant Fulfillment Service','Variant Requires Shipping','Variant Taxable','Status']
rows=[];translations=[]
for p in products:
 handle='musa-'+p['id'].lower()
 body=f'<p>{p["title"]["en"]}. '+(f'Sold as a complete {p["pieces_per_sale_unit"]}-piece set.' if p['sell_as']=='complete_set' else 'Sold as one garment.')+'</p>'
 for ci,color in enumerate(p['colors'],1):
  for size in color['sizes']:
   rows.append(dict(zip(fields,[handle,p['title']['en'],body,'MUSA',{'sets-2':'2-piece set','sets-3':'3-piece set','bodysuits':'Bodysuit','leggings':'Leggings'}[p['category']],f'prelaunch, {p["id"]}, {p["category"]}','FALSE','Color',color['label']['en'],'Size',size,f'MUSA-{p["id"]}-C{ci:02}-{size}','shopify','0','deny','manual','TRUE','TRUE','draft'])))
 translations.append({'handle':handle,'title_es':p['title']['es'],'description_es':p['title']['es']+'. '+(f'Se vende como set completo de {p["pieces_per_sale_unit"]} piezas.' if p['sell_as']=='complete_set' else 'Se vende como prenda individual.'),'colors':[{'en':c['label']['en'],'es':c['label']['es']} for c in p['colors']]})
assert len(rows)==139 and len({r['Handle'] for r in rows})==15
assert len({r['Variant SKU'] for r in rows})==139
assert all(r['Published']=='FALSE' and r['Status']=='draft' and r['Variant Inventory Qty']=='0' and r['Variant Inventory Policy']=='deny' for r in rows)
with (root/'imports/MUSA-products-DRAFT.csv').open('w',newline='',encoding='utf-8-sig') as f:
 writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(rows)
(root/'imports/MUSA-translations-es.json').write_text(json.dumps(translations,ensure_ascii=False,indent=2)+'\n')
print('PASS export: 15 draft products, 139 unique variants; no price, cost, weight, photography or purchase-quantity fields.')
