export const DRAFT_STORAGE_KEY='ferment-ai:design:v1';
export const SENSORY_AXES=[
{id:'sweetness',label:'Sweetness',low:'Dry',high:'Sweet'},
{id:'acidity',label:'Acidity',low:'Soft',high:'Tart'},
{id:'bitterness',label:'Bitterness',low:'Smooth',high:'Bitter'},
{id:'tannin',label:'Tannin',low:'Gentle',high:'Grippy'},
{id:'body',label:'Body',low:'Light',high:'Rich'},
{id:'fruitIntensity',label:'Fruit',low:'Subtle',high:'Expressive'},
{id:'floral',label:'Floral',low:'Quiet',high:'Fragrant'},
{id:'spice',label:'Spice',low:'Soft',high:'Spiced'},
{id:'aromaIntensity',label:'Aroma',low:'Delicate',high:'Bold'}];
export const FLAVOUR_NOTES=[
{id:'orchard',label:'Orchard',description:'Apple and pear'},
{id:'berry',label:'Berry',description:'Summer fruits'},
{id:'citrus',label:'Citrus',description:'Bright and zesty'},
{id:'tropical',label:'Tropical',description:'Sun-ripened fruit'},
{id:'floral',label:'Floral',description:'Blossom and petals'},
{id:'spice',label:'Spice',description:'Warm, aromatic notes'},
{id:'herbal',label:'Herbal',description:'Fresh green notes'},
{id:'earthy',label:'Earthy',description:'Woodland and mineral'}];
export const OCCASIONS=[
{id:'quiet-evening',label:'A quiet evening',description:'Something for slowing down'},
{id:'dinner',label:'Dinner',description:'An accompaniment to food'},
{id:'gathering',label:'A gathering',description:'Something to share'},
{id:'gift',label:'A thoughtful gift',description:'Something personal'}];
export const SERVING=[{id:'chilled',label:'Chilled'},{id:'over-ice',label:'Over ice'},{id:'warm',label:'Warm'}];
export const CARBONATION=[{id:'still',label:'Still'},{id:'light',label:'Lightly sparkling'},{id:'sparkling',label:'Sparkling'}];
export const INGREDIENTS=[{id:'appleJuice',label:'Apple juice'},{id:'wholeApples',label:'Whole apples'},{id:'berries',label:'Berries'},{id:'honey',label:'Honey'},{id:'sugar',label:'Sugar'},{id:'yeast',label:'Brewing yeast'}];
export const EQUIPMENT=[{id:'vessel',label:'Food-safe fermenter'},{id:'airlock',label:'Airlock'},{id:'sanitiser',label:'Brewing sanitiser'},{id:'hydrometer',label:'Hydrometer'},{id:'thermometer',label:'Thermometer'},{id:'bottles',label:'Suitable bottles'}];
export function createDefaultDraft(){return {version:1,adultConfirmed:false,occasion:'quiet-evening',serving:'chilled',carbonation:'still',
sensory:Object.fromEntries(SENSORY_AXES.map(a=>[a.id,50])),
notes:Object.fromEntries(FLAVOUR_NOTES.map(n=>[n.id,'neutral'])),
ingredients:Object.fromEntries(INGREDIENTS.map(i=>[i.id,false])),
equipment:Object.fromEntries(EQUIPMENT.map(i=>[i.id,false])),
readyBy:'',volumeLitres:3,budgetGBP:20};}
function record(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)?v:{};}
function oneOf(v,choices,fallback){return typeof v==='string'&&choices.some(c=>c.id===v)?v:fallback;}
function inRange(v,fallback,lo,hi){return typeof v==='number'&&Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):fallback;}
function validDate(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().startsWith(v);}
export function sanitiseDraft(raw){
const o=record(raw),d=createDefaultDraft();if(o.version!==1)return d;
const s=record(o.sensory),n=record(o.notes),i=record(o.ingredients),e=record(o.equipment);
d.adultConfirmed=o.adultConfirmed===true;
d.occasion=oneOf(o.occasion,OCCASIONS,d.occasion);
d.serving=oneOf(o.serving,SERVING,d.serving);
d.carbonation=oneOf(o.carbonation,CARBONATION,d.carbonation);
for(const a of SENSORY_AXES)d.sensory[a.id]=inRange(s[a.id],50,0,100);
for(const a of FLAVOUR_NOTES)d.notes[a.id]=['neutral','love','avoid'].includes(n[a.id])?n[a.id]:'neutral';
for(const a of INGREDIENTS)d.ingredients[a.id]=i[a.id]===true;
for(const a of EQUIPMENT)d.equipment[a.id]=e[a.id]===true;
d.readyBy=validDate(o.readyBy)?o.readyBy:'';
d.volumeLitres=inRange(o.volumeLitres,3,0.25,25);
d.budgetGBP=inRange(o.budgetGBP,20,0,500);
return d;}
export function cyclePreference(value){return value==='neutral'?'love':value==='love'?'avoid':'neutral';}
export function summariseDraft(d){
const loves=FLAVOUR_NOTES.filter(n=>d.notes[n.id]==='love').map(n=>n.label.toLowerCase());
const avoids=FLAVOUR_NOTES.filter(n=>d.notes[n.id]==='avoid').map(n=>n.label.toLowerCase());
const quality=d.sensory.acidity>=70?'tart':d.sensory.sweetness>=70?'sweet':d.sensory.body>=70?'full-bodied':'balanced';
const aroma=loves.length?loves.join(', ')+' notes':'an open flavour palette';
return {kind:'preference_only',title:'Your '+quality+' drink idea',
description:'A '+quality+' direction with '+aroma+', served '+(d.serving==='over-ice'?'over ice':d.serving)+'.',avoided:avoids,
disclaimer:'Preference summary only — not a recipe, validated sensory prediction, ABV estimate, or safety assessment.'};
}
