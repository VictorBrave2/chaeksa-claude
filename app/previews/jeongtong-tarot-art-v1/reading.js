(() => {
  'use strict';
  const host = document.getElementById('result');
  const originalArt = '../../art/jeongtong-companion/';
  const newArt = '../../art/jeongtong-tarot-v1/';
  const sceneNames = { welcome: '첫', reading: '중간', closing: '마지막' };
  const guideImages = new Map();
  const newLibrary = '../../art/jeongtong-tarot-v1/library.png';
  const originalLibrary = '../../art/desktop-scenes/library-v1.png';
  let selected = new URLSearchParams(location.search).get('art') === 'original' ? 'original' : 'new';
  let loaded = false, requestVersion = 0;
  let companionEnabled = true, companionObserver = null;

  function report(problem, ready) {
    if (window.parent === window) return;
    window.parent.postMessage({
      type: 'chaeksa-art-preview-status', art: selected,
      ready: Boolean(ready), problem: problem || ''
    }, location.origin === 'null' ? '*' : location.origin);
  }

  function artSource(pose) {
    return selected === 'new' ? newArt + pose + '.png' : originalArt + pose + '-v4.png';
  }

  function chooseArt(value) {
    if (value !== 'new' && value !== 'original') return;
    selected = value;
    const version = ++requestVersion;
    guideImages.forEach((image, pose) => {
      const desired = artSource(pose);
      image.closest('.jt-guide-art').hidden = false;
      image.closest('.jt-guide-scene').classList.remove('jt-guide-no-art');
      if (image.getAttribute('src') !== desired) image.src = desired;
    });
    // Only the source changes. Production distance, size, masks and breakpoints remain shared.
    if (selected === 'new') {
      document.body.style.setProperty('--desktop-scene', 'url("' + new URL(newLibrary, location.href).href + '")');
    } else {
      document.body.style.setProperty('--desktop-scene', 'url("' + new URL(originalLibrary, location.href).href + '")');
    }
    if (!loaded) return;
    report('');
    if (selected === 'new') {
      const probe = new Image();
      probe.onload = () => { if (version === requestVersion) report(''); };
      probe.onerror = () => {
        if (version === requestVersion) report('새 배경이 아직 준비되지 않았습니다. 기존 그림으로 비교할 수 있습니다.');
      };
      probe.src = newLibrary;
    }
  }

  // Mirrors the production companion DOM decoration only; no calculation or API wrapper.
  function companion() {
    const story = host.matches('.jtp-story') ? host : host.querySelector('.jtp-story');
    const hero = host.querySelector('.reader-hero>div');
    if (!story || !hero) return;
    story.classList.add('jt-companion');
    story.classList.toggle('jt-companion-on', companionEnabled);

    function scene(parent, nodes, kind, pose) {
      if (!parent || !nodes.length) return;
      const stage = document.createElement('div');
      stage.className = 'jt-guide-scene ' + kind;
      const copy = document.createElement('div');
      copy.className = 'jt-guide-copy';
      parent.insertBefore(stage, nodes[0]);
      nodes.forEach(node => copy.append(node));
      stage.append(copy);
      const art = document.createElement('div');
      art.className = 'jt-guide-art';
      art.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img');
      image.src = artSource(pose);
      image.alt = '';
      image.width = 1254; image.height = 1254;
      image.loading = pose === 'welcome' ? 'eager' : 'lazy';
      image.decoding = 'async';
      guideImages.set(pose, image);
      image.onerror = () => {
        art.hidden = true;
        stage.classList.add('jt-guide-no-art');
        report((selected === 'new' ? '새 ' : '기존 ') + sceneNames[pose]
          + ' 삽화를 불러오지 못했습니다. 새로고침해 주세요.');
      };
      art.append(image); stage.append(art);
    }

    scene(hero, [...hero.children].filter(node => node.matches('.eyebrow,h1,.hero-line,.name-origin,.reader-go')), 'jt-guide-opening', 'welcome');
    const second = host.querySelectorAll('.classic-filter')[1]?.querySelector('.filter-reading');
    if (second) {
      second.classList.add('jt-guide-filter');
      const copy = second.firstElementChild;
      scene(copy, [...copy.children].filter(node => node.matches('.filter-name,h3')), 'jt-guide-transition', 'reading');
    }
    const ending = host.querySelector('.filter-conclusion');
    if (ending) scene(ending, [...ending.children].filter(node => node.matches('.conclusion-seal,p,h2')), 'jt-guide-closing', 'closing');

    const controls = document.createElement('div');
    controls.className = 'jt-guide-controls';
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'jt-guide-toggle';
    function update() {
      story.classList.toggle('jt-companion-on', companionEnabled);
      toggle.setAttribute('aria-pressed', String(companionEnabled));
      toggle.textContent = companionEnabled ? '삽화 숨기기' : '삽화 보기';
    }
    toggle.onclick = () => { companionEnabled = !companionEnabled; update(); };
    update(); controls.append(toggle); hero.prepend(controls);
    if ('IntersectionObserver' in window) {
      companionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          companionObserver.unobserve(entry.target);
        }
      }), { threshold: .15 });
      story.querySelectorAll('.jt-guide-scene').forEach(node => companionObserver.observe(node));
    }
  }

  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== location.origin) return;
    const data = event.data;
    if (data && data.type === 'chaeksa-art-preview') chooseArt(data.art);
  });

  async function mount() {
    try {
      const response = await fetch('../jeongtong-companion/story.json', { credentials: 'omit' });
      if (!response.ok) throw new Error('Saved preview result unavailable');
      const data = await response.json();
      const view = window.ChaeksaJeongtongModelReading.applyModel(data.story);
      window.ChaeksaNameSeason.mount(host, view);
      companion();
      // The fixture and existing renderer are shared. No personal inputs, storage, tracking,
      // calculation APIs, evidence APIs, or production app bootstrap are loaded here.
      host.querySelectorAll('a[href]').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        const destination = new URL(href, new URL('../../', location.href));
        anchor.href = destination.href;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      });
      loaded = true;
      chooseArt(selected);
      report('', true);
    } catch (_) {
      host.innerHTML = '<p class="jtp-loading">견본을 불러오지 못했습니다. 새로고침해 주세요.</p>';
      report('기존 결과 자료를 불러오지 못했습니다. 정적 웹 주소에서 견본을 열어 주세요.');
    }
  }
  mount();
})();
