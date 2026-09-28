const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(fetch){
 const nodes=new Map();const node=key=>{if(!nodes.has(key))nodes.set(key,{textContent:'',innerHTML:'',style:{},checked:true,disabled:false,classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},querySelector(){return node(key+' child')},getContext(){return new Proxy({}, {get:()=>()=>{}})}});return nodes.get(key)};
 const context={document:{querySelector:node,querySelectorAll:()=>[]},TableTurn:require('./core.js'),fetch,AbortSignal,Set,Date,Math,Number,performance:{now:()=>0},requestAnimationFrame:callback=>callback(5000),window:{scrollTo(){},matchMedia:()=>({matches:true})}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('app.js','utf8'),context);return {context,node};
}
test('search includes full radius, zero coordinates, and all candidates in batches',async()=>{
 const calls=[];const {context}=setup(async(url,options)=>{calls.push({url,options});if(options?.method==='POST')return {ok:true,json:async()=>({elements:Array.from({length:65},(_,i)=>({type:'node',id:i,lat:0,lon:0.001+i*0.0001,tags:{name:'Restaurant '+i,cuisine:'thai',amenity:i===0?'fast_food':'restaurant'}}))})};const count=url.split('?')[0].split(';').length;return {ok:true,json:async()=>({code:'Ok',distances:[Array(count).fill(1000)],durations:[Array(count).fill(60)]})}});
 const result=await vm.runInContext("findPlaces({km:15,origin:{lat:0,lon:0},cuisines:new Set(['thai']),onlyOpen:false,now:new Date()})",context);
 assert.equal(result.length,65);assert.equal(calls.length,3);assert.match(calls[0].options.body,/around:15000,0,0/);assert.equal(result[0].estimated,false);
 const filtered=await vm.runInContext("findPlaces({km:15,origin:{lat:0,lon:0},cuisines:new Set(['thai']),onlyOpen:false,excludeFastFood:true,now:new Date()})",context);
 assert.equal(filtered.length,64);assert.ok(filtered.every(place=>place.tags.amenity!=='fast_food'));
});
test('wheel completes, displays winner, and labels generic suggestions',()=>{
 const {context,node}=setup();
 vm.runInContext("coords={lat:0,lon:0};lastResults=[{name:'Test Restaurant',lat:0,lon:0.01,tags:{cuisine:'thai'},driveKm:2,estimated:true,minutes:3}];spinWheel()",context);
 assert.equal(node('#winnerName').textContent,'Test Restaurant');
 assert.match(node('#winnerMeta').textContent,/Estimated/);
 assert.match(node('#wheelFood').innerHTML,/not this restaurant’s menu/);
 assert.equal(node('#spinBtn').disabled,false);
 assert.match(node('#directionsLink').href,/destination=0%2C0.01/);
});
