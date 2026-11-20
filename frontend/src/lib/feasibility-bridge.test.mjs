import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScreeningRequest, validateScreeningResponse} from './feasibility-bridge.mjs';

const draft = {version:1,adultConfirmed:true,readyBy:'2027-01-20',carbonation:'light',
  ingredients:{appleJuice:true,yeast:true,berries:false},equipment:{vessel:true,airlock:true,sanitiser:true},
  sensory:{sweetness:90},notes:{berry:'love'},occasion:'dinner'};
test('maps inventory and carbonation, never transmits private taste or occasion',()=>{
 const request=buildScreeningRequest(draft);
 assert.deepEqual(request.ingredients,['apple juice','yeast']);
 assert.deepEqual(request.equipment,['fermentation vessel','airlock','sanitiser']);
 assert.equal(request.carbonation,'gentle');
 assert.equal(request.desired_date,'2027-01-20');
 assert.equal(request.beverage,'cider');
 assert.equal(JSON.stringify(request).includes('sweetness'),false);
 assert.equal(JSON.stringify(request).includes('dinner'),false);
});
test('missing deadline stays missing and is not fabricated',()=>{
 assert.equal(buildScreeningRequest({...draft,readyBy:''}).desired_date,null);
});
test('adult and version gate cannot be bypassed',()=>{
 assert.throws(()=>buildScreeningRequest({...draft,adultConfirmed:false}));
 assert.throws(()=>buildScreeningRequest({...draft,version:2}));
 assert.throws(()=>buildScreeningRequest(draft,'spirits'));
});
test('unknown inventory keys and falsy selections never leave browser',()=>{
 const request=buildScreeningRequest({...draft,ingredients:{unknown:true,appleJuice:false},equipment:{}});
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
