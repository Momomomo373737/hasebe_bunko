import { readdir, readFile, writeFile, mkdir, rm, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const root=resolve(process.argv[2]||'.'),out=join(root,'dist');
await rm(out,{recursive:true,force:true});await mkdir(join(out,'data'),{recursive:true});await mkdir(join(root,'data'),{recursive:true});
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,16);
async function asset(prefix,extension,body){const path=`${prefix}.${hash(body)}.${extension}`;await writeFile(join(out,path),body);return path}
function required(value,label){if(typeof value!=='string'||!value.trim())throw Error(label+' は空でない文字列が必要です');return value}
const series=[];
for(const folder of (await readdir(join(root,'stories'),{withFileTypes:true})).filter(f=>f.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))){
 if(!/^[a-z0-9][a-z0-9-]*$/.test(folder.name))throw Error('シリーズのフォルダ名は半角英数字とハイフン: '+folder.name);
 const dir=join(root,'stories',folder.name);const load=async file=>(await import(pathToFileURL(join(dir,file)).href)).default;
 const meta=await load('series.js');if(!meta||typeof meta!=='object')throw Error(folder.name+'/series.js の形式が不正です');
 if(meta.id!==undefined&&meta.id!==folder.name)throw Error(folder.name+': idとフォルダ名を一致させてください');
 const title=required(meta.title,folder.name+'のtitle');
 if(meta.sort!==undefined&&!Number.isFinite(meta.sort))throw Error(folder.name+': sortは数値が必要です');
 const episodes=[],seen=new Set();
 for(const file of (await readdir(dir)).filter(f=>f.endsWith('.js')&&f!=='series.js')){
  const e=await load(file);const label=folder.name+'/'+file;
  if(!e||!Number.isSafeInteger(e.number)||e.number<1)throw Error(label+': numberは1以上の整数が必要です');
  if(seen.has(e.number))throw Error(label+': 話数が重複しています');seen.add(e.number);
  required(e.title,label+' title');required(e.body,label+' body');
  const path=await asset(`data/${folder.name}-${e.number}`,'json',JSON.stringify({number:e.number,title:e.title,body:e.body}));
  episodes.push({number:e.number,title:e.title,path});
 }
 episodes.sort((a,b)=>a.number-b.number);
 series.push({id:folder.name,title,description:typeof meta.description==='string'?meta.description:'',status:typeof meta.status==='string'?meta.status:'',sort:meta.sort??999,count:episodes.length,episodes});
}
series.sort((a,b)=>a.sort-b.sort||a.id.localeCompare(b.id));
const content=JSON.stringify({series},null,2);await writeFile(join(root,'data/manifest.json'),content);
const manifest=await asset('data/manifest','json',content);
const app=await asset('app','js',await readFile(join(root,'app.js')));
const style=await asset('style','css',await readFile(join(root,'style.css')));
await writeFile(join(out,'data/current.json'),JSON.stringify({manifest,app,style}));
await copyFile(join(root,'index.html'),join(out,'index.html'));await writeFile(join(out,'.nojekyll'),'');
console.log(`Built ${series.length} series / ${series.reduce((n,s)=>n+s.count,0)} episodes → dist`);
