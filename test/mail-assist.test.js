import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,sourceUrls,readerProfile,dateInSource} from '../src/mail-assist.js';
import {validateBrief} from '../src/mail-briefs.js';

test('profile text is trimmed and capped',()=>{
  assert.equal(normalizeProfile('  Year 2 \r\n Data Science  '),'Year 2 \n Data Science');
  assert.equal(normalizeProfile('x'.repeat(900)).length,800);
  assert.equal(normalizeProfile(undefined),'');
});
test('reader profile is read from mail preferences',async()=>{
  const env={DB:{prepare(){return {bind(){return this},async first(){return {mail_preferences:JSON.stringify({profile:'Interested in ILP'})}}}}}};
  assert.equal(await readerProfile(env,'u1'),'Interested in ILP');
});
test('registration links come only from the source text',()=>{
  assert.deepEqual(sourceUrls('Register at https://lingnan.example/form. Thanks'),['https://lingnan.example/form']);
  assert.deepEqual(sourceUrls('No link here'),[]);
});
test('forYou is kept on a valid brief',()=>{
  const source='Workshop on 23 November. Register by 13 November at https://x.example/f';
  const base={title:'Workshop',titleEvidence:'Workshop on 23 November',points:[{text:'Workshop on 23 November',evidence:'Workshop on 23 November'}],actions:[]};
  assert.equal(validateBrief({...base,forYou:'Matches your interest in culture.'},source).forYou,'Matches your interest in culture.');
});
test('task dates must appear in the email',()=>{
  const src='The exhibition is on 18 November 2026 (Wednesday), 11:30 am to 5:00 pm.';
  assert.equal(dateInSource('2026-11-18T11:30:00+08:00',src),true);
  assert.equal(dateInSource('2026-11-19T11:30:00+08:00',src),false);
});
