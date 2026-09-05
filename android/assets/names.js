(function(root){
'use strict';
const p=typeof module!=='undefined'&&module.exports?require('./petrovich.js'):root.petrovich;
const valid=value=>typeof value==='string'&&value.length<=60&&/^[\p{L}\p{M}]+(?:[ ’'\-][\p{L}\p{M}]+)*$/u.test(value);
const clean=value=>typeof value==='string'?value.normalize('NFC').trim().replace(/\s+/g,' '):'';
const femaleConsonants=new Set(['любовь','нинель','руфь','рахиль','эсфирь','ассоль','николь','адель','гузель','айгуль','анель','жанель','шанталь','мириам','ирэн','кармен']);
function forms(raw,mode='auto'){
 const name=clean(raw);if(!valid(name)||name.length>40)return null;
 const apply=grammaticalCase=>name.split(/([ -])/).map(part=>{
  if(!/[А-Яа-яЁё]/.test(part)||mode==='none')return part;
  const low=part.toLowerCase();
  // Names ending in -а/-я use the same first-declension rules for both genders.
  const gender=/[ая]$/.test(low)?'female':mode==='male'?'male':mode==='female'?'female':femaleConsonants.has(low)?'female':'male';
  // The rule set leaves several indeclinable feminine names unchanged.
  if(gender==='female'&&['николь','мириам','ирэн','кармен','шанталь'].includes(low))return part;
  try{return p[gender].first[grammaticalCase](part);}catch(error){return part;}
 }).join('');
 return {name,genitive:apply('genitive'),dative:apply('dative'),mode:['auto','male','female','none'].includes(mode)?mode:'auto'};
}
function normalize(raw){if(!raw||typeof raw!=='object')return null;const value=forms(raw.name,raw.mode);if(!value)return null;for(const key of ['genitive','dative']){const text=clean(raw[key]);if(valid(text))value[key]=text;}return value;}
function escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const api={forms,normalize,valid,clean,escape};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.MayuNames=api;
})(typeof globalThis!=='undefined'?globalThis:this);
