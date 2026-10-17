// StudyFlow: Subjects, settings, onboarding, import/export and reset
function openSubjectManager(){const rows=subjectList().map((s,i)=>`<div class="item"><label>Subject name<input class="input" data-subject-name="${i}" value="${esc(s.name)}" maxlength="60"></label><div class="controls" style="margin-top:8px"><button class="btn soft small" onclick="renameSubject(${i})">Rename</button><button class="btn danger small" onclick="deleteSubject(${i})">Delete</button></div></div>`).join('');openSheet(`<div class="row"><div><div class="eyebrow">CURRICULUM</div><h2>Manage subjects</h2><div class="muted">Add any curriculum, exam or personal subject.</div></div><button class="btn light" onclick="closeModal()">Close</button></div><div class="list" style="margin-top:14px">${rows||'<div class="empty">No subjects yet.</div>'}</div><div class="item" style="margin-top:12px"><label>New subject<input class="input" id="newSubjectName" placeholder="e.g. Biology, History, English"></label><button class="btn" style="margin-top:9px" onclick="addSubject()">Add subject</button></div>`)}
function addSubject(){const name=(document.getElementById('newSubjectName')?.value||'').trim();if(!name){toast('Enter a subject name');return}if(subjectList().some(s=>s.name.toLowerCase()===name.toLowerCase())){toast('That subject already exists');return}state.profile.subjects.push({id:'subject-'+uid(),name});save();closeModal();render();toast(`${name} added`)}
function renameSubject(index){const subject=subjectList()[index],name=(document.querySelector(`[data-subject-name="${index}"]`)?.value||'').trim();if(!subject||!name){toast('Enter a valid subject name');return}if(subjectList().some((s,i)=>i!==index&&s.name.toLowerCase()===name.toLowerCase())){toast('That subject already exists');return}const old=subject.name;subject.name=name;state.chapters.forEach(c=>{if(c.subject===old)c.subject=name});state.tests.forEach(t=>{if(t.subject===old)t.subject=name});save();closeModal();render();toast('Subject renamed')}
function deleteSubject(index){const subject=subjectList()[index];if(!subject)return;const count=state.chapters.filter(c=>c.subject===subject.name).length;if(subjectList().length<=1){toast('Keep at least one subject');return}if(!confirm(`Delete ${subject.name}? Its ${count} chapter${count===1?'':'s'} will also be removed.`))return;state.profile.subjects.splice(index,1);state.chapters=state.chapters.filter(c=>c.subject!==subject.name);state.revisions=state.revisions.filter(r=>r.subject!==subject.name);state.mistakes=state.mistakes.filter(m=>m.subject!==subject.name);save();closeModal();render();toast('Subject deleted')}
function addChapter(){openSheet(`<h2>Add chapter</h2><div class="formgrid"><label>Subject<select id="as">${subjectNames().map(s=>`<option>${esc(s)}</option>`).join('')}</select></label><label>Chapter name<input class="input" id="an" placeholder="Chapter or topic"></label></div><div class="controls" style="margin-top:12px"><button class="btn" onclick="saveChapterNew()">Add chapter</button><button class="btn light" onclick="openSubjectManager()">Manage subjects</button></div>`)}
function saveChapterNew(){let name=document.getElementById('an').value.trim();if(!name){toast('Enter a chapter name.');return}state.chapters.push({id:uid(),subject:document.getElementById('as').value,name,status:'Not started',mastery:0,confidence:0,lastStudied:null,streak:0});save();closeModal();render();toast(`${name} added to syllabus`)}
function openAdd(){openSheet(`<h2>Quick add</h2><div class="controls"><button class="btn" onclick="closeModal();addTest()">Test result</button><button class="btn soft" onclick="closeModal();addMistake()">Mistake</button><button class="btn light" onclick="closeModal();addChapter()">Chapter</button></div>`)}
function weeklyReview(){let s=stats(),mins=state.sessions.slice(-20).reduce((a,x)=>a+x.minutes,0),due=state.revisions.filter(r=>!r.done&&r.date<=today()).length;openSheet(`<h2>Weekly review</h2><div class="list"><div class="item"><b>Study volume</b><div class="mini">${mins} minutes in your recent session log.</div></div><div class="item"><b>Current weak area</b><div class="mini">${esc(s.weak[0]?.name||'No weak chapter recorded')} · ${s.weak[0]?.mastery||0}% mastery.</div></div><div class="item"><b>Revision pressure</b><div class="mini">${due} revision checkpoint(s) are due.</div></div></div><p class="quote" style="margin-top:12px">Next week should not simply be “more study.” Increase work on the highest-signal weak areas and reattempt unresolved mistakes.</p><button class="btn" onclick="closeModal()">Done</button>`)}
function openSettings(){openSheet(`<div class="row"><h2>Settings</h2><button class="btn light" onclick="closeModal()">Close</button></div><div class="formgrid"><label>Name<input class="input" id="pn" value="${esc(state.profile.name)}"></label><label>Daily goal (min)<input class="input" id="pg" type="number" min="15" max="600" value="${state.profile.dailyGoal}"></label><label class="full">Exam / curriculum focus<input class="input" id="pe" value="${esc(state.profile.exam)}" placeholder="Optional — e.g. CBSE, GCSE, university, personal"></label><label>Exam date<input class="input" id="pd" type="date" value="${esc(state.profile.examDate||'')}"></label><label>Next actions<input class="input" id="pa" type="number" min="1" max="8" value="${state.profile.actionCount}"></label><label>Focus length (min)<input class="input" id="pf" type="number" min="5" max="120" value="${state.profile.focusMinutes}"></label><label>Plan block max (min)<input class="input" id="pb" type="number" min="5" max="120" value="${state.profile.blockMax}"></label></div><div class="item" style="margin-top:12px"><b>Adaptive engine inputs</b><div class="controls" style="margin-top:9px"><label class="mini"><input id="pr" type="checkbox" ${state.profile.includeRevisions?'checked':''}> Revisions</label><label class="mini"><input id="pm" type="checkbox" ${state.profile.includeMistakes?'checked':''}> Mistakes</label><label class="mini"><input id="pc" type="checkbox" ${state.profile.includeChapters?'checked':''}> Chapters</label></div></div><div class="item" style="margin-top:12px"><b>App Lock (PIN encryption)</b><p class="muted" style="font-size:13px;margin:6px 0 10px">${lockActive?'Your data is encrypted on this device with a PIN.':'Optional: encrypt your data at rest with a PIN. If you forget it, this data cannot be recovered \u2014 export a backup first.'}</p>${lockActive?'<div class="controls"><button class="btn light" onclick="promptChangePin()">Change PIN</button><button class="btn warn" onclick="promptDisableLock()">Remove PIN lock</button></div>':'<div class="controls"><button class="btn" onclick="promptEnableLock()">Set a PIN</button></div>'}</div><div class="controls" style="margin-top:12px"><button class="btn" onclick="saveSettings()">Save settings</button><button class="btn light" onclick="exportData()">Export backup</button><button class="btn warn" onclick="importData()">Import backup</button><button class="btn danger" onclick="resetAll()">Reset app</button></div>`)}
function openActionCustomizer(){
  const actions=Array.isArray(state.profile.customActions)?state.profile.customActions:[];
  const selected=new Set(actions.filter(x=>x.enabled!==false&&x.chapterId).map(x=>x.chapterId));
  const rows=state.chapters.map(c=>`<label class="item" style="display:flex;align-items:center;gap:10px;margin-bottom:7px"><input type="checkbox" class="action-chapter" value="${esc(c.id)}" ${selected.has(c.id)?'checked':''}><span><b>${esc(c.name)}</b><div class="mini">${esc(c.subject)} · ${Number(c.mastery)||0}% mastery</div></span></label>`).join('');
  openSheet(`<div class="row"><div><div class="eyebrow">NEXT BEST ACTIONS</div><h2>Customize actions</h2><div class="muted">Choose chapters you want to keep in your personal action rotation.</div></div><button class="btn light" onclick="closeModal()">Close</button></div><div style="margin-top:14px;max-height:55vh;overflow:auto">${rows||'<div class="empty">Add a chapter first.</div>'}</div><button class="btn" style="margin-top:12px" onclick="saveActionCustomizer()">Save actions</button>`);
}
function saveActionCustomizer(){
  const selected=[...document.querySelectorAll('.action-chapter:checked')].map(x=>x.value).slice(0,8);
  state.profile.customActions=selected.map(id=>({id:'custom-'+id,chapterId:id,enabled:true}));
  save();closeModal();render();toast('Action preferences saved');
}
function openPlanCustomizer(){
  const plan=dailyPlan();
  const rows=plan.slice(0,6).map((x,i)=>`<div class="item" style="margin-bottom:8px"><div class="row"><b>${i+1}. ${esc(x.label)}</b><span class="tag">${x.mins}m</span></div><div class="mini" style="margin-top:5px">${esc(x.reason)}</div></div>`).join('');
  openSheet(`<div class="row"><div><div class="eyebrow">TODAY'S PLAN</div><h2>Customize today's plan</h2><div class="muted">Use Planner Settings to change time, block length and adaptive inputs.</div></div><button class="btn light" onclick="closeModal()">Close</button></div><div style="margin-top:14px">${rows||'<div class="empty">No plan blocks yet.</div>'}</div><div class="controls" style="margin-top:12px"><button class="btn" onclick="openPlannerSettings()">Open planner settings</button><button class="btn light" onclick="closeModal()">Done</button></div>`);
}
function openPlannerSettings(){
  openSheet(`<div class="row"><div><div class="eyebrow">STUDYFLOW SETTINGS</div><h2>Planner settings</h2><div class="muted">Control how many actions and how much study time StudyFlow plans.</div></div><button class="btn light" onclick="closeModal()">Close</button></div><div class="formgrid" style="margin-top:14px"><label>Next actions<input class="input" id="ca" type="number" min="1" max="8" value="${state.profile.actionCount}"></label><label>Plan mode<select class="input" id="cmode"><option value="adaptive" ${state.profile.planMode==='adaptive'?'selected':''}>Adaptive</option><option value="manual" ${state.profile.planMode==='manual'?'selected':''}>Manual</option></select></label><label>Focus length (min)<input class="input" id="cf" type="number" min="5" max="120" value="${state.profile.focusMinutes}"></label><label>Daily goal (min)<input class="input" id="cg" type="number" min="15" max="600" value="${state.profile.dailyGoal}"></label><label>Max block (min)<input class="input" id="cb" type="number" min="5" max="120" value="${state.profile.blockMax}"></label></div><div class="item" style="margin-top:12px"><b>Use these signals</b><div class="controls" style="margin-top:9px"><label class="mini"><input id="cr" type="checkbox" ${state.profile.includeRevisions?'checked':''}> Revisions</label><label class="mini"><input id="cmis" type="checkbox" ${state.profile.includeMistakes?'checked':''}> Mistakes</label><label class="mini"><input id="cch" type="checkbox" ${state.profile.includeChapters?'checked':''}> Chapters</label></div></div><button class="btn" style="margin-top:12px" onclick="savePlannerSettings()">Apply customization</button>`);
}
function savePlannerSettings(){
  state.profile.actionCount=Math.max(1,Math.min(8,Number(document.getElementById('ca').value)||5));
  state.profile.planMode=document.getElementById('cmode').value==='manual'?'manual':'adaptive';
  state.profile.focusMinutes=Math.max(5,Math.min(120,Number(document.getElementById('cf').value)||25));
  state.profile.dailyGoal=Math.max(15,Math.min(600,Number(document.getElementById('cg').value)||90));
  state.profile.blockMax=Math.max(5,Math.min(120,Number(document.getElementById('cb').value)||25));
  state.profile.includeRevisions=document.getElementById('cr').checked;
  state.profile.includeMistakes=document.getElementById('cmis').checked;
  state.profile.includeChapters=document.getElementById('cch').checked;
  timer={on:false,sec:state.profile.focusMinutes*60};
  save();closeModal();render();toast('Planner settings saved');
}
function saveSettings(){
  state.profile.name=(document.getElementById('pn')?.value||'').trim();
  state.profile.examDate=document.getElementById('pd')?.value||'';
  state.profile.dailyGoal=Math.max(15,Math.min(600,Number(document.getElementById('pg')?.value)||90));
  state.profile.actionCount=Math.max(1,Math.min(8,Number(document.getElementById('pa')?.value)||5));
  state.profile.focusMinutes=Math.max(5,Math.min(120,Number(document.getElementById('pf')?.value)||25));
  state.profile.blockMax=Math.max(5,Math.min(120,Number(document.getElementById('pb')?.value)||25));
  state.profile.includeRevisions=!!document.getElementById('pr')?.checked;
  state.profile.includeMistakes=!!document.getElementById('pm')?.checked;
  state.profile.includeChapters=!!document.getElementById('pc')?.checked;
  state.profile.exam=(document.getElementById('pe')?.value||'').trim();
  timer={on:false,sec:state.profile.focusMinutes*60};
  save();closeModal();render();toast('Settings saved');
}
function pilotSummary(){
  const sessions=state.sessions||[], tests=state.tests||[], mistakes=state.mistakes||[], revs=state.revisions||[];
  const totalMinutes=sessions.reduce((a,x)=>a+(Number(x.minutes)||0),0);
  const focusSessions=sessions.filter(x=>(Number(x.minutes)||0)>0).length;
  const days=new Set(sessions.map(x=>x.date)).size;
  const avgSession=focusSessions?Math.round(totalMinutes/focusSessions):0;
  return {schema:'studyflow-pilot-v1',pilotId:state.profile.pilotId||'',consent:!!state.profile.pilotConsent,exportedAt:new Date().toISOString(),metrics:{focusSessions,totalFocusMinutes:totalMinutes,activeStudyDays:days,averageSessionMinutes:avgSession,testsLogged:tests.length,mistakesLogged:mistakes.length,revisionsCompleted:revs.filter(r=>r.done).length,chaptersTracked:state.chapters.length,mastery:stats().avg,streak:currentStreak()}};
}
function exportPilotReport(){
  if(!state.profile.pilotConsent){openPilotSettings();return}
  const report=pilotSummary();
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='studyflow-pilot-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function openPilotSettings(){
  if(!state.profile.pilotId)state.profile.pilotId='SF-'+Math.random().toString(36).slice(2,8).toUpperCase();
  const m=pilotSummary().metrics;
  openSheet(`<div class="row"><div><div class="eyebrow">OPTIONAL PILOT</div><h2>Research & usage report</h2><div class="muted">StudyFlow stays login-free. This report is generated on this device and is only shared when you export it.</div></div><button class="btn light" onclick="closeModal()">Close</button></div>
  <div class="item" style="margin-top:14px"><label class="check"><input id="pilotConsent" type="checkbox" ${state.profile.pilotConsent?'checked':''}> I agree to include these anonymous, aggregated usage metrics in my pilot report.</label><div class="mini" style="margin-top:8px">No name, email, notes, chapter-level records, or detailed academic history are included in the report.</div></div>
  <div class="grid" style="margin-top:12px"><div class="card"><div class="muted">Focus sessions</div><div class="kpi">${m.focusSessions}</div></div><div class="card"><div class="muted">Focus minutes</div><div class="kpi">${m.totalFocusMinutes}</div></div><div class="card"><div class="muted">Study days</div><div class="kpi">${m.activeStudyDays}</div></div><div class="card"><div class="muted">Tests</div><div class="kpi">${m.testsLogged}</div></div></div>
  <div class="controls" style="margin-top:12px"><button class="btn" onclick="savePilotConsent()">Save preference</button><button class="btn light" onclick="exportPilotReport()">Export pilot report</button></div>`);
}
function savePilotConsent(){state.profile.pilotConsent=document.getElementById('pilotConsent').checked;save();closeModal();render()}
function openOnboarding(){
  openSheet(`<div class="onboard"><div class="eyebrow">WELCOME TO STUDYFLOW</div><h2>Build a study system that fits you.</h2><div class="formgrid" style="margin-top:14px"><label>Name (optional)<input class="input" id="obName" placeholder="Your name" value="${esc(state.profile.name||'')}"></label><label>Daily study goal<input class="input" id="obGoal" type="number" min="15" max="600" value="${state.profile.dailyGoal||90}"></label><label class="full">Focus duration<input class="input" id="obFocus" type="number" min="5" max="120" value="${state.profile.focusMinutes||25}"></label></div><div class="item" style="margin-top:14px"><b>Start simple</b><div class="mini" style="margin-top:5px">StudyFlow will use your mastery, revisions, mistakes and test signals to build Today’s Plan. You can customize everything later.</div></div><div class="controls" style="margin-top:14px"><button class="btn" onclick="finishOnboarding()">Start StudyFlow</button><button class="btn light" onclick="skipOnboarding()">Skip setup</button></div></div>`);
}
function finishOnboarding(){state.profile.name=document.getElementById('obName').value.trim();state.profile.dailyGoal=Math.max(15,Math.min(600,Number(document.getElementById('obGoal').value)||90));state.profile.focusMinutes=Math.max(5,Math.min(120,Number(document.getElementById('obFocus').value)||25));state.profile.onboarded=true;save();timer={on:false,sec:state.profile.focusMinutes*60};closeModal();render()}
function skipOnboarding(){state.profile.onboarded=true;save();closeModal();render()}
function exportData(){if(lockActive&&!confirm('App Lock is on, but exported backup files are always plain, unencrypted JSON (so you can restore them without losing your PIN separately). Anyone with this file can read your data. Continue?'))return;let blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='studyflow-final-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);state.profile.lastBackupAt=today();save()}
function maybeSuggestBackup(){try{let last=state.profile.lastBackupAt,days=last?Math.floor((new Date(today())-new Date(last))/86400000):999;if((state.sessions||[]).length>=5&&days>=14)toast('It has been a while since your last backup — Settings → Export backup keeps your data safe.')}catch(e){}}
function importData(){let i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=()=>{let f=i.files[0],r=new FileReader();r.onload=()=>{try{state=migrate(JSON.parse(r.result));save();closeModal();render()}catch(e){toast('Import failed: invalid or unsupported backup.');console.error(e)}};r.readAsText(f)};i.click()}
function resetAll(){
  // Reset immediately. No browser confirm() is used because embedded/file previews
  // can block or ignore native confirmation dialogs.
  try{
    clearInterval(interval); interval=null;
    if(wakeLock){try{wakeLock.release()}catch(e){} wakeLock=null}

    // Remove every locally stored StudyFlow value, including legacy/feature keys.
    try{localStorage.clear()}catch(e){console.warn('localStorage clear failed:',e)}
    try{sessionStorage.clear()}catch(e){}

    // Build a completely fresh state and explicitly empty all user-generated data.
    state=fresh();
    state.profile.onboarded=false;
    state.sessions=[];
    state.completedActions=[];
    state.revisions=[];
    state.mistakes=[];
    state.tests=[];
    state.tasks=[];
    state.weeklyReviews=[];
    state.profile.todayContexts={};
    state.profile.intentions={};
    state.profile.customActions=[];
    state.profile.customPlan=[];
    state.profile.focusChapterId='';

    timer={on:false,sec:(state.profile.focusMinutes||25)*60};
    tab='Today';

    // Persist only the fresh state, then render from that exact in-memory state.
    save();
    closeModal();
    render();
    toast('StudyFlow reset — 0 minutes, 0 books.');
  }catch(e){
    console.error('Reset failed:',e);
    toast('Reset failed. Please reload StudyFlow and try again.');
  }
}
