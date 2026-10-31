(() => {
  'use strict';
  const frame = document.getElementById('reading-frame');
  const stage = document.getElementById('preview-stage');
  const space = document.getElementById('frame-space');
  const status = document.getElementById('preview-status');
  let art = 'new', device = 'auto', ready = false, problem = '';
  const allowedArt = new Set(['new', 'original']);
  const allowedDevice = new Set(['auto', 'mobile', 'desktop']);

  function describe() {
    if (problem) { status.textContent = problem; return; }
    if (!ready) { status.textContent = '견본을 불러오고 있습니다.'; return; }
    const screen = device === 'mobile' ? '휴대폰 390px' : device === 'desktop' ? 'PC 1440px' : '현재 화면';
    status.textContent = (art === 'new' ? '새 그림' : '기존 그림') + ' · ' + screen + ' · 화면 안을 스크롤해 볼 수 있습니다.';
  }

  function fit() {
    const style = getComputedStyle(stage);
    const width = Math.max(1, stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
    const height = Math.max(1, stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
    const viewportWidth = device === 'mobile' ? 390 : device === 'desktop' ? 1440 : Math.floor(width);
    const scale = Math.min(1, width / viewportWidth);
    const viewportHeight = Math.max(1, Math.floor(height / scale));
    frame.style.width = viewportWidth + 'px';
    frame.style.height = viewportHeight + 'px';
    frame.style.transform = 'scale(' + scale + ')';
    space.style.width = Math.floor(viewportWidth * scale) + 'px';
    space.style.height = Math.floor(viewportHeight * scale) + 'px';
  }

  function tellFrame() {
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: 'chaeksa-art-preview', art }, location.origin === 'null' ? '*' : location.origin);
  }

  document.querySelectorAll('[data-art]').forEach(button => button.addEventListener('click', () => {
    if (!allowedArt.has(button.dataset.art)) return;
    art = button.dataset.art; problem = '';
    document.querySelectorAll('[data-art]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.art === art)));
    tellFrame(); describe();
  }));
  document.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => {
    if (!allowedDevice.has(button.dataset.device)) return;
    device = button.dataset.device;
    document.querySelectorAll('[data-device]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.device === device)));
    fit(); describe();
  }));

  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.type !== 'chaeksa-art-preview-status') return;
    if (data.ready) { ready = true; tellFrame(); }
    if (data.art === art && typeof data.problem === 'string') problem = data.problem;
    describe();
  });
  frame.addEventListener('load', tellFrame);
  window.addEventListener('resize', fit);
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);
  fit(); describe();
})();
