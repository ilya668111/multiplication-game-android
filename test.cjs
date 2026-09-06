// Проверки примеров, игровых режимов, копилки и повторной отправки просьб.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('./android/assets/engine.js');const N=require('./android/assets/names.js');
let count=0,seen=new Set();
for(const level of Object.keys(E.levels))for(const operation of ['multiply','divide','mixed'])for(const format of ['normal','gaps','mixed'])for(let i=0;i<1000;i++){
 const q=E.question(level,'',Math.random,{operation,format});
 assert.equal(q.op==='÷'?q.left/q.right:q.left*q.right,q.result);
 assert(q.a<=10&&q.b<=10);assert(E.levels[level].factors.includes(q.a));assert(q.b>=E.levels[level].secondMin&&q.b<=E.levels[level].other);assert(q.choices.every(n=>n<=100));
 const supplied=q.unknown==='left'?{left:q.answer,right:q.right,result:q.result}:q.unknown==='right'?{left:q.left,right:q.answer,result:q.result}:{left:q.left,right:q.right,result:q.answer};
 assert.equal(q.op==='÷'?supplied.left/supplied.right:supplied.left*supplied.right,supplied.result);
 assert(q.answer>0&&q.answer<=100&&Number.isInteger(q.answer));assert.equal(new Set(q.choices).size,4);assert(q.choices.includes(q.answer));assert(q.choices.every(n=>Number.isInteger(n)&&n>0));
 if(operation!=='mixed')assert.equal(q.op,operation==='multiply'?'×':'÷');if(format==='normal')assert.equal(q.unknown,'none');if(format==='gaps')assert.notEqual(q.unknown,'none');
 seen.add(q.op+':'+q.unknown);count++;
}
assert.equal(seen.size,6);assert.equal(E.makeQuestion(6,5,'multiply','left').answer,6);assert.equal(E.makeQuestion(5,6,'divide','right').answer,5);
console.log(count+' questions verified across operations, levels and formats; all six equation types covered.');
class Element{constructor(){this.innerHTML='';this.textContent='';this.style={};this.disabled=false;this.parentElement=this;this.classList={toggle(){},add(){}};}setAttribute(){}focus(){}remove(){}append(){}querySelector(){return new Element();}}
const elements=new Map();const handlers={};let now=0;const storage=new Map();
const ctx={MayuEngine:E,MayuNames:N,console,Math,performance:{now:()=>now},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:s=>{if(s==='.overlay')return null;if(!elements.has(s))elements.set(s,new Element());return elements.get(s);},querySelectorAll:()=>[],addEventListener:(name,fn)=>handlers[name]=fn,createElement:()=>new Element(),body:new Element(),hidden:false},setInterval(){},setTimeout(){},matchMedia:()=>({matches:true})};ctx.window=ctx;ctx.scrollTo=()=>{};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/android/assets/app.js','utf8'),ctx);const run=s=>vm.runInContext(s,ctx);
const shareCalls=[];ctx.MayushaAndroid={shareText:text=>shareCalls.push(text)};
run("saved.sound=false;saved.profile=N.normalize({name:'Саша'});dialog=null;home()");
for(const level of ['easy','medium','hard'])for(const response of ['choice','input'])for(const operation of ['multiply','divide','mixed'])for(const format of ['normal','gaps','mixed']){
 run(`Object.assign(saved,${JSON.stringify({level,response,operation,format,mode:'calm'})});start()`);
 assert(elements.get('#app').innerHTML.includes(response==='input'?'class="keypad"':'class="answers"'));
 for(let n=0;n<10;n++){
  if(response==='input')run("for(const digit of String(game.q.answer))key(digit);key('submit')");else run('answer(game.q.answer)');
  assert.equal(run('game.total'),n+1);run('answer(game.q.answer)');assert.equal(run('game.total'),n+1);run('next()');
 }
 assert.equal(run('screen'),'result');assert.equal(run('game.correct'),10);
}
console.log('54 rounds passed: every setting combination, both input methods, duplicate-answer prevention.');
run("Object.assign(saved,{level:'easy',response:'input',operation:'divide',format:'gaps',mode:'calm'});start();key('1');key('2');key('erase')");assert.equal(run('game.input'),'1');run("key('erase');key('submit')");assert.equal(run('game.total'),0);
run("answer(game.q.answer+1);next();for(let i=1;i<10;i++){answer(game.q.answer);next();}");assert.equal(run('game.correct'),9);assert.equal(run('game.toReview.length'),1);run('start(game.toReview)');assert.equal(run('game.target'),1);run('answer(game.q.answer);next()');assert.equal(run('screen'),'result');assert.equal(run('game.correct'),1);
run("Object.assign(saved,{mode:'timed',seconds:60});start()");now+=2000;run('tick()');assert.equal(run('game.remaining'),58000);run("showDialog('pause')");now+=10000;run('tick()');assert.equal(run('game.remaining'),58000);run('resume()');now+=3000;run('tick()');assert.equal(run('game.remaining'),55000);now+=56000;run('tick()');assert.equal(run('screen'),'result');assert.equal(run('game.total'),0);
run('home();persist()');const saved=JSON.parse(storage.get('mayusha.v1'));assert.equal(saved.response,'input');assert.equal(saved.operation,'divide');assert.equal(saved.format,'gaps');
console.log('Error review, erasing/empty input, timer, pause, expiry, and persistence passed. UI layout needs browser/device verification.');
run("saved.wallet=E.migrateWallet({correct:0,bonus:0,spent:0,events:[]});Object.assign(saved,{mode:'calm',operation:'multiply',format:'normal',response:'choice'});start()");
for(let i=0;i<9;i++)run('answer(game.q.answer);next()');assert.equal(run('balance()'),0);assert.equal(run('saved.wallet.correct'),9);run('answer(game.q.answer)');assert.equal(run('balance()'),5);assert.equal(run('game.earnedMinutes'),5);run('answer(game.q.answer)');assert.equal(run('balance()'),5);run('next()');
const previousStars=run('saved.stars');run('showWallet();confirmSpend()');assert.equal(run('balance()'),5);run('commitSpend()');assert.equal(run('balance()'),0);assert.equal(run('saved.wallet.spent'),5);run('commitSpend()');assert.equal(run('balance()'),0);run('returnFromWallet()');assert.equal(run('screen'),'result');assert.equal(run('saved.stars'),previousStars);
run("home();start();for(let i=0;i<6;i++){answer(game.q.answer);next();}home();start();for(let i=0;i<4;i++){answer(game.q.answer);next();}");assert.equal(run('balance()'),5);assert.equal(run('saved.wallet.correct'),20);run('home();showWallet();spendAmount=10;confirmSpend()');assert.equal(run('dialog'),null);assert.equal(run('balance()'),5);
run('spendAmount=5;confirmSpend();resume()');assert.equal(run('balance()'),5);assert.equal(run('dialog'),null);run('persist()');assert.equal(JSON.parse(storage.get('mayusha.v1')).wallet.correct,20);
console.log('Roblox wallet passed: tenth correct earns 5; progress spans rounds; duplicate answers and double spending blocked; cancellation is free; overspending blocked; returning does not award stars again; balance persisted.');
const migrated=E.migrateWallet({correct:27,bonus:2,spent:5,events:[{type:'spend',minutes:5,at:1234}]});
assert.equal(migrated.earned-migrated.spent,7);assert.equal(migrated.progress.easy,7);assert.equal(migrated.progress.medium,0);assert.equal(migrated.progress.hard,0);assert.deepEqual(E.migrateWallet(migrated),migrated);
for(let i=0;i<3;i++)E.creditWallet(migrated,'easy');assert.equal(migrated.earned-migrated.spent,12);
const independent=E.migrateWallet(null);for(let i=0;i<9;i++)assert.equal(E.creditWallet(independent,'easy'),0);assert.equal(E.creditWallet(independent,'hard'),0);assert.equal(independent.earned,0);assert.equal(E.creditWallet(independent,'easy'),5);for(let i=0;i<9;i++)E.creditWallet(independent,'hard');assert.equal(independent.earned,15);for(let i=0;i<10;i++)E.creditWallet(independent,'medium');assert.equal(independent.earned,22);
run("saved.wallet=E.migrateWallet(null);Object.assign(saved,{level:'hard',mode:'calm'});start();for(let i=0;i<10;i++){answer(game.q.answer);next();}");assert.equal(run('balance()'),10);assert.equal(run('game.earnedMinutes'),10);run("showWallet();spendApp='Likee';spendAmount=7;confirmSpend();commitSpend()");assert.equal(run('balance()'),3);assert.equal(run('saved.wallet.events[0].app'),'Likee');run("spendApp='Roblox';spendAmount=3;confirmSpend();commitSpend()");assert.equal(run('balance()'),0);assert.equal(run('saved.wallet.events[0].app'),'Roblox');assert.equal(run('saved.wallet.events[1].app'),'Likee');
console.log('v1.3 passed: factors never exceed 10; difficulty pools correct; choices <=100; 5/7/10 rewards; independent progress; old balance and partial progress preserved; migration idempotent; Roblox and Likee share one balance with separate history labels.');
run("saved.wallet=E.migrateWallet({version:2,correct:20,earned:20,spent:0,progress:{easy:0,medium:0,hard:0},events:[]});home();showWallet();spendApp='Roblox';spendAmount=10;confirmSpend()");
const callsBefore=shareCalls.length;run('commitSpend()');assert.equal(run('balance()'),10);assert.equal(shareCalls.length,callsBefore+1);const originalText=shareCalls.at(-1);assert(originalText.includes('10 минут на Roblox'));assert(originalText.includes('Списание:'));assert(originalText.includes('только один раз'));const storageAfterShare=JSON.parse(storage.get('mayusha.v1'));assert.equal(storageAfterShare.wallet.spent,10);
run('commitSpend()');assert.equal(shareCalls.length,callsBefore+1);assert.equal(run('balance()'),10);
run('shareEntry(saved.wallet.events[0])');assert.equal(run('balance()'),10);assert.equal(shareCalls.length,callsBefore+2);assert.equal(shareCalls.at(-1),originalText);
run("spendApp='Likee';spendAmount=7;confirmSpend();commitSpend()");assert.equal(run('balance()'),3);assert(shareCalls.at(-1).includes('7 минут на Likee'));
const originalSetItem=ctx.localStorage.setItem;ctx.localStorage.setItem=()=>{throw new Error('storage full')};const beforeStorageFailure=shareCalls.length;run('spendAmount=3;confirmSpend();commitSpend()');assert.equal(run('balance()'),3);assert.equal(shareCalls.length,beforeStorageFailure);assert.equal(run('saved.wallet.events.length'),2);ctx.localStorage.setItem=originalSetItem;
// Browser cancellation does not undo a recorded redemption or send automatically again.
ctx.MayushaAndroid=undefined;ctx.navigator={share:async()=>{const error=new Error('cancelled');error.name='AbortError';throw error;}};
(async()=>{await run('shareEntry(saved.wallet.events[0])');assert.equal(run('balance()'),3);assert(run('shareNotice').includes('Отправка закрыта'));ctx.navigator=undefined;await run('shareEntry(saved.wallet.events[0])');assert.equal(run('dialog'),'message');assert(run('messageToCopy').includes('7 минут на Likee'));assert.equal(run('balance()'),3);console.log('Sharing passed: exact minutes/app; debit persisted before handoff; repeated sharing uses identical request without debit; double tap blocked; failed storage rolls back with no share; cancelled share and unavailable sharing preserve balance and offer recovery.');})().catch(e=>{console.error(e);process.exitCode=1;});
