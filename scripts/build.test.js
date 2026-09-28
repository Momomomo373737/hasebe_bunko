import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const builder=resolve('scripts/build-manifest.js');
test('自動検出・数字順・ハッシュ更新・不正データの拒否',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hasebe-test-'));
 try{
  await writeFile(join(dir,'package.json'),'{"type":"module"}');
  for(const file of ['app.js','style.css','index.html'])await copyFile(resolve(file),join(dir,file));
  await mkdir(join(dir,'stories/cafe'),{recursive:true});
  const put=(file,value)=>writeFile(join(dir,'stories/cafe',file),'export default '+JSON.stringify(value));
  await put('series.js',{title:'カフェ編'});
  for(const number of [10,2,1])await put(number+'.js',{number,title:'話'+number,body:'<script>文字列</script>\n\n本文'});
  const run=()=>spawnSync(process.execPath,[builder,dir],{encoding:'utf8'});
  assert.equal(run().status,0);
  const get=async file=>JSON.parse(await readFile(join(dir,'dist',file),'utf8'));
  const first=await get('data/current.json'),manifest=await get(first.manifest);
  assert.deepEqual(manifest.series[0].episodes.map(e=>e.number),[1,2,10]);
  assert.equal(manifest.series[0].count,3);
  const old=manifest.series[0].episodes[0].path;
  assert.equal((await get(old)).body,'<script>文字列</script>\n\n本文');
  assert.equal(run().status,0);assert.deepEqual(await get('data/current.json'),first);
  await put('1.js',{number:1,title:'話1',body:'修正した本文'});
  assert.equal(run().status,0);const second=await get('data/current.json');assert.notEqual(second.manifest,first.manifest);assert.equal(second.app,first.app);
  assert.notEqual((await get(second.manifest)).series[0].episodes[0].path,old);
  await mkdir(join(dir,'stories/new-series'));await writeFile(join(dir,'stories/new-series/series.js'),'export default {title:"新シリーズ"}');
  assert.equal(run().status,0);assert.equal((await get((await get('data/current.json')).manifest)).series.length,2);
  await put('duplicate.js',{number:1,title:'重複',body:'本文'});let result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/重複/);
  await rm(join(dir,'stories/cafe/duplicate.js'));await put('bad.js',{number:0,title:'不正',body:'本文'});result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/整数/);
 }finally{await rm(dir,{recursive:true,force:true})}
});
