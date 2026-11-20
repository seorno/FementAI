import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScreeningRequest, validateScreeningResponse} from '../src/lib/feasibility-bridge.mjs';

const cleared={contamination:false,pressure:false};
const draft = {version:1,adultConfirmed:true,readyBy:'2027-01-20',carbonation:'light',
  ingredients:{appleJuice:true,yeast:true,berries:false},equipment:{vessel:true,airlock:true,sanitiser:true},
  sensory:{sweetness:90},notes:{berry:'love'},occasion:'dinner'};
test('maps inventory and carbonation, never transmits private taste or occasion',()=>{
 const request=buildScreeningRequest(draft,'cider',cleared);
 assert.deepEqual(request.ingredients,['apple juice','yeast']);
 assert.deepEqual(request.equipment,['fermentation vessel','airlock','sanitiser']);
 assert.equal(request.carbonation,'gentle');
 assert.equal(request.desired_date,'2027-01-20');
 assert.equal(request.beverage,'cider');
 assert.equal(JSON.stringify(request).includes('sweetness'),false);
 assert.equal(JSON.stringify(request).includes('dinner'),false);
});
test('missing deadline stays missing and is not fabricated',()=>{
 assert.equal(buildScreeningRequest({...draft,readyBy:''},'cider',cleared).desired_date,null);
});
test('adult and version gate cannot be bypassed',()=>{
 assert.throws(()=>buildScreeningRequest({...draft,adultConfirmed:false},'cider',cleared));
 assert.throws(()=>buildScreeningRequest({...draft,version:2},'cider',cleared));
 assert.throws(()=>buildScreeningRequest(draft,'spirits',cleared));
});
test('unknown inventory keys and falsy selections never leave browser',()=>{
 const request=buildScreeningRequest({...draft,ingredients:{unknown:true,appleJuice:false},equipment:{}},'cider',cleared);
 assert.deepEqual(request.ingredients,[]);
 assert.deepEqual(request.equipment,[]);
});
const response={status:'needs_information',data_provenance:'rule_based_screen',template_version:'screen-v1',
 reasons:['No source-reviewed template'],missing_information:['Desired serving date'],
 safety_warnings:['No safety certification'],supporting_sources:[],recipe:null,estimated_abv:null,safe_to_consume:null};
test('accepts explicit conservative server response',()=>assert.equal(validateScreeningResponse(response),response));
test('rejects unrecognised or falsely feasible server responses',()=>{
 assert.throws(()=>validateScreeningResponse({...response,status:'feasible'}));
 assert.throws(()=>validateScreeningResponse({...response,recipe:{steps:['bottle']}}));
 assert.throws(()=>validateScreeningResponse({...response,safe_to_consume:true}));
});

test('accepts explicitly attributed cider evidence without treating it as a recipe',()=>{
 const evidence={version:'cider-evidence-v1',scope:'Education only',checkpoints:['Sanitise equipment'],unresolved:['No validated recipe'],source_urls:['https://extension.psu.edu/example']};
 const validated=validateScreeningResponse({...response,cider_preparation_evidence:evidence});
 assert.equal(validated.cider_preparation_evidence.version,'cider-evidence-v1');
 assert.equal(validated.recipe,null);
});
test('rejects malformed cider evidence and insecure source links',()=>{
 const evidence={version:'cider-evidence-v1',scope:'Education only',checkpoints:['Clean'],unresolved:['Unknown'],source_urls:['http://example.com']};
 assert.throws(()=>validateScreeningResponse({...response,cider_preparation_evidence:evidence}));
 assert.throws(()=>validateScreeningResponse({...response,cider_preparation_evidence:{...evidence,source_urls:['https://example.com'],checkpoints:[42]}}));
});

test('does not silently assert absence of safety concerns',()=>{
 assert.throws(()=>buildScreeningRequest(draft,'cider'));
 assert.throws(()=>buildScreeningRequest(draft,'cider',{contamination:false}));
 assert.throws(()=>buildScreeningRequest(draft,'cider',{contamination:'no',pressure:false}));
});
test('passes reported contamination and pressure concerns to server without taste data',()=>{
 const request=buildScreeningRequest(draft,'cider',{contamination:true,pressure:true});
 assert.equal(request.contamination_concern,true);
 assert.equal(request.pressure_concern,true);
 assert.equal(request.wants_bottling_instructions,false);
 assert.equal(JSON.stringify(request).includes('sensory'),false);
});
