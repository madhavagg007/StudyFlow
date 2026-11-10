// StudyFlow: Flexible focus timer (countdown, Pomodoro with breaks, stopwatch), pause, extend and finish early
// The clock is derived from timestamps, not from counting ticks, so it stays correct when the tab is throttled.
function timerCfg(){
  const p=state.profile,num=(v,d,lo,hi)=>Math.max(lo,Math.min(hi,Number(v)||d));
  return {
    mode:['countdown','pomodoro','stopwatch'].includes(p.timerMode)?p.timerMode:'countdown',
    focus:num(p.focusMinutes,25,1,240),brk:num(p.breakMinutes,5,1,60),longBrk:num(p.longBreakMinutes,15,1,90),
    every:num(p.cyclesBeforeLong,4,2,10),auto:!!p.autoNext
  };
}
function idleTimer(completed=0){
  const c=timerCfg(),stop=c.mode==='stopwatch';
  return {on:false,paused:false,mode:c.mode,phase:'focus',total:stop?0:c.focus*60,sec:stop?0:c.focus*60,startedAt:0,endAt:0,pausedAt:0,completed};
}
timer=idleTimer();
function elapsedSeconds(){
  if(timer.phase!=='focus')return 0;
  return timer.mode==='stopwatch'?timer.sec:Math.max(0,timer.total-timer.sec);
}
function startPhase(phase){
  const c=timerCfg(),now=Date.now(),carry=timer.completed||0;
  timer.mode=c.mode;timer.phase=phase;timer.on=true;timer.paused=false;timer.pausedAt=0;timer.completed=carry;timer.startedAt=now;
  if(phase==='focus'){
    ['focusLockPageStack','focusPageStack'].forEach(id=>{const s=document.getElementById(id);if(s)s.innerHTML=''});
    if(c.mode==='stopwatch'){timer.total=0;timer.sec=0;timer.endAt=0}
    else{timer.total=c.focus*60;timer.sec=timer.total;timer.endAt=now+timer.total*1000}
  }else{
    timer.total=(phase==='long'?c.longBrk:c.brk)*60;timer.sec=timer.total;timer.endAt=now+timer.total*1000;
  }
  if(!document.getElementById('focusLock')?.classList.contains('open'))enterFocusLock();
  if(phase==='focus')startSound();else stopSound();
  clearInterval(interval);interval=setInterval(tickTimer,500);
  syncFocusLock();focusView();
}
function toggleTimer(){if(timer.on)return;startPhase('focus')}
function resetTimer(){if(timer.on)return;clearInterval(interval);interval=null;timer=idleTimer();focusView()}
function tickTimer(){
  if(!timer.on||timer.paused)return;
  if(timer.mode==='stopwatch'&&timer.phase==='focus'){
    timer.sec=Math.max(0,Math.floor((Date.now()-timer.startedAt)/1000));
  }else{
    timer.sec=Math.max(0,Math.ceil((timer.endAt-Date.now())/1000));
    if(timer.sec<=0){phaseDone();return}
  }
  syncFocusLock();
  const e=document.getElementById('timer');if(e)e.textContent=fmt(timer.sec);
}
function togglePause(){
  if(!timer.on)return;
  if(!timer.paused){
    tickTimer();timer.paused=true;timer.pausedAt=Date.now();pauseSound();
  }else{
    const gap=Date.now()-timer.pausedAt;timer.startedAt+=gap;if(timer.endAt)timer.endAt+=gap;timer.paused=false;timer.pausedAt=0;
    if(timer.phase==='focus')resumeSound();
  }
  syncFocusLock();
}
function extendTimer(min=5){
  if(!timer.on||timer.phase!=='focus'||timer.mode==='stopwatch')return;
  if(timer.total+min*60>240*60){toast('Sessions are capped at 4 hours.');return}
  timer.total+=min*60;timer.endAt+=min*60000;tickTimer();syncFocusLock();toast('Added '+min+' minutes.');
}
function phaseDone(){
  clearInterval(interval);interval=null;
  if(timer.phase==='focus'){
    document.getElementById('focusLockBook')?.classList.add('complete');
    const status=document.getElementById('focusLockBookStatus');if(status)status.textContent='Your book is complete!';
    const mins=Math.round(timer.total/60);
    setTimeout(()=>finishFocus(mins,false),1100);
  }else breakDone(false);
}
function finishFocus(mins,early){
  const pomodoro=timer.mode==='pomodoro';
  recordSession(mins);
  const done=(timer.completed||0)+1;
  stopSound();
  if(pomodoro&&!early){
    const c=timerCfg();timer.completed=done;
    toast('Session logged. Time for a '+(done%c.every===0?'long ':'')+'break.');
    startPhase(done%c.every===0?'long':'short');
  }else{
    endTimerSession(early?'Logged '+mins+' min. A new book was added to your library.':'Focus session complete. A new book was added to your library.');
  }
}
function breakDone(skipped){
  const c=timerCfg();
  if(c.auto){toast(skipped?'Break skipped. Next session started.':'Break over. Next session started.');startPhase('focus')}
  else endTimerSession(skipped?'Break skipped. Ready when you are.':'Break over. Ready for the next session.');
}
function endTimerSession(message){
  clearInterval(interval);interval=null;
  const carry=timerCfg().mode==='pomodoro'?timer.completed||0:0;
  timer=idleTimer(carry);
  exitFocusLock();stopSound();
  if(message)toast(message);
  focusView();
}
function finishTimerEarly(){
  if(!timer.on)return;
  if(timer.phase!=='focus'){clearInterval(interval);breakDone(true);return}
  tickTimer();
  const mins=Math.floor(elapsedSeconds()/60);
  if(mins<1){
    if(!confirm('Less than a minute has passed. Discard this session?'))return;
    endTimerSession('Session discarded.');return;
  }
  clearInterval(interval);interval=null;
  finishFocus(mins,true);
}
function setTimerMode(mode){
  if(timer.on)return;
  state.profile.timerMode=['countdown','pomodoro','stopwatch'].includes(mode)?mode:'countdown';
  save();timer=idleTimer();focusView();
}
function savePomodoro(){
  const g=id=>Number(document.getElementById(id)?.value);
  state.profile.breakMinutes=Math.max(1,Math.min(60,g('pomBreak')||5));
  state.profile.longBreakMinutes=Math.max(1,Math.min(90,g('pomLong')||15));
  state.profile.cyclesBeforeLong=Math.max(2,Math.min(10,g('pomEvery')||4));
  state.profile.autoNext=!!document.getElementById('pomAuto')?.checked;
  save();toast('Pomodoro settings saved');focusView();
}
function recordSession(mins){
  mins=Math.max(1,Math.round(Number(mins)||25));
  const chapterId=state.profile.focusChapterId||'',confidence=Math.max(1,Math.min(5,Number(state.profile.sessionConfidence)||3));
  state.sessions.push({id:uid(),date:today(),minutes:mins,chapterId,confidence,mode:timer.mode||'countdown',taskId:state.profile.focusTaskId||'',completedAt:new Date().toISOString()});
  if(chapterId){
    const c=state.chapters.find(x=>x.id===chapterId);
    if(c){c.lastStudied=today();c.confidence=confidence;c.mastery=Math.min(100,Math.round((Number(c.mastery)||0)+Math.max(1,Math.min(5,Math.round(mins/20)))));c.status=c.mastery>=80?'Strong':c.mastery>0?'Learning':'Not started'}
  }
  save();
}
function logSession(autoComplete=false,minsOverride){
  if(timer.on&&!autoComplete)return;
  recordSession(minsOverride??(Number(state.profile.focusMinutes)||25));
  if(!autoComplete)resetTimer();else{timer=idleTimer();focusView()}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tickTimer()});

function bookProgress(){
  if(!timer.on||timer.phase!=='focus')return 0;
  const stop=timer.mode==='stopwatch',target=stop?Math.max(60,timerCfg().focus*60):Math.max(1,timer.total),el=stop?timer.sec:Math.max(0,target-timer.sec);
  return Math.min(1,el/target);
}
function syncFocusLock(){
  const el=document.getElementById('focusLockTimer');if(el)el.textContent=fmt(timer.sec);
  const lock=document.getElementById('focusLock'),brk=timer.on&&timer.phase!=='focus',cfg=timerCfg();
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v},show=(id,on)=>{const e=document.getElementById(id);if(e)e.style.display=on?'':'none'};
  if(lock){lock.classList.toggle('on-break',brk);lock.classList.toggle('paused',!!timer.paused)}
  set('focusLockBadgeText',brk?(timer.phase==='long'?'LONG BREAK':'BREAK'):timer.paused?'PAUSED':timer.mode==='pomodoro'?'POMODORO '+(((timer.completed||0)%cfg.every)+1)+' OF '+cfg.every:timer.mode==='stopwatch'?'STOPWATCH':'FOCUS LOCK');
  set('focusLockTitle',brk?'Take a breather.':timer.paused?'Paused.':'Stay with one thing.');
  set('focusLockSub',brk?'Stretch, drink some water and rest your eyes.':timer.mode==='stopwatch'?'Finish whenever you are done. Your book grows toward your focus length.':'Stay focused while your study book grows page by page.');
  set('flPause',timer.paused?'Resume':'Pause');
  set('flFinish',brk?'Skip break':timer.mode==='stopwatch'?'Finish and log':'Finish early');
  show('flExtend',timer.on&&timer.phase==='focus'&&timer.mode!=='stopwatch');
  show('flSound',timer.on&&timer.phase==='focus');set('flSound',soundLabel());
  const ch=document.getElementById('focusLockChapter');
  if(ch){const c=state.chapters.find(x=>x.id===state.profile.focusChapterId),tt=taskTitle();ch.innerHTML=c?`<b>${esc(c.name)}</b><div class="mini" style="margin-top:4px">${esc(c.subject)} · ${c.mastery}% mastery</div>`:tt?`<b>${esc(tt)}</b><div class="mini" style="margin-top:4px">Task</div>`:'<b>General study session</b><div class="mini" style="margin-top:4px">Stay with the current task.</div>'}
  updateFocusBook();
}
function pomodoroPanel(cfg){
  return `<div class="focus-panel"><label><span>Break (min)</span><input class="input" id="pomBreak" type="number" min="1" max="60" value="${cfg.brk}" ${timer.on?'disabled':''}></label><label><span>Long break (min)</span><input class="input" id="pomLong" type="number" min="1" max="90" value="${cfg.longBrk}" ${timer.on?'disabled':''}></label><label><span>Long break every</span><input class="input" id="pomEvery" type="number" min="2" max="10" value="${cfg.every}" ${timer.on?'disabled':''}></label><label><span>Auto-start next focus</span><input id="pomAuto" type="checkbox" ${cfg.auto?'checked':''} ${timer.on?'disabled':''}></label></div><div class="controls" style="justify-content:center;margin:8px 0"><button class="btn soft" onclick="savePomodoro()" ${timer.on?'disabled':''}>Save Pomodoro settings</button></div>`;
}
