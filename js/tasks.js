// StudyFlow: Built-in task lists (multiple lists, due dates, link a task to a focus session)
function ensureTaskLists(){
  if(!Array.isArray(state.taskLists))state.taskLists=[];
  if(!state.taskLists.length)state.taskLists.push({id:'inbox',name:'Inbox',tasks:[]});
  if(!state.taskLists.some(l=>l.id===state.profile.activeTaskList))state.profile.activeTaskList=state.taskLists[0].id;
  return state.taskLists;
}
function activeTaskList(){ensureTaskLists();return state.taskLists.find(l=>l.id===state.profile.activeTaskList)||state.taskLists[0]}
function findTask(id){for(const l of ensureTaskLists()){const t=l.tasks.find(x=>x.id===id);if(t)return {list:l,task:t}}return null}
function taskTitle(){const f=state.profile.focusTaskId?findTask(state.profile.focusTaskId):null;return f?f.task.text:''}
function sortedTasks(list){
  const open=list.tasks.filter(t=>!t.done).sort((a,b)=>(a.due||'9999-99-99')<(b.due||'9999-99-99')?-1:(a.due||'9999-99-99')>(b.due||'9999-99-99')?1:(a.created||'')<(b.created||'')?-1:1);
  return {open,done:list.tasks.filter(t=>t.done)};
}
function taskRow(t){
  const late=!t.done&&t.due&&t.due<today(),today_=!t.done&&t.due===today();
  return `<div class="task-line ${t.done?'task-complete':''}"><button class="task-check ${t.done?'done':''}" onclick="toggleTask('${t.id}')" aria-label="${t.done?'Mark not done':'Mark done'}">${t.done?'✓':''}</button><div class="task-copy"><b>${esc(t.text)}</b>${t.due?`<div class="mini" style="${late?'color:#b65d4b':''}">${late?'Overdue · ':today_?'Today · ':'Due '}${esc(t.due)}</div>`:''}</div>${t.done?'':`<button class="btn light task-mini" onclick="focusTask('${t.id}')">Focus</button>`}<button class="task-del" onclick="deleteTask('${t.id}')" aria-label="Delete task">×</button></div>`;
}
function tasksView(){
  ensureTaskLists();
  const list=activeTaskList(),{open,done}=sortedTasks(list),total=list.tasks.length,pct=total?Math.round(done.length/total*100):0;
  document.getElementById('app').innerHTML=`<div class="row"><div><h2>Tasks</h2><div class="muted">${open.length?open.length+' to do':'Nothing pending'} in ${esc(list.name)}.</div></div><div class="controls"><button class="btn light" onclick="addTaskList()">+ New list</button></div></div>
<div class="task-lists" role="tablist">${state.taskLists.map(l=>`<button class="focus-preset ${l.id===list.id?'active':''}" onclick="selectTaskList('${l.id}')">${esc(l.name)} <span class="mini">${l.tasks.filter(t=>!t.done).length}</span></button>`).join('')}</div>
<section class="card" style="margin-top:12px"><div class="task-add"><input class="input" id="taskNew" placeholder="Add a task and press Enter" maxlength="140" onkeydown="if(event.key==='Enter')addTask()"><input class="input" id="taskDue" type="date" aria-label="Due date"><button class="btn" onclick="addTask()">Add</button></div>
${total?`<div class="bar" style="margin-top:12px"><div class="fill" style="width:${pct}%"></div></div><div class="mini" style="margin-top:6px">${done.length} of ${total} done</div>`:''}
<div style="margin-top:8px">${open.map(taskRow).join('')||`<div class="empty">${total?'All done. Nice work.':'No tasks yet. Add your first one above.'}</div>`}</div>
${done.length?`<div class="eyebrow" style="margin-top:14px">COMPLETED</div>${done.map(taskRow).join('')}<div class="controls" style="margin-top:10px"><button class="btn light" onclick="clearDoneTasks()">Clear completed</button></div>`:''}
<div class="controls" style="margin-top:14px"><button class="btn light" onclick="renameTaskList()">Rename list</button>${state.taskLists.length>1?'<button class="btn warn" onclick="deleteTaskList()">Delete list</button>':''}</div></section>`;
}
function addTask(){
  const el=document.getElementById('taskNew'),text=(el?.value||'').trim();
  if(!text){toast('Type a task first.');return}
  activeTaskList().tasks.push({id:uid(),text:text.slice(0,140),done:false,due:document.getElementById('taskDue')?.value||'',created:new Date().toISOString()});
  save();tasksView();document.getElementById('taskNew')?.focus();
}
function toggleTask(id){
  const f=findTask(id);if(!f)return;
  f.task.done=!f.task.done;f.task.doneAt=f.task.done?today():'';
  if(f.task.done&&state.profile.focusTaskId===id)state.profile.focusTaskId='';
  save();tasksView();
}
function deleteTask(id){
  const f=findTask(id);if(!f)return;
  f.list.tasks=f.list.tasks.filter(t=>t.id!==id);
  if(state.profile.focusTaskId===id)state.profile.focusTaskId='';
  save();tasksView();
}
function clearDoneTasks(){const l=activeTaskList(),n=l.tasks.filter(t=>t.done).length;if(!n)return;l.tasks=l.tasks.filter(t=>!t.done);save();toast(n+' completed task'+(n>1?'s':'')+' cleared.');tasksView()}
function selectTaskList(id){state.profile.activeTaskList=id;save();tasksView()}
function addTaskList(){
  const name=(prompt('Name your new list:')||'').trim().slice(0,40);
  if(!name)return;
  const l={id:uid(),name,tasks:[]};state.taskLists.push(l);state.profile.activeTaskList=l.id;save();tasksView();
}
function renameTaskList(){
  const l=activeTaskList(),name=(prompt('Rename list:',l.name)||'').trim().slice(0,40);
  if(!name)return;l.name=name;save();tasksView();
}
function deleteTaskList(){
  const l=activeTaskList();
  if(state.taskLists.length<2||!confirm('Delete "'+l.name+'" and its '+l.tasks.length+' task(s)?'))return;
  if(l.tasks.some(t=>t.id===state.profile.focusTaskId))state.profile.focusTaskId='';
  state.taskLists=state.taskLists.filter(x=>x.id!==l.id);state.profile.activeTaskList=state.taskLists[0].id;save();tasksView();
}
function focusTask(id){if(timer.on||!findTask(id))return;state.profile.focusTaskId=id;save();go('Focus')}
function clearFocusTask(){if(timer.on)return;state.profile.focusTaskId='';save();focusView()}
function completeFocusTask(){const id=state.profile.focusTaskId;if(!id||!findTask(id))return;toggleTask(id);focusView();toast('Task marked done.')}

function taskChip(f){
  return f?`<div class="target-strip"><b>${esc(f.task.text)}</b><span>Task · ${esc(f.list.name)}</span><span class="task-chip-actions"><button class="btn soft task-mini" onclick="completeFocusTask()" ${timer.on?'disabled':''}>Mark done</button> <button class="btn light task-mini" onclick="clearFocusTask()" ${timer.on?'disabled':''}>Clear</button></span></div>`:'';
}
