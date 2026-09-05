const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('./android/assets/engine.js'),N=require('./android/assets/names.js');
const storage=new Map([['mayusha.v1',JSON.stringify({wallet:{correct:27,bonus:2,spent:5,events:[]},stars:35,level:'hard'})]]);
function launch(){
 class Element{constructor(){this.innerHTML='';this.textContent='';this.value='';}focus(){}append(){}remove(){}querySelector(){return new Element();}}
 const nodes=new Map(),handlers={};
 const context={MayuEngine:E,MayuNames:N,console,Math,performance:{now:()=>0},setInterval(){},setTimeout(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:s=>{if(s==='.overlay')return null;if(!nodes.has(s))nodes.set(s,new Element());return nodes.get(s);},querySelectorAll:()=>[],createElement:()=>new Element(),body:new Element(),addEventListener:(key,fn)=>handlers[key]=fn},scrollTo(){}};
 context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/android/assets/app.js','utf8'),context);
 return {context,nodes,run:code=>vm.runInContext(code,context)};
}
let a=launch();
assert.equal(a.run('dialog'),'profile');assert.equal(a.run('screen'),'welcome');assert.equal(a.run('back()'),false);
assert.equal(a.run('balance()'),7);assert.equal(a.run('saved.stars'),35);
a.run('saveProfile()');assert.equal(a.run('saved.profile'),null);
function enter(app,name){app.nodes.get('#profile-name').value=name;app.run('updateProfilePreview(true)');}
enter(a,'Майюша');a.run('saveProfile()');assert.equal(a.run('screen'),'home');assert.equal(a.run("person('genitive')"),'Майюши');
assert.equal(a.run('balance()'),7);assert.equal(a.run('saved.wallet.progress.easy'),7);assert.equal(a.run('saved.level'),'hard');
a=launch();assert.equal(a.run('dialog'),null);assert.equal(a.run('person()'),'Майюша');assert.equal(a.run('balance()'),7);
a.run('openProfile()');enter(a,'Миша');a.nodes.get('#profile-genitive').value='Мишеньки';a.run('saveProfile()');
assert.equal(a.run("person('genitive')"),'Мишеньки');assert.equal(a.run('balance()'),7);assert.equal(a.run('saved.stars'),35);
const frozen=a.run("requestMessage({app:'Roblox',minutes:5,at:1234,profileName:person()})");
a.run('openProfile()');enter(a,'Саша');const setItem=a.context.localStorage.setItem;a.context.localStorage.setItem=()=>{throw Error('full')};a.run('saveProfile()');
assert.equal(a.run('person()'),'Миша');assert.equal(a.run('dialog'),'profile');assert.equal(a.run('balance()'),7);
a.context.localStorage.setItem=setItem;a.run('saveProfile()');assert.equal(a.run('person()'),'Саша');
assert.equal(a.run("requestMessage({app:'Roblox',minutes:5,at:1234,profileName:'Миша'})"),frozen);
a=launch();assert.equal(a.run('person()'),'Саша');assert.equal(a.run('balance()'),7);
console.log('Profile integration passed: required first launch, validation, declension, edit, manual forms, reload, existing minutes/stars/settings, failed-save rollback, and original sender on repeated requests.');
