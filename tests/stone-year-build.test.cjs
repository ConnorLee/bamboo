const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const output=path.resolve(__dirname,'../public/halo-site');
// Run after website:build: public routes omit the source directory, so a
// document-relative ../assets URL works locally but fails in deployed pages.
test('built home and how-it-works consumers resolve the same twelve public stone assets',()=>{
 const window={};const context=vm.createContext({window});
 for(const file of ['halo-i-catalog.js','milestones.js','how-it-works/collection.js'])vm.runInContext(fs.readFileSync(path.join(output,file),'utf8'),context);
 window.HALO_MILESTONES.forEach((stone,index)=>{
  const expected='/halo-site/assets/stone-year/'+stone.key+'.webp';
  assert.equal(stone.preview,expected);assert.equal(stone.mineral,expected);
  assert.equal(window.HALO_YEAR_COLLECTION.stones[index].image,expected);
  assert.ok(fs.statSync(path.join(output,expected.replace('/halo-site/',''))).size>1000);
 });
 const how=fs.readFileSync(path.join(output,'how-it-works/app.js'),'utf8');
 assert.ok(how.includes('/halo-site/assets/bracelet-year/progress-'));
 assert.ok(how.includes('/halo-site/assets/bracelet-year/empty.webp'));
 assert.doesNotMatch(how,/['"`]\.\.\/assets\//);
});
