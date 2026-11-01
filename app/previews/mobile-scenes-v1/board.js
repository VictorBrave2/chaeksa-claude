(() => {
  'use strict';
  const devices = [
    { id: 'small', name: '작은 휴대폰', width: 320, height: 568 },
    { id: 'narrow', name: '좁은 휴대폰', width: 360, height: 740 },
    { id: 'phone', name: '휴대폰', width: 390, height: 844 },
    { id: 'large', name: '큰 휴대폰', width: 430, height: 932 },
    { id: 'fold', name: '펼친 화면', width: 768, height: 900 },
    { id: 'landscape', name: '가로 화면', width: 844, height: 390 }
  ];
  const labels = { library: '정통사주', observatory: '정통자미두수' };
  const grid = document.getElementById('devices');
  const picker = document.getElementById('device-select');
  const direct = document.getElementById('direct-preview');
  const status = document.getElementById('board-status');
  let scene = 'library';
  const cards = devices.map(device => {
    const card = document.createElement('section');
    card.className = 'device-card';
    card.style.setProperty('--device-width', device.width);
    const heading = document.createElement('h2');
    heading.id = 'device-' + device.id;
    heading.append(document.createTextNode(device.name));
    const dimensions = document.createElement('span');
    dimensions.textContent = device.width + ' × ' + device.height;
    heading.append(dimensions);
    card.setAttribute('aria-labelledby', heading.id);
    const viewport = document.createElement('div');
    viewport.className = 'frame-viewport';
    viewport.style.maxWidth = device.width + 'px';
    const frame = document.createElement('iframe');
    frame.width = device.width;
    frame.height = device.height;
    frame.style.width = device.width + 'px';
    frame.style.height = device.height + 'px';
    frame.setAttribute('loading', 'lazy');
    viewport.append(frame);
    const open = document.createElement('a');
    open.className = 'device-open';
    open.target = '_blank';
    open.rel = 'noopener';
    open.textContent = '견본을 새 창으로 열기 ↗';
    card.append(heading, viewport, open);
    grid.append(card);
    return { device, card, viewport, frame, open };
  });
  function resizeFrames() {
    cards.forEach(({ device, card, viewport, frame }) => {
      if (card.hidden) return;
      const scale = Math.min(1, viewport.clientWidth / device.width);
      viewport.style.height = Math.round(device.height * scale) + 'px';
      frame.style.transform = 'scale(' + scale + ')';
    });
  }
  function setScene(next) {
    scene = next;
    document.querySelectorAll('[data-board-scene]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.boardScene === scene));
    });
    cards.forEach(({ device, frame, open }) => {
      frame.title = labels[scene] + ' — ' + device.name + ', ' + device.width + ' × ' + device.height + ' 견본';
      frame.src = 'index.html?scene=' + scene + '&embed=1';
      open.href = 'index.html?scene=' + scene;
    });
    direct.href = 'index.html?scene=' + scene;
    updateStatus();
  }
  function updateStatus() {
    status.textContent = labels[scene] + ' · ' + picker.selectedOptions[0].textContent;
  }
  document.querySelectorAll('[data-board-scene]').forEach(button => {
    button.addEventListener('click', () => setScene(button.dataset.boardScene));
  });
  picker.addEventListener('change', () => {
    cards.forEach(({ device, card }) => { card.hidden = picker.value !== 'all' && picker.value !== device.id; });
    grid.classList.toggle('is-single', picker.value !== 'all');
    updateStatus();
    requestAnimationFrame(resizeFrames);
  });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resizeFrames);
    cards.forEach(({ viewport }) => observer.observe(viewport));
  } else {
    window.addEventListener('resize', resizeFrames);
  }
  setScene(scene);
  resizeFrames();
})();