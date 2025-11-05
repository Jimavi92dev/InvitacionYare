/* ====== CARRUSEL CON EFECTO LIBRO ====== */
const carousel = document.getElementById('carousel');
const slides = Array.from(document.querySelectorAll('.slide'));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let current = 0;
let timerId = null;

function goTo(targetIndex, direction = 'next'){
  if (targetIndex === current) return;
  const currentSlide = slides[current];
  const nextSlide = slides[targetIndex];

  currentSlide.classList.remove('current','turning-prev','turning-next');
  nextSlide.classList.remove('turning-prev','turning-next');
  void currentSlide.offsetWidth;

  currentSlide.classList.add(direction === 'next' ? 'turning-next' : 'turning-prev');
  setTimeout(()=>{
    currentSlide.classList.remove('turning-next','turning-prev');
    nextSlide.classList.add('current');
    current = targetIndex;
    programNextAuto();
  }, 760);
}
function next(){ goTo((current + 1) % slides.length, 'next'); }
function prev(){ goTo((current - 1 + slides.length) % slides.length, 'prev'); }

nextBtn.addEventListener('click', ()=>{ clearTimer(); next(); });
prevBtn.addEventListener('click', ()=>{ clearTimer(); prev(); });

window.addEventListener('keydown', (e)=>{
  if (e.key === 'ArrowRight'){ clearTimer(); next(); }
  if (e.key === 'ArrowLeft'){ clearTimer(); prev(); }
});

/* Gestos táctiles */
(function enableTouch(){
  let startX = 0;
  carousel.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; }, {passive:true});
  carousel.addEventListener('touchend', (e)=>{
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40){ clearTimer(); (dx < 0 ? next() : prev()); }
  }, {passive:true});
})();

/* Auto avance respetando data-duration */
function programNextAuto(){
  clearTimer();
  const dur = parseInt(slides[current].dataset.duration, 10) || 6000;
  timerId = setTimeout(next, dur);
}
function clearTimer(){
  if (timerId){ clearTimeout(timerId); timerId = null; }
}
programNextAuto();

/* ====== PLAYER ====== */
const player = document.getElementById('player');
const audio = document.getElementById('bgMusic');
const btn = document.getElementById('playPause');
const progress = document.getElementById('progress');
const cur = document.getElementById('cur');
const dur = document.getElementById('dur');

function fmt(sec){
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec/60);
  const s = Math.floor(sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}
function setPlayingState(isPlaying){
  if (isPlaying){
    player.classList.add('playing');
    btn.setAttribute('aria-pressed','true');
    btn.setAttribute('aria-label','Pausar');
    btn.querySelector('.icon-play').style.display = 'none';
    btn.querySelector('.icon-pause').style.display = 'block';
  }else{
    player.classList.remove('playing');
    btn.setAttribute('aria-pressed','false');
    btn.setAttribute('aria-label','Reproducir');
    btn.querySelector('.icon-play').style.display = 'block';
    btn.querySelector('.icon-pause').style.display = 'none';
  }
}

btn.addEventListener('click', async ()=>{
  if (audio.paused){
    try{ await audio.play(); setPlayingState(true); }catch(e){ console.warn(e); }
  }else{
    audio.pause(); setPlayingState(false);
  }
});

/* Autoplay silenciado + desmuteo al primer gesto */
async function resumeAudioInteraction(){
  try{
    audio.muted = false;
    if (audio.paused) await audio.play();
    setPlayingState(!audio.paused);
  }catch(e){
    console.warn('Interacción no pudo iniciar audio:', e);
  }finally{
    document.removeEventListener('pointerdown', resumeAudioInteraction);
    document.removeEventListener('click', resumeAudioInteraction);
  }
}
document.addEventListener('pointerdown', resumeAudioInteraction, {once:true});
document.addEventListener('click', resumeAudioInteraction, {once:true});

audio.addEventListener('loadedmetadata', ()=>{ dur.textContent = fmt(audio.duration); });
audio.addEventListener('timeupdate', ()=>{
  cur.textContent = fmt(audio.currentTime);
  dur.textContent = fmt(audio.duration);
  const pct = (audio.currentTime / (audio.duration || 1)) * 100;
  progress.value = pct;
});
audio.addEventListener('ended', ()=>{
  setPlayingState(false);
  progress.value = 0;
  cur.textContent = '0:00';
});
progress.addEventListener('input', ()=>{
  const target = (progress.value/100) * (audio.duration || 0);
  audio.currentTime = target;
});

/* Pausar si se oculta la pestaña (opcional) */
document.addEventListener('visibilitychange', ()=>{
  if (document.hidden && !audio.paused){ audio.pause(); setPlayingState(false); }
});
