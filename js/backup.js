// StudyFlow: Encrypted backups for your own cloud (zero-knowledge: the passphrase never leaves the device)
// File format: { format, v, kdf, iter, salt, iv, data, created } with AES-GCM; the header is authenticated.
const BACKUP_FORMAT='studyflow-backup',BACKUP_ITER=250000,BACKUP_AAD='studyflow-backup:v1';
function bkB64e(buf){let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}
function bkB64d(str){return Uint8Array.from(atob(str),c=>c.charCodeAt(0))}
async function bkKey(pass,salt,iter){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function backupEncrypt(data,pass){
  if(!pass||pass.length<8)throw new Error('Passphrase must be at least 8 characters');
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await bkKey(pass,salt,BACKUP_ITER);
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(BACKUP_AAD)},key,new TextEncoder().encode(JSON.stringify(data)));
  return {format:BACKUP_FORMAT,v:1,kdf:'PBKDF2-SHA256',iter:BACKUP_ITER,salt:bkB64e(salt),iv:bkB64e(iv),data:bkB64e(ct),created:new Date().toISOString()};
}
async function backupDecrypt(env,pass){
  if(!env||env.format!==BACKUP_FORMAT||env.v!==1)throw new Error('Not a StudyFlow encrypted backup');
  const iter=Number(env.iter);
  if(!(iter>=100000&&iter<=2000000))throw new Error('Unsupported backup settings');
  const key=await bkKey(pass,bkB64d(env.salt),iter);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:bkB64d(env.iv),additionalData:new TextEncoder().encode(BACKUP_AAD)},key,bkB64d(env.data));
  return JSON.parse(new TextDecoder().decode(pt));
}
function openCloudBackup(){
  openSheet(`<div class="row"><h2>Encrypted cloud backup</h2><button class="btn light" onclick="closeModal()">Close</button></div>
<p class="muted">Your data is encrypted on this device with your passphrase, then saved to a file you keep in your own cloud (Google Drive, iCloud, Dropbox). The cloud only ever sees scrambled data. <b>If you forget the passphrase, the backup cannot be recovered.</b></p>
<div class="eyebrow" style="margin-top:12px">BACK UP</div>
<div class="formgrid"><label>Passphrase (8+ characters)<input class="input" id="bkPass" type="password" autocomplete="new-password"></label><label>Repeat passphrase<input class="input" id="bkPass2" type="password" autocomplete="new-password"></label></div>
<div class="controls" style="margin-top:10px"><button class="btn" onclick="runCloudBackup()">Create encrypted backup</button></div>
<div class="mini" id="bkMsg" style="min-height:18px;margin-top:8px"></div>
<div class="eyebrow" style="margin-top:14px">RESTORE</div>
<div class="formgrid"><label>Backup file<input class="input" id="bkFile" type="file" accept=".sfbackup,.json,application/json"></label><label>Passphrase<input class="input" id="bkPass3" type="password" autocomplete="off"></label></div>
<div class="controls" style="margin-top:10px"><button class="btn warn" onclick="runCloudRestore()">Restore and replace my data</button></div>`);
}
function bkMsg(t,bad){const e=document.getElementById('bkMsg');if(e){e.textContent=t;e.style.color=bad?'#b65d4b':''}}
async function runCloudBackup(){
  const p1=document.getElementById('bkPass')?.value||'',p2=document.getElementById('bkPass2')?.value||'';
  if(p1.length<8){bkMsg('Use a passphrase of at least 8 characters.',true);return}
  if(p1!==p2){bkMsg('The passphrases do not match.',true);return}
  try{
    bkMsg('Encrypting…');
    const env=await backupEncrypt(state,p1),name='studyflow-'+today()+'.sfbackup',blob=new Blob([JSON.stringify(env)],{type:'application/json'});
    let shared=false;
    try{
      const file=new File([blob],name,{type:'application/json'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'StudyFlow encrypted backup'});shared=true}
    }catch(e){if(e&&e.name==='AbortError'){bkMsg('Cancelled.');return}}
    if(!shared){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
    state.profile.lastBackupAt=today();state.profile.lastCloudBackupAt=today();save();
    bkMsg(shared?'Backup ready. Save it to your cloud app.':'Downloaded. Upload the file to your cloud storage.');
    toast('Encrypted backup created.');
  }catch(e){console.error(e);bkMsg('Backup failed. Please try again.',true)}
}
async function runCloudRestore(){
  const file=document.getElementById('bkFile')?.files?.[0],pass=document.getElementById('bkPass3')?.value||'';
  if(!file){bkMsg('Choose a backup file first.',true);return}
  if(!pass){bkMsg('Enter the backup passphrase.',true);return}
  let env;
  try{env=JSON.parse(await file.text())}catch(e){bkMsg('That file is not a valid backup.',true);return}
  let data;
  try{data=await backupDecrypt(env,pass)}catch(e){bkMsg(e&&/Not a StudyFlow|Unsupported/.test(e.message)?e.message+'.':'Wrong passphrase or damaged file.',true);return}
  if(!confirm('Replace all current data with this backup?'))return;
  try{
    state=migrate(data);state=validateState();timer=idleTimer();save();closeModal();render();applyTheme();toast('Backup restored.');
  }catch(e){console.error(e);toast('Restore failed: backup data is not compatible.')}
}
if(typeof module!=='undefined'&&module.exports)module.exports={backupEncrypt,backupDecrypt};
