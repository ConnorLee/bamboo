const test=require('node:test');
const assert=require('node:assert/strict');
const {sample,duration}=require('../website/stone-module.js');

test('scroll visits every physical layer before the lifecycle, in order',()=>{
  const copies=[];
  for(let p=0;p<=duration;p+=.01){const c=sample(p).copy;if(copies.at(-1)!==c) copies.push(c);}
  assert.deepEqual(copies,[0,1,2,3,4,5,6,7,8]);
});
test('recognition happens with a reassembled loose stone, before a setting appears',()=>{
  const before=sample(5.7),read=sample(6.55);
  assert.equal(before.recognition,0);
  assert.equal(read.spread,0);
  assert.equal(read.bracelet,0);
  assert.equal(read.shield,0);
  assert.equal(read.phone,1);
  assert.equal(read.recognition,1);
});
test('seating finishes before the twist; shielding follows the lock',()=>{
  const descending=sample(8.4),seated=sample(8.71),locked=sample(9.3),worn=sample(10.8);
  assert.ok(descending.seat>0&&descending.seat<1);
  assert.equal(descending.turn,0);
  assert.equal(seated.seat,1);
  assert.equal(seated.turn,0);
  assert.equal(locked.turn,1);
  assert.equal(locked.shield,0);
  assert.equal(worn.shield,1);
  assert.equal(worn.phone,0);
  assert.deepEqual([worn.x,worn.y,worn.scale],[350,345,.65]);
  assert.ok(worn.rotation===0);
});
test('reverse, skipped frames and repeated progress reproduce identical geometry',()=>{
  const positions=[0,1.05,1.75,2.45,3.2,4.65,6.55,8.4,9.2,10.8,duration];
  const forward=positions.map(p=>sample(p));
  const reverse=[...positions].reverse().map(p=>sample(p)).reverse();
  assert.deepEqual(forward,reverse);
  assert.deepEqual(sample(4.65),sample(4.65));
  assert.equal(sample(-10).time,0);
  assert.equal(sample(1e5).time,duration);
});
test('reduced motion freezes each beat while retaining the full story',()=>{
  assert.deepEqual({...sample(5.1,true),time:0},{...sample(7.1,true),time:0});
  assert.equal(sample(6,true).recognition,1);
  assert.equal(sample(9.5,true).shield,1);
});
test('a plain pellet conceals the engraving until removal; the seated stone covers it again',()=>{
  const metal=sample(7.46),lift=sample(7.7),reveal=sample(8.12),seated=sample(8.71);
  assert.equal(metal.bracelet,1);
  assert.equal(metal.pellet,1);
  assert.equal(metal.pelletLift,0);
  assert.equal(metal.engraving,0);
  assert.ok(lift.pelletLift>0&&lift.pelletLift<1);
  assert.equal(reveal.pellet,0);
  assert.equal(reveal.engraving,1);
  assert.equal(reveal.seat,0);
  assert.equal(seated.seat,1);
  assert.equal(seated.engraving,0);
  assert.equal(seated.pellet,0);
  assert.equal(sample(7.5,true).engraving,1);
  assert.equal(sample(7.5,true).seat,0);
  assert.equal(sample(10.8,true).engraving,0);
  assert.equal(sample(10.8,true).seat,1);
});
