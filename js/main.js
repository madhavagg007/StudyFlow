// StudyFlow: Error reporting and application boot
window.addEventListener('error', function(e){ console.error('StudyFlow error:', e.error || e.message); });
window.addEventListener('unhandledrejection', function(e){ console.error('StudyFlow promise error:', e.reason); });
if(lockedEnvelope){document.getElementById('lockScreen').style.display='flex';setTimeout(()=>document.getElementById('lockPin')?.focus(),50)}else{state=validateState();save();render();applyTheme();if(!state.profile.onboarded)setTimeout(openOnboarding,180);else setTimeout(maybeSuggestBackup,2500);setTimeout(initCloudSync,300)}
