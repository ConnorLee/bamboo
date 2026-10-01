const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {stateForIndex,CENTER,HISTORY_SLOTS}=require('../website/bracelet.js');
const indices=Array.from({length:12},(_,index)=>index);
const filled=state=>state.filter(position=>position.stone!==null);
const examples=[
 [0,[null,null,null,null,null,null,0,null,null,null,null,null]],
 [2,[null,null,null,null,null,0,2,1,null,null,null,null]],
 [5,[null,null,null,4,2,0,5,1,3,null,null,null]],
 [11,[9,7,5,4,2,0,11,1,3,6,8,10]]
];
for(const [index,expected] of examples) test(`Month ${index+1} has the actual twelve-seat accumulation`,()=>assert.deepEqual(stateForIndex(index).map(p=>p.stone),expected));
test('all twelve stages retain exactly twelve receivers and center the current stone',()=>{
 for(const index of indices){
  const state=stateForIndex(index);
  assert.equal(state.length,12);assert.deepEqual(state.map(p=>p.index),indices);
  assert.equal(state[CENTER].stone,index);assert.equal(state[CENTER].role,'current');
  assert.equal(state.filter(p=>p.role==='intention').length,0);
  assert.equal(state.filter(p=>p.role==='current').length,1);
  assert.equal(filled(state).length,index+1);assert.equal(state.filter(p=>p.stone===null).length,11-index);
  assert.deepEqual(filled(state).map(p=>p.stone).sort((a,b)=>a-b),indices.slice(0,index+1));
 }
});
test('historical stones retain their seats through forward/reverse jumps',()=>{
 const forward=indices.map(stateForIndex);
 assert.deepEqual([...indices].reverse().map(stateForIndex).reverse(),forward);
 for(const index of indices)for(const position of filled(forward[index]).filter(p=>p.index!==CENTER))for(const later of indices.slice(index+1))assert.equal(forward[later][position.index].stone,position.stone);
 assert.equal(new Set(HISTORY_SLOTS).size,11);assert.ok(!HISTORY_SLOTS.includes(CENTER));
});
test('twelve canonical minerals agree with the renderer indices, without an Intention stage',()=>{
 const context={window:{}};
 for(const name of ['halo-i-catalog.js','milestones.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../website',name),'utf8'),context);
 const catalog=JSON.parse(JSON.stringify(context.window.HALO_MILESTONES));
 const canonical=JSON.parse(JSON.stringify(context.window.HALO_I_CATALOG));
 const expected=['moonstone','amethyst','turquoise','rose-quartz','carnelian','lapis-lazuli','aventurine','tigers-eye','black-tourmaline','citrine','quartz','opal'];
 assert.equal(catalog.length,12);assert.deepEqual(catalog.map(s=>s.month),indices.map(i=>i+1));assert.deepEqual(catalog.map(s=>s.key),expected);
 for(const stage of canonical)for(const [key,value]of Object.entries(stage))assert.deepEqual(catalog[stage.month-1][key],value,`${stage.month} preserves ${key}`);
 for(const stage of catalog)assert.ok(stage.environment&&stage.color&&stage.stone);
});
