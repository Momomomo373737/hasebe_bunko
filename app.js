const root=document.getElementById('root');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=(id,n)=>'?series='+encodeURIComponent(id)+(n===undefined?'':'&episode='+n);
const key='hasebe-library:last-read:v1';
let manifest;
function saved(){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
function frame(content){root.innerHTML=`<div class="shell"><header class="header"><a class="brand" href="?">長谷部文庫<small>HASEBE LIBRARY</small></a><nav aria-label="メイン"><a href="?">蔵書一覧</a><a href="?#about">この文庫について</a></nav></header><main>${content}</main><footer class="footer"><span>長谷部文庫</span><span>物語を、いつでもそばに。</span></footer></div>`}
export async function start(current){
 const response=await fetch(current.manifest);if(!response.ok)throw Error('一覧を取得できませんでした');manifest=await response.json();
 const params=new URLSearchParams(location.search),id=params.get('series'),n=params.get('episode');
 if(!id){home();return}const series=manifest.series.find(s=>s.id===id);
 if(!series){missing('シリーズが見つかりません');return}
 if(n===null){list(series);return}const index=series.episodes.findIndex(e=>String(e.number)===n);
 if(index<0){missing('この話は見つかりません');return}
 const ep=series.episodes[index];const r=await fetch(ep.path);if(!r.ok)throw Error('本文を取得できませんでした');const data=await r.json();
 document.title=ep.title+'｜'+series.title+'｜長谷部文庫';
 frame(`<div class="reader"><div class="breadcrumb"><a href="${url(id)}">← ${escape(series.title)}の話数一覧</a></div><section class="intro"><p class="eyebrow">${escape(series.title)} · 第${ep.number}話</p><h1>${escape(ep.title)}</h1></section><article class="body" aria-label="小説本文"></article><nav class="reader-nav" aria-label="前後の話">${index?`<a href="${url(id,series.episodes[index-1].number)}">← 第${series.episodes[index-1].number}話</a>`:'<span></span>'}<a href="${url(id)}">話数一覧へ</a>${index<series.episodes.length-1?`<a href="${url(id,series.episodes[index+1].number)}">第${series.episodes[index+1].number}話 →</a>`:'<span>最終話</span>'}</nav></div>`);
 document.querySelector('.body').textContent=data.body;
 try{localStorage.setItem(key,JSON.stringify({series:id,number:ep.number}))}catch{}
}
function home(){
 document.title='長谷部文庫';const last=saved(),s=manifest.series.find(s=>s.id===last?.series),ep=s?.episodes.find(e=>e.number===last?.number);
 frame(`<section class="intro"><p class="eyebrow">A PRIVATE COLLECTION OF STORIES</p><h1>物語は、ここに。<br>何度でも、最初の一話から。</h1><p class="lead">長谷部健司との日々を、一話ずつ。<br>好きなときに、好きな物語へ戻るための私設文庫です。</p></section>${ep?`<a class="resume" href="${url(s.id,ep.number)}"><span><small>続きから読む</small><strong>${escape(s.title)}　${escape(ep.title)}</strong></span><span>→</span></a>`:''}<section aria-labelledby="collection"><div class="section-head"><h2 id="collection">蔵書一覧</h2><span class="muted">${manifest.series.length}シリーズ / 全${manifest.series.reduce((n,s)=>n+s.count,0)}話</span></div>${manifest.series.map((s,i)=>`<a class="series-row" href="${url(s.id)}"><span class="ordinal">${String(i+1).padStart(2,'0')}</span><div><h3>${escape(s.title)}</h3><p>${escape(s.description)}</p></div><span class="count">全${s.count}話</span><span class="arrow">→</span></a>`).join('')||'<p>まだ作品がありません。</p>'}</section><section class="about" id="about"><h2>この文庫について</h2><p>日々の中にある小さな物語を、静かに集めています。<br>それぞれのシリーズを、第1話から順番にお楽しみください。<br>最後に開いた一話は、このブラウザにしおりとして残ります。</p></section>`)
}
function list(s){document.title=s.title+'｜長谷部文庫';frame(`<div class="breadcrumb"><a href="?">← 蔵書一覧</a></div><section class="intro series-intro"><p class="eyebrow">COLLECTION · 全${s.count}話${s.status?' · '+escape(s.status):''}</p><h1>${escape(s.title)}</h1><p class="lead">${escape(s.description)}</p>${s.count?`<a class="read-first" href="${url(s.id,s.episodes[0].number)}">最初の一話から読む →</a>`:''}</section><div class="section-head"><h2>話数一覧</h2><span class="muted">話数順</span></div><ol class="episodes">${s.episodes.map(e=>`<li><a href="${url(s.id,e.number)}"><span class="ordinal">${String(e.number).padStart(2,'0')}</span><span>${escape(e.title)}</span><span class="arrow">→</span></a></li>`).join('')||'<li>作品の追加をお待ちください。</li>'}</ol>`)}
function missing(message){document.title='見つかりません｜長谷部文庫';frame(`<section class="error"><h1>${message}</h1><p>作品が移動・削除された可能性があります。</p><a href="?">蔵書一覧へ戻る →</a></section>`)}
// BFCacheから戻ったときも、最新版の入口から読み直す。
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
