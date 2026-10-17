// StudyFlow: Optional account sync hook (inactive unless a host provides it)
let cloudDb=null,cloudUid=null,cloudWriting=false,cloudPending=false,cloudTimer=null;
async function initCloudSync(){
  try{
    if(typeof claude==='undefined'||!claude.use)return;
    const userCap=await claude.use('user'),dbCap=await claude.use('db');
    if(!userCap||!dbCap)return;
    const uid=await userCap.id();
    if(!uid)return;
    const ref=dbCap.doc('data/users/'+uid+'/state');
    const snap=await ref.get();
    if(snap.exists){
      const cloud=migrate(snap.data());
      if(!state.savedAt||(cloud.savedAt&&cloud.savedAt>state.savedAt)){state=cloud;localStorage.setItem(KEY,JSON.stringify(state));render()}
    }
    cloudDb=dbCap;cloudUid=uid;
    toast('Cloud sync connected for your account.');
  }catch(e){console.warn('Cloud sync unavailable — continuing with local storage only:',e)}
}
function queueCloudSync(){if(!cloudDb||!cloudUid)return;cloudPending=true;clearTimeout(cloudTimer);cloudTimer=setTimeout(flushCloudSync,1200)}
async function flushCloudSync(){
  if(!cloudDb||!cloudUid||cloudWriting)return;
  cloudWriting=true;cloudPending=false;
  try{await cloudDb.doc('data/users/'+cloudUid+'/state').set(JSON.parse(JSON.stringify(state)))}catch(e){console.warn('Cloud sync write failed:',e)}
  cloudWriting=false;
  if(cloudPending)flushCloudSync();
}
function safeNumber(v,min,max,fallback){let n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
function validateState(){if(!state||typeof state!=='object')state=fresh();state.chapters=Array.isArray(state.chapters)?state.chapters:[];state.revisions=Array.isArray(state.revisions)?state.revisions:[];state.mistakes=Array.isArray(state.mistakes)?state.mistakes:[];state.tests=Array.isArray(state.tests)?state.tests:[];state.sessions=Array.isArray(state.sessions)?state.sessions:[];state.completedActions=Array.isArray(state.completedActions)?state.completedActions:[];state.profile=state.profile||fresh().profile;state.profile.subjects=Array.isArray(state.profile.subjects)&&state.profile.subjects.length?state.profile.subjects:fresh().profile.subjects;state.profile.dailyGoal=safeNumber(state.profile.dailyGoal,15,600,90);state.profile.focusMinutes=safeNumber(state.profile.focusMinutes,5,120,25);state.profile.actionCount=safeNumber(state.profile.actionCount,1,8,5);state.profile.blockMax=safeNumber(state.profile.blockMax,5,120,45);state.profile.todayContexts=(state.profile.todayContexts&&typeof state.profile.todayContexts==='object')?state.profile.todayContexts:{};state.profile.intentions=(state.profile.intentions&&typeof state.profile.intentions==='object')?state.profile.intentions:{};state.profile.customActions=Array.isArray(state.profile.customActions)?state.profile.customActions:[];state.profile.customPlan=Array.isArray(state.profile.customPlan)?state.profile.customPlan:[];state.profile.includeRevisions=state.profile.includeRevisions!==false;state.profile.includeMistakes=state.profile.includeMistakes!==false;state.profile.includeChapters=state.profile.includeChapters!==false;state.profile.planMode=state.profile.planMode==='manual'?'manual':'adaptive';state.profile.focusChapterId=state.profile.focusChapterId||'';state.profile.sessionConfidence=safeNumber(state.profile.sessionConfidence,1,5,3);return state}
state=validateState();
