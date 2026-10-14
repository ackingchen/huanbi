(() => {
  const audio = document.getElementById('huanbi-background-music');
  const button = document.getElementById('huanbi-music-toggle');
  if (!audio || !button) return;

  const label = button.querySelector('span');
  let wantsPlayback = true;
  let pending = false;
  audio.volume = 1;

  function updateButton() {
    const playing = !audio.paused && !audio.error;
    const text = audio.error ? '重试音乐' : playing ? '暂停音乐' : '播放音乐';
    label.textContent = text;
    button.setAttribute('aria-label', text.replace('音乐', '背景音乐'));
    button.setAttribute('aria-pressed', String(playing));
    button.title = audio.error ? '音乐加载失败，点击重试' : button.getAttribute('aria-label');
  }

  async function playMusic() {
    if (!wantsPlayback || pending || !audio.paused) return;
    pending = true;
    try {
      await audio.play();
      if (!wantsPlayback) audio.pause();
    } catch (error) {
      updateButton();
      if (error.name === 'NotAllowedError') {
        button.title = '点击页面即可播放背景音乐';
      } else if (error.name !== 'AbortError') {
        label.textContent = '重试音乐';
        button.setAttribute('aria-label', '重试背景音乐');
        button.title = '音乐暂时无法播放，点击重试';
      }
    } finally {
      pending = false;
    }
  }

  button.addEventListener('click', () => {
    if (!audio.paused) {
      wantsPlayback = false;
      audio.pause();
    } else {
      wantsPlayback = true;
      if (audio.error) audio.load();
      void playMusic();
    }
  });

  for (const event of ['playing', 'pause', 'error']) {
    audio.addEventListener(event, updateButton);
  }
  // Browsers may require one real user action before allowing audible autoplay.
  for (const event of ['click', 'keydown']) {
    document.addEventListener(event, (event) => {
      if (event.isTrusted && !button.contains(event.target)) void playMusic();
    });
  }
  void playMusic();
})();
