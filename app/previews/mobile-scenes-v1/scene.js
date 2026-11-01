/* Preview controls only. No account, personal data, calculation or app engine. */
(() => {
  'use strict';
  const root = document.documentElement;
  const panels = [...document.querySelectorAll('[data-scene-panel]')];
  const links = [...document.querySelectorAll('[data-scene-link]')];
  const labels = { library: '정통사주', observatory: '정통자미두수' };
  const params = new URLSearchParams(location.search);
  if (params.get('embed') === '1') root.classList.add('embedded');
  function showScene(name) {
    const scene = Object.hasOwn(labels, name) ? name : 'library';
    root.dataset.scene = scene;
    panels.forEach(panel => { panel.hidden = panel.dataset.scenePanel !== scene; });
    links.forEach(link => {
      if (link.dataset.sceneLink === scene) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = labels[scene] + ' · 모바일 배경 견본 · 책사';
  }
  links.forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const url = new URL(location.href);
    url.searchParams.set('scene', link.dataset.sceneLink);
    url.hash = '';
    history.replaceState(null, '', url);
    showScene(link.dataset.sceneLink);
  }));
  const fontButton = document.getElementById('font-toggle');
  fontButton.addEventListener('click', () => {
    const large = root.classList.toggle('large-type');
    fontButton.setAttribute('aria-pressed', String(large));
    fontButton.textContent = large ? '글자 기본 크기' : '글자 크게';
  });
  const artButton = document.getElementById('art-toggle');
  artButton.addEventListener('click', () => {
    const hidden = root.classList.toggle('no-art');
    artButton.setAttribute('aria-pressed', String(hidden));
    artButton.textContent = hidden ? '그림 보이기' : '그림 숨기기';
  });
  document.querySelectorAll('.scene-art img').forEach(image => {
    const failed = () => {
      image.parentElement.classList.add('is-unavailable');
      image.parentElement.querySelector('.art-fallback').hidden = false;
    };
    image.addEventListener('error', failed);
    image.addEventListener('load', () => {
      image.parentElement.classList.remove('is-unavailable');
      image.parentElement.querySelector('.art-fallback').hidden = true;
    });
    if (image.complete && image.naturalWidth === 0) failed();
  });
  document.querySelectorAll('.ending-art img').forEach(image => {
    const failed = () => image.parentElement.classList.add('is-unavailable');
    image.addEventListener('error', failed);
    image.addEventListener('load', () => image.parentElement.classList.remove('is-unavailable'));
    if (image.complete && image.naturalWidth === 0) failed();
  });
  showScene(params.get('scene'));
})();