/** Explicit, versioned adapter between private Taste Atlas draft and public screening API.
 * Only sends inventory, deadline, age acknowledgement and carbonation; taste stays local.
 * The backend alone determines feasibility. This module makes no brewing claims.
 */
const ingredientNames = Object.freeze({
  appleJuice: 'apple juice', wholeApples: 'whole apples', berries: 'berries',
  honey: 'honey', sugar: 'sugar', yeast: 'yeast',
});
const equipmentNames = Object.freeze({
  vessel: 'fermentation vessel', airlock: 'airlock', sanitiser: 'sanitiser',
  hydrometer: 'hydrometer', thermometer: 'thermometer', bottles: 'bottles',
});
const carbonationNames = Object.freeze({still:'still',light:'gentle',sparkling:'sparkling'});
export function buildScreeningRequest(draft, beverage='cider', concerns) {
  if (!draft || draft.version !== 1 || draft.adultConfirmed !== true) {
    throw new Error('An adult-confirmed version 1 draft is required.');
  }
  if (!['cider','mead','fruit_wine'].includes(beverage)) {
    throw new Error('Unsupported beverage family.');
  }
  if (!concerns || typeof concerns.contamination !== 'boolean' || typeof concerns.pressure !== 'boolean') {
    throw new Error('Both safety concern questions require explicit yes/no answers.');
  }
  return {
    locale:'GB', adult_confirmed:true, beverage,
    desired_date: draft.readyBy || null,
    ingredients:Object.entries(ingredientNames).filter(([id])=>draft.ingredients?.[id]===true).map(([,name])=>name),
    equipment:Object.entries(equipmentNames).filter(([id])=>draft.equipment?.[id]===true).map(([,name])=>name),
    carbonation:carbonationNames[draft.carbonation] || 'still',
    wants_bottling_instructions:false,
    contamination_concern:concerns.contamination, pressure_concern:concerns.pressure,
  };
}
export function validateScreeningResponse(value) {
  if (!value || !['unsupported','needs_information'].includes(value.status) ||
      value.data_provenance !== 'rule_based_screen' ||
      !Array.isArray(value.reasons) || !Array.isArray(value.missing_information) ||
      !Array.isArray(value.safety_warnings) || !Array.isArray(value.supporting_sources) ||
      value.recipe !== null || value.estimated_abv !== null || value.safe_to_consume !== null) {
    throw new Error('Unexpected screening response. No recommendation can be displayed.');
  }
  const evidence=value.cider_preparation_evidence;
  if (evidence !== null && evidence !== undefined && (
      typeof evidence !== 'object' || evidence.version !== 'cider-evidence-v1' ||
      !Array.isArray(evidence.checkpoints) || !Array.isArray(evidence.unresolved) ||
      !Array.isArray(evidence.source_urls) ||
      [...evidence.checkpoints,...evidence.unresolved,...evidence.source_urls].some(item=>typeof item !== 'string') ||
      evidence.source_urls.some(url=>!url.startsWith('https://')))) {
    throw new Error('Unexpected cider evidence. No recommendation can be displayed.');
  }
  return value;
}
