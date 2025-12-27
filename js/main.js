document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card');
  const audioCache = new Map();
  let currentAudio = null;

  function getAudio(src){
    if(audioCache.has(src)) return audioCache.get(src);
    const a = new Audio(src);
    a.preload = 'auto';
    audioCache.set(src,a);
    return a;
  }

  function playAudio(src){
    try{
      if(currentAudio && !currentAudio.paused){
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      const a = getAudio(src);
      currentAudio = a;
      a.currentTime = 0;
      a.play().catch(()=>{
        // play may be blocked until user interaction; already triggered by click
      });
    }catch(e){
      console.error('播放音频失败', e);
    }
  }

  cards.forEach(card => {
    const src = card.dataset.audio;
    card.addEventListener('click', () => playAudio(src));
    card.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        playAudio(src);
      }
    });
  });
});
