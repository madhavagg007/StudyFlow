// StudyFlow: Ambient focus soundscapes synthesized with the Web Audio API (no audio files, works offline)
const SOUNDSCAPES=[
  {id:'rain',name:'Rain'},{id:'ocean',name:'Ocean waves'},{id:'wind',name:'Forest wind'},
  {id:'cafe',name:'Café murmur'},{id:'brown',name:'Brown noise'},{id:'white',name:'White noise'}
];
let audioCtx=null,audioGraph=null,soundOn=false,soundPreview=false;
function audioContext(){
  if(audioCtx)return audioCtx;
  const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!AC)return null;
  try{audioCtx=new AC()}catch(e){audioCtx=null}
  return audioCtx;
}
function noiseBuffer(ctx,kind){
  const rate=ctx.sampleRate||44100,len=rate*4,buf=ctx.createBuffer(1,len,rate),d=buf.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,last=0;
  for(let i=0;i<len;i++){
    const w=Math.random()*2-1;
    if(kind==='white')d[i]=w*.5;
    else if(kind==='brown'){last=(last+.02*w)/1.02;d[i]=last*3.5}
    else{ // pink (Paul Kellet)
      b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;
      d[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926;
    }
  }
  return buf;
}
function noiseSource(ctx,kind){const s=ctx.createBufferSource();s.buffer=noiseBuffer(ctx,kind);s.loop=true;return s}
function lfo(ctx,rate,depth,target){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=rate;g.gain.value=depth;o.connect(g);g.connect(target);o.start();return o}
function buildSoundscape(ctx,id,out){
  const nodes=[],src=(k)=>{const s=noiseSource(ctx,k);nodes.push(s);return s};
  if(id==='rain'){
    const s=src('white'),hp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter(),g=ctx.createGain();
    hp.type='highpass';hp.frequency.value=900;lp.type='lowpass';lp.frequency.value=9000;g.gain.value=.55;
    s.connect(hp);hp.connect(lp);lp.connect(g);g.connect(out);
    const r=src('brown'),rl=ctx.createBiquadFilter(),rg=ctx.createGain();rl.type='lowpass';rl.frequency.value=380;rg.gain.value=.5;r.connect(rl);rl.connect(rg);rg.connect(out);
  }else if(id==='ocean'){
    const s=src('brown'),lp=ctx.createBiquadFilter(),g=ctx.createGain();
    lp.type='lowpass';lp.frequency.value=700;g.gain.value=.55;s.connect(lp);lp.connect(g);g.connect(out);
    nodes.push(lfo(ctx,.11,.35,g.gain));
  }else if(id==='wind'){
    const s=src('pink'),bp=ctx.createBiquadFilter(),g=ctx.createGain();
    bp.type='bandpass';bp.frequency.value=480;bp.Q.value=.8;g.gain.value=1.1;s.connect(bp);bp.connect(g);g.connect(out);
    nodes.push(lfo(ctx,.07,260,bp.frequency),lfo(ctx,.13,.25,g.gain));
  }else if(id==='cafe'){
    const s=src('pink'),bp=ctx.createBiquadFilter(),g=ctx.createGain();
    bp.type='bandpass';bp.frequency.value=720;bp.Q.value=.6;g.gain.value=.9;s.connect(bp);bp.connect(g);g.connect(out);
    const s2=src('pink'),b2=ctx.createBiquadFilter(),g2=ctx.createGain();
    b2.type='bandpass';b2.frequency.value=1700;b2.Q.value=1.2;g2.gain.value=.25;s2.connect(b2);b2.connect(g2);g2.connect(out);
    nodes.push(lfo(ctx,.32,.18,g.gain),lfo(ctx,.21,.12,g2.gain));
  }else if(id==='brown'){
    const s=src('brown'),g=ctx.createGain();g.gain.value=.9;s.connect(g);g.connect(out);
  }else{
    const s=src('white'),lp=ctx.createBiquadFilter(),g=ctx.createGain();lp.type='lowpass';lp.frequency.value=8000;g.gain.value=.4;s.connect(lp);lp.connect(g);g.connect(out);
  }
  nodes.filter(n=>n.buffer!==undefined).forEach(n=>n.start());
  return nodes;
}
function soundVolume(){return Math.max(0,Math.min(100,Number(state.profile.soundVolume)))/100}
function playSound(id){
  const ctx=audioContext();if(!ctx||!id)return false;
  stopSoundNow();
  try{if(ctx.resume)ctx.resume()}catch(e){}
  const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
  const nodes=buildSoundscape(ctx,id,master);
  master.gain.linearRampToValueAtTime(soundVolume()*.6,(ctx.currentTime||0)+1.2);
  audioGraph={id,master,nodes};soundOn=true;return true;
}
function stopSoundNow(){
  if(!audioGraph)return;
  const g=audioGraph;audioGraph=null;soundOn=false;
  try{g.master.gain.cancelScheduledValues&&g.master.gain.cancelScheduledValues(0)}catch(e){}
  g.nodes.forEach(n=>{try{n.stop()}catch(e){}});
  try{g.master.disconnect()}catch(e){}
}
function startSound(){if(state.profile.sound)playSound(state.profile.sound)}
function stopSound(){soundPreview=false;stopSoundNow()}
function pauseSound(){if(audioCtx&&audioGraph&&audioCtx.suspend)try{audioCtx.suspend()}catch(e){}}
function resumeSound(){if(audioCtx&&audioGraph&&audioCtx.resume)try{audioCtx.resume()}catch(e){}}
function setSound(id){
  state.profile.sound=SOUNDSCAPES.some(s=>s.id===id)?id:'';save();
  if(timer.on&&timer.phase==='focus'){state.profile.sound?playSound(state.profile.sound):stopSoundNow()}
  else if(soundPreview){state.profile.sound?playSound(state.profile.sound):stopSound()}
  syncFocusLock();
}
function setSoundVolume(v){
  state.profile.soundVolume=Math.max(0,Math.min(100,Number(v)||0));
  if(audioGraph)try{audioGraph.master.gain.linearRampToValueAtTime(soundVolume()*.6,(audioCtx.currentTime||0)+.1)}catch(e){}
  save();
}
function previewSound(){
  if(timer.on)return;
  if(soundPreview){stopSound();focusView();return}
  if(!state.profile.sound){toast('Choose a soundscape first.');return}
  if(playSound(state.profile.sound)){soundPreview=true}else toast('Audio is not available in this browser.');
  focusView();
}
function toggleSoundNow(){
  if(!timer.on||timer.phase!=='focus')return;
  if(audioGraph){stopSoundNow()}
  else{
    const id=state.profile.sound||SOUNDSCAPES[0].id;
    if(!state.profile.sound){state.profile.sound=id;save()}
    playSound(id);
  }
  syncFocusLock();
}
function soundLabel(){const s=SOUNDSCAPES.find(x=>x.id===state.profile.sound);return audioGraph&&s?'Sound: '+s.name:'Sound off'}

function soundPanel(){
  return `<div class="focus-panel"><label><span>Ambient sound</span><select class="input" id="soundSel" onchange="setSound(this.value)"><option value="">Off</option>${SOUNDSCAPES.map(s=>`<option value="${s.id}" ${state.profile.sound===s.id?'selected':''}>${s.name}</option>`).join('')}</select></label><label><span>Volume</span><input id="soundVol" type="range" min="0" max="100" value="${Number(state.profile.soundVolume)||0}" oninput="setSoundVolume(this.value)"></label></div><div class="controls" style="justify-content:center;margin:6px 0"><button class="btn light" onclick="previewSound()" ${timer.on?'disabled':''}>${soundPreview?'Stop preview':'Preview sound'}</button></div>`;
}
