(function(root){
'use strict';
const levels={easy:{name:'Первые шаги',factors:[2,3,4,5,10],min:2,max:10,other:10,secondMin:1,description:'На 2, 3, 4, 5 и 10'},medium:{name:'Уже умею',factors:[2,3,4,5,6,7,8,9,10],min:2,max:10,other:10,secondMin:2,description:'Вся таблица до 10'},hard:{name:'Суперсила',factors:[6,7,8,9],min:6,max:9,other:9,secondMin:6,description:'Сочетания от 6 до 9'}};
const rewards={easy:5,medium:7,hard:10};
function randomInt(min,max,rng=Math.random){return Math.floor(rng()*(max-min+1))+min;}
function shuffle(a,rng=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){let j=randomInt(0,i,rng);[a[i],a[j]]=[a[j],a[i]];}return a;}
function makeQuestion(a,b,operation,unknown,rng=Math.random){
 const op=operation==='divide'?'÷':'×';
 const left=op==='÷'?a*b:a,right=op==='÷'?a:b,result=op==='÷'?b:a*b;
 const answer=unknown==='left'?left:unknown==='right'?right:result;
 const key=[left,op,right,unknown].join(':');const choices=new Set([answer]);let tries=0;
 while(choices.size<4&&tries++<100){let value=answer+randomInt(-3,3,rng)*(unknown==='none'&&op==='×'?a:1);if(value>0&&value<=100&&value!==answer)choices.add(value);}
 for(let n=1;choices.size<4;n++)choices.add(n);
 return {a,b,left,right,result,op,unknown,missing:unknown!=='none',answer,key,choices:shuffle([...choices],rng)};
}
function question(level,previous='',rng=Math.random,options={}){
 const l=levels[level]||levels.easy;let q;
 for(let i=0;i<30;i++){
  const a=l.factors[randomInt(0,l.factors.length-1,rng)],b=randomInt(l.secondMin,l.other,rng);
  const operation=options.operation==='mixed'?(rng()<.5?'multiply':'divide'):options.operation||'multiply';
  const format=options.format||'normal';const missing=format==='gaps'||format==='mixed'&&rng()<.5;
  const unknown=missing?(rng()<.5?'left':'right'):'none';
  q=makeQuestion(a,b,operation,unknown,rng);if(q.key!==previous)break;
 }
 return q;
}
function equation(q){return `${q.left} ${q.op} ${q.right} = ${q.result}`;}
function stars(correct,total){return total===0?0:correct/total>=0.9?3:correct/total>=0.6?2:1;}
function migrateWallet(source){
 const w=source&&typeof source==='object'?source:{};
 const safe=n=>Number.isSafeInteger(n)&&n>=0?n:0;
 const correct=safe(w.correct),legacy=w.version!==2;
 const earned=legacy?Math.floor(correct/10)*5+safe(w.bonus):safe(w.earned);
 const progress={};for(const level of Object.keys(levels))progress[level]=legacy?(level==='easy'?correct%10:0):Math.min(9,safe(w.progress?.[level]));
 const events=Array.isArray(w.events)?w.events.filter(e=>e&&['earn','spend','bonus','undo'].includes(e.type)&&Number.isSafeInteger(e.minutes)&&e.minutes>0&&typeof e.at==='number').slice(0,30):[];
 return {version:2,correct,earned,spent:Math.min(safe(w.spent),earned),progress,events};
}
function creditWallet(wallet,level){
 if(!rewards[level])return 0;wallet.correct++;wallet.progress[level]++;
 if(wallet.progress[level]<10)return 0;
 wallet.progress[level]-=10;const minutes=rewards[level];wallet.earned+=minutes;return minutes;
}
const api={levels,rewards,migrateWallet,creditWallet,randomInt,shuffle,makeQuestion,question,equation,stars};if(typeof module!=='undefined')module.exports=api;root.MayuEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
