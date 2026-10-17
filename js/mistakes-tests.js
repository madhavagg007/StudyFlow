// StudyFlow: Mistake log and test tracking
function mistakes(){let types={Concept:0,Calculation:0,Careless:0,Time:0};state.mistakes.forEach(m=>types[m.type]=(types[m.type]||0)+1);let top=Object.entries(types).sort((a,b)=>b[1]-a[1])[0];document.getElementById('app').innerHTML=`<div class="row"><div><h2>Error book</h2><div class="muted">Inspired by Achievers' error-book idea: record the cause and the prevention, not just the wrong answer.</div></div><button class="btn" onclick="addMistake()">+ Mistake</button></div><div style="height:12px"></div><div class="grid"><section class="card span4"><h3>Pattern</h3><div class="kpi" style="font-size:28px">${top&&top[1]?esc(top[0]):'—'}</div><div class="mini">Most common error type</div></section><section class="card span8"><h3>Rule</h3><p class="quote">Every mistake should end with a prevention action. Reattempt unresolved mistakes before adding more passive study.</p></section><section class="card span12"><div class="list">${state.mistakes.slice().reverse().map(m=>`<div class="item"><div class="row"><b>${esc(m.topic)}</b><span class="tag ${m.reattempted?'good':'warn'}">${m.reattempted?'Reattempted':'Unresolved'}</span></div><div class="mini">${esc(m.subject)} · ${esc(m.chapter||'Custom chapter')} · ${esc(m.date)} · ${esc(m.type)}</div>${m.photo?`<div class="mistake-photo"><img src="${m.photo}" alt="Attached mistake photo" loading="lazy"></div>`:''}<p style="margin:8px 0 4px"><b>Why:</b> ${esc(m.why)}</p><p style="margin:0"><b>Fix:</b> ${esc(m.fix)}</p><div class="controls" style="margin-top:9px"><button class="btn soft small" onclick="markMistake('${m.id}')">${m.reattempted?'Mark unresolved':'Mark reattempted'}</button></div></div>`).join('')||'<div class="empty">Your error book is empty.</div>'}</div></section></div>`}
function markMistake(id){let m=state.mistakes.find(x=>x.id===id);if(m){m.reattempted=!m.reattempted;save();render()}}
function addMistake(){
  const options=state.chapters.map(c=>`<option value="${c.id}">${esc(c.subject)} — ${esc(c.name)}</option>`).join('');
  const subjects=subjectNames().map(s=>`<option>${esc(s)}</option>`).join('');
  openSheet(`<h2>Log a mistake</h2>
  <div class="formgrid">
    <label>Chapter<select id="mc" onchange="toggleCustomMistakeChapter()"><option value="">Select chapter</option>${options}<option value="__custom__">＋ Custom chapter</option></select></label>
    <label class="hide" id="customChapterWrap">Custom chapter<input class="input" id="mcustomChapter" placeholder="e.g. Electrostatics — Current Electricity"></label>
    <label class="hide" id="customSubjectWrap">Subject<select id="mSubject">${subjects}</select></label>
    <label>Type<select id="mx"><option>Concept</option><option>Calculation</option><option>Careless</option><option>Time</option></select></label>
    <label>Topic<input class="input" id="mt" placeholder="What concept/question?"></label>
    <label>Why?<input class="input" id="mw" placeholder="What caused it?"></label>
    <label class="full">Fix / prevention<textarea class="input" id="mf" rows="3" placeholder="What will you do differently?"></textarea></label>
    <label class="full">Photo / question image<input class="input" id="mphoto" type="file" accept="image/*" onchange="previewMistakePhoto(this)"><div id="mphotoPreview" class="mistake-photo-preview hide"></div><div class="mini" style="margin-top:6px">Tap to choose a photo from your phone. If supported by Android, you can also choose the camera.</div></label>
  </div>
  <button class="btn" style="margin-top:12px" onclick="saveMistake()">Save mistake</button>`);
}
function toggleCustomMistakeChapter(){
  const custom=document.getElementById('mc')?.value==='__custom__';
  document.getElementById('customChapterWrap')?.classList.toggle('hide',!custom);
  document.getElementById('customSubjectWrap')?.classList.toggle('hide',!custom);
}
function previewMistakePhoto(input){
  const box=document.getElementById('mphotoPreview');
  const file=input?.files?.[0];
  if(!box)return;
  if(!file){box.classList.add('hide');box.innerHTML='';return;}
  const url=URL.createObjectURL(file);
  box.innerHTML=`<img src="${url}" alt="Mistake photo preview">`;
  box.classList.remove('hide');
}
function compressMistakePhoto(file,done){
  const reader=new FileReader();
  reader.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      const max=1280,scale=Math.min(1,max/Math.max(img.width,img.height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
      done(canvas.toDataURL('image/jpeg',0.72));
    };
    img.onerror=()=>done('');
    img.src=reader.result;
  };
  reader.onerror=()=>done('');
  reader.readAsDataURL(file);
}
function saveMistake(){
  const topic=(document.getElementById('mt')?.value||'').trim();
  const why=(document.getElementById('mw')?.value||'').trim();
  const fix=(document.getElementById('mf')?.value||'').trim();
  const selectedId=document.getElementById('mc')?.value||'';
  const customChapter=(document.getElementById('mcustomChapter')?.value||'').trim();
  const subject=(document.getElementById('mSubject')?.value||subjectNames()[0]||'General').trim();
  const c=state.chapters.find(x=>x.id===selectedId);
  const isCustom=selectedId==='__custom__';
  if(!topic||!why||!fix||(isCustom?!customChapter:!c)){toast(isCustom?'Enter the custom chapter name, topic, cause and prevention.':'Fill the topic, cause, prevention and chapter.');return;}
  const finish=(photoData='')=>{
    const chapterName=isCustom?customChapter:c.name;
    const chapterSubject=isCustom?subject:c.subject;
    state.mistakes.push({id:uid(),chapterId:isCustom?'':c.id,subject:chapterSubject,chapter:chapterName,topic,type:document.getElementById('mx').value,why,fix,date:today(),reattempted:false,photo:photoData||''});
    if(c)c.mastery=Math.max(0,(c.mastery||0)-3);
    save();closeModal();render();toast('Mistake saved');
  };
  const file=document.getElementById('mphoto')?.files?.[0];
  if(file){compressMistakePhoto(file,finish);}else finish('');
}
function tests(){let avg=state.tests.length?Math.round(state.tests.reduce((a,t)=>a+t.score,0)/state.tests.length):0,best=state.tests.length?Math.max(...state.tests.map(t=>t.score)):0;let weakCounts={};state.tests.forEach(t=>(t.weakTopics||[]).forEach(w=>weakCounts[w.name]=(weakCounts[w.name]||0)+1));let topWeak=Object.entries(weakCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);document.getElementById('app').innerHTML=`<div class="row"><div><h2>Test lab</h2><div class="muted">Test results now feed the chapter priority engine.</div></div><button class="btn" onclick="addTest()">+ Test</button></div><div style="height:12px"></div><div class="grid"><section class="card span4"><div class="muted">Average</div><div class="kpi">${avg}%</div></section><section class="card span4"><div class="muted">Best</div><div class="kpi">${best}%</div></section><section class="card span4"><div class="muted">Tests logged</div><div class="kpi">${state.tests.length}</div></section><section class="card span5"><h3>Repeated weak topics</h3>${topWeak.map(w=>`<div class="metric"><span>${esc(w[0])}</span><b>${w[1]}×</b></div>`).join('')||'<div class="empty">Add weak topics to reveal patterns.</div>'}</section><section class="card span7"><div class="list">${state.tests.slice().reverse().map(t=>`<div class="item"><div class="row"><div><b>${esc(t.name)}</b><div class="mini">${esc(t.subject)} · ${esc(t.date)}</div></div><span class="tag ${t.score>=80?'good':t.score<50?'bad':'warn'}">${t.score}%</span></div><div class="mini" style="margin-top:7px">Weak topics: ${esc((t.weakTopics||[]).map(w=>w.name).join(', ')||'None recorded')}</div></div>`).join('')||'<div class="empty">Log your first test.</div>'}</div></section></div>`}
function addTest(){let options=state.chapters.map(c=>`<option value="${c.id}">${esc(c.subject)} — ${esc(c.name)}</option>`).join('');openSheet(`<h2>Log a test</h2><div class="formgrid"><label>Name<input class="input" id="tn" placeholder="JEE mock 01"></label><label>Subject<select id="ts">${subjectNames().map(s=>`<option>${s}</option>`).join('')}</select></label><label>Score %<input class="input" id="tp" type="number" min="0" max="100"></label><label>Date<input class="input" id="td" type="date" value="${today()}"></label><label class="full">Weak chapters<select class="input" id="tw" multiple size="5">${options}</select></label></div><div class="mini" style="margin-top:7px">On Android, tap one or more chapters. These choices raise their priority automatically.</div><button class="btn" style="margin-top:12px" onclick="saveTest()">Save test</button>`)}
function saveTest(){
  const name=(document.getElementById('tn')?.value||'').trim();
  const score=Number(document.getElementById('tp')?.value);
  const date=document.getElementById('td')?.value||today();
  const subject=document.getElementById('ts')?.value||subjectNames()[0]||'General';
  const sel=[...(document.getElementById('tw')?.selectedOptions||[])].map(o=>o.value);
  if(!name||!Number.isFinite(score)||score<0||score>100){toast('Enter a name and a score from 0–100.');return;}
  const weakTopics=sel.map(id=>{let c=state.chapters.find(x=>x.id===id);if(c)c.mastery=Math.max(0,(c.mastery||0)-2);return c?{chapterId:c.id,name:c.name}:null}).filter(Boolean);
  state.tests.push({id:uid(),name,subject,score,date,weakTopics});
  save();closeModal();render();toast('Test saved');
}
