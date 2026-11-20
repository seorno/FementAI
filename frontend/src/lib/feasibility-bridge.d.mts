import type { TasteDraft } from './taste-draft.mjs';
export type BeverageFamily = 'cider' | 'mead' | 'fruit_wine';
export interface ScreeningRequest {
 locale:'GB'; adult_confirmed:true; beverage:BeverageFamily; desired_date:string|null;
 ingredients:string[]; equipment:string[]; carbonation:'still'|'gentle'|'sparkling';
 wants_bottling_instructions:false; contamination_concern:false; pressure_concern:false;
}
export interface ScreeningResponse {
 status:'unsupported'|'needs_information'; data_provenance:'rule_based_screen'; template_version:string;
 reasons:string[]; missing_information:string[]; safety_warnings:string[]; supporting_sources:string[];
 recipe:null; estimated_abv:null; safe_to_consume:null;
}
export function buildScreeningRequest(draft:TasteDraft,beverage?:BeverageFamily):ScreeningRequest;
export function validateScreeningResponse(value:unknown):ScreeningResponse;
