// Descriptive evidence inventory only. Never issues packaging or consumption clearance.
export const PACKAGING_AUDIT_VERSION = 1;
export const QUESTIONS = Object.freeze([
  {id:'protocol',label:'An independently reviewed, beverage-specific protocol is documented'},
  {id:'sanitation',label:'Cleaning and sanitation evidence is documented'},
  {id:'gravity',label:'Repeated calibrated gravity readings and dates are documented'},
  {id:'stability',label:'A qualified review of fermentation completion is documented'},
  {id:'vessel',label:'Packaging vessel suitability has been independently checked'},
  {id:'pressure',label:'A pressure-safe packaging method has been independently verified'},
  {id:'contamination',label:'Any contamination concern has been independently resolved'}
]);
const STATES = ['unknown','documented','missing','concern'];
export function normaliseAnswers(value) {
  const obj=value && typeof value==='object' && !Array.isArray(value)?value:{};
  return Object.fromEntries(QUESTIONS.map(q=>[q.id,STATES.includes(obj[q.id])?obj[q.id]:'unknown']));
}
export function reviewPackagingEvidence(batch, answers={}) {
  if (!batch || typeof batch!=='object' || !Array.isArray(batch.entries)) throw new Error('Select a valid journal batch');
  const answersClean=normaliseAnswers(answers);
  const measurements=batch.entries.filter(e=>e && typeof e.gravity==='number' && Number.isFinite(e.gravity) && e.gravity>=0.9 && e.gravity<=1.2 && /^\\d{4}-\\d{2}-\\d{2}$/.test(e.date));
  const days=new Set(measurements.map(e=>e.date)).size;
  const concerns=QUESTIONS.filter(q=>answersClean[q.id]==='concern').map(q=>q.id);
  const gaps=QUESTIONS.filter(q=>answersClean[q.id]!=='documented').map(q=>q.id);
  const warnings=[];
  if(batch.recipeStatus!=='verified') warnings.push('The journal does not contain an independently validated recipe.');
  if(days<2) warnings.push('Fewer than two distinct dates contain gravity measurements; this cannot establish stability.');
  if(batch.stage==='discarded') warnings.push('This batch is marked discarded.');
  if(batch.stage==='planned') warnings.push('This batch is only a planned concept.');
  if(concerns.length) warnings.push('One or more unresolved concerns were reported. Do not package or consume on the basis of this audit.');
  return {version:PACKAGING_AUDIT_VERSION,measurementCount:measurements.length,measurementDays:days,answers:answersClean,concerns,gaps,warnings,decision:'not_assessed',canPackage:false,safeToConsume:null};
}
