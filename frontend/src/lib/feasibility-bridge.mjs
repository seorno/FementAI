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
export function buildScreeningRequest(draft, beverage='cider') {
  if (!draft || draft.version !== 1 || draft.adultConfirmed !== true) {
    throw new Error('An adult-confirmed version 1 draft is required.');
  }
  if (!['cider','mead','fruit_wine'].includes(beverage)) {
    throw new Error('Unsupported beverage family.');
  }
  return {
    locale:'GB', adult_confirmed:true, beverage,
    desired_date: draft.readyBy || null,
    ingredients:Object.entries(ingredientNames).filter(([id])=>draft.ingredients?.[id]===true).map(([,name])=>name),
    equipment:Object.entries(equipmentNames).filter(([id])=>draft.equipment?.[id]===true).map(([,name])=>name),
    carbonation:carbonationNames[draft.carbonation] || 'still',
    wants_bottling_instructions:false,
    contamination_concern:false, pressure_concern:false,
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
  return value;
}
