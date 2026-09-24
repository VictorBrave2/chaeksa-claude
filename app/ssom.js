/* 썸 궁합 화면 — 명리는 ssom-gwanjeom.js(72조), 글은 ssom-wongo.js. 이 파일은 그리기만 한다. */
(function (global) {
  const E = global.ChaeksaEngine, S = global.ChaeksaSsom, W = global.ChaeksaSsomWongo || {}, PL = global.ChaeksaPlaces;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const 줄 = (t) => {
    const 굵 = (x) => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    return t.indexOf('> ') === 0 ? '<p class="ss-say">' + 굵(t.slice(2)) + '</p>' : '<p>' + 굵(t) + '</p>';
  };
  const 식상말 = (x) => x.키 === '없음' ? '식신 · 상관이 둘 다 없어요' : [x.식신 && E.STEMS_KO[E.STEMS.indexOf(x.식신)] + '(' + x.식신 + ') 식신', x.상관 && E.STEMS_KO[E.STEMS.indexOf(x.상관)] + '(' + x.상관 + ') 상관'].filter(Boolean).join(' · ') + (x.식신 && x.상관 ? '이 함께 있어요' : '만 있어요');
  const 지말 = (b) => E.BRANCHES_KO[E.BRANCHES.indexOf(b)] + '(' + b + ')';

  // 흐름(09-24 사장님 전략): 1 나를 알고 · 2 그 사람을 알고 · 3 우리 둘의 주고받음 · 4 때 · 5 안고 갈 것, 맞춰 갈 것.
  // opts.만난 = { y, m } — 언제 만났나(소개팅 · 첫 연락 · 사귄 달). 없으면 4 칸은 넣는 법만 알려 준다.
  const G이름 = (g) => E.STEMS_KO[E.STEMS.indexOf(g)] + '(' + g + ')';
  function 그리기(box, a, b, opts) {
    opts = opts || {};
    let 나R, 그R; try { 나R = E.calc(a); 그R = E.calc(b); } catch (e) { box.innerHTML = '<p class="hint">이 생년월일은 계산하지 못했어요.</p>'; return; }
    const z = S.짝(나R, 그R), 원고 = W[z.키];
    const 바람 = global.ChaeksaSsomBaram || {}, 줌 = global.ChaeksaSsomJuneun || {}, 닿 = global.ChaeksaSsomDaeum || {}, 맞 = (global.ChaeksaSsomMatchum || {})[z.키];
    const 칸 = (글) => 글.map((t, j) => { let h = 줄(t);
      if (j === 0 && /^\*\*/.test(t)) h = h.replace('<p>', '<p class="ss-lead">');
      else if (j === 글.length - 1 && /^\*\*/.test(t)) h = h.replace('<p>', '<p class="ss-end">');
      return h; }).join('');
    const 바꿔 = (글, 표) => 글.map(t => Object.keys(표).reduce((x, k) => x.split(k).join(표[k]), t));
    const 근거 = '<div class="card"><p class="ss-why">나는 ' + esc(z.나쪽.일주) + ' 일주, 일지 ' + 지말(z.나쪽.일지) + '는 나에게 ' + esc(z.나쪽.일지십신) + '이고, 식상은 ' + esc(식상말(z.나식상)) + '.<br>그 사람은 ' + esc(z.그쪽.일주) + ' 일주, 일지 ' + 지말(z.그쪽.일지) + '는 그 사람에게 ' + esc(z.그쪽.일지십신) + '이고, 식상은 ' + esc(식상말(z.그식상)) + '.<br>'
      + '일지는 어떤 사람을 바라는지, 식상은 상대를 어떻게 대하는지예요. 글은 두 분 일주와 식상을 바탕으로 풀어 쓴 해석이고, 장면과 대사는 이해를 돕는 예시예요.</p></div>';
    // 1 · 2 — 바라는 사랑(일주) + 주는 사랑(식상)
    const 알기칸 = (번, R, 주, 머리) => {
      const 일주 = S.일주(R), 언 = S.언행(R), 바 = 바람[일주], 누가 = 주 === '당신' ? '내가' : '그 사람이';
      // 주는 사랑 = 언행 조각(식신 → 상관) + 생색 한 줄(72조 ⑥)
      const 생 = global.ChaeksaSsomSaengsaek || {}, 조각 = 언.map(x => 줌[x.키]);
      const 주는 = !언.length ? { 제목: '언행으로는 단서가 적어요', 줄: 생.없음 || [] }
        : 조각.every(Boolean) ? { 제목: 조각.map(x => x.제목).join(' · '), 줄: [].concat(...조각.map(x => x.줄), (언.some(x => x.드러남) ? 생.드러남 : 생.숨음) || []) } : null;
      const 속 = '<h4 class="ss-sub">' + 누가 + ' 바라는 사랑</h4>' + (바 ? '<p class="ss-lead">' + esc(바.제목) + '</p>' + 칸(바꿔(바.줄, { '{주}': 주 })) : '<p class="ss-why">' + esc(일주) + ' 일주의 글은 쓰고 있어요.</p>')
        + '<h4 class="ss-sub">' + 누가 + ' 주는 사랑</h4>' + (주는 ? '<p class="ss-lead">' + esc(주는.제목) + '</p>' + 칸(바꿔(주는.줄, { '{주}': 주 })) : '<p class="ss-why">이 식상 구성의 글은 쓰고 있어요.</p>');
      return '<details class="ss-q card ss-baram"' + (번 === 1 ? ' open' : '') + '><summary>' + 번 + '. ' + 머리 + '</summary>' + 속 + '</details>';
    };
    // 3 — 주고받음: 두 방향 닿음
    const 닿칸 = (받R, 줌R, 받, 주는이) => { const k = S.닿음키(받R, 줌R), d = 닿[k];
      const 머리 = (받 === '당신' ? '내가 바라는 것' : '그 사람이 바라는 것') + ' ← ' + (주는이 === '당신' ? '내가 주는 것' : '그 사람이 주는 것');
      return '<div class="ss-daeum"><p class="ss-ask">' + esc(머리) + (d ? ' — <b>' + esc(d.말) + '</b>' : '') + '</p>' + (d ? 칸(바꿔(d.줄, { '{받}': 받, '{줌}': 주는이 })) : '<p class="ss-why">이 짝(' + esc(k) + ')의 글은 쓰고 있어요.</p>') + '</div>'; };
    const 주고받음 = '<details class="ss-q card"><summary>3. 우리 둘의 주고받음</summary>' + 닿칸(나R, 그R, '당신', '그 사람') + 닿칸(그R, 나R, '그 사람', '당신') + '</details>';
    // 4 — 때: 만난 달과 지금. 사실만 — 뜻은 사장님 조문 대기
    const 지금 = new Date();
    const 상태말 = (t, 주) => {
      const 온 = t.온.filter((x, i, arr) => arr.findIndex(y => y.글자 === x.글자 && y.층 === x.층) === i);
      const 있말 = { '없음': '식신도 상관도 없어요', '식신만': '식신만 있어요', '상관만': '상관만 있어요', '둘 다': '식신과 상관이 둘 다 있어요' };
      const 식줄 = t.원구성 === t.구성 ? '식상은 타고난 그대로 ' + 있말[t.구성] + '.'
        : '식상은 타고나기로 ' + 있말[t.원구성].replace(/어요$/, '는데') + ', 이때는 ' + 온.map(x => x.층 + '의 ' + G이름(x.글자) + ' ' + x.십신).join(' · ') + '이 들어와 ' + 있말[t.구성] + '.';
      const 묶줄 = t.묶임.length ? ' 천간의 ' + t.묶임.map(x => G이름(x.글자) + ' ' + x.십신).join(' · ') + '이 운에 묶여 제 노릇을 못 해요.' : '';
      const 지줄 = t.충.length ? '일지 ' + 지말(t.일지) + '는 ' + t.충.map(x => x.층 + ' ' + 지말(x.운지)).join(' · ') + '와 부딪혀 흔들리는 때예요.'
        : t.합.length ? '일지 ' + 지말(t.일지) + '는 ' + t.합.map(x => x.층 + ' ' + 지말(x.운지)).join(' · ') + '와 합으로 묶이는 때예요.' : '일지 ' + 지말(t.일지) + '는 운에 흔들리지 않아요.';
      return '<p><b>' + esc(주) + '</b> — ' + esc(식줄 + 묶줄 + ' ' + 지줄) + '</p>'; };
    let 때칸;
    if (opts.만난 && opts.만난.y && opts.만난.m) {
      // 층별 풀이(대운 = 바탕 · 세운 = 모양 · 월운 = 밀려남, 언행은 드러남/속으로) — ssom-gwanjeom 때풀이 · 때견줌
      const 풀 = (R, y, m) => S.때풀이(R, y, m), 지y = 지금.getFullYear(), 지m = 지금.getMonth() + 1;
      const 사람칸 = (x, 주) => '<p><b>' + esc(주) + '</b></p>' + (x.바람.length ? x.바람 : ['바라는 마음은 운에 흔들리지 않고 타고난 그대로예요.']).map(t => '<p>' + esc(t) + '</p>').join('')
        + (x.언.length ? x.언.map(v => '<p>' + esc(v.말) + '</p>').join('') : '<p>언행은 타고난 그대로예요.</p>');
      const 그때 = [풀(나R, opts.만난.y, opts.만난.m), 풀(그R, opts.만난.y, opts.만난.m)], 이제 = [풀(나R, 지y, 지m), 풀(그R, 지y, 지m)];
      때칸 = '<h4 class="ss-sub">만난 때 — ' + opts.만난.y + '년 ' + opts.만난.m + '월</h4>' + 사람칸(그때[0], '당신') + 사람칸(그때[1], '그 사람')
        + '<h4 class="ss-sub">지금 — ' + 지y + '년 ' + 지m + '월</h4>' + 사람칸(이제[0], '당신') + 사람칸(이제[1], '그 사람')
        + '<h4 class="ss-sub">그때와 지금</h4>' + [['당신', 0, 나R], ['그 사람', 1, 그R]].map(([n, i, R]) => '<p><b>' + n + '</b> — ' + esc(S.때견줌(R, 그때[i], 이제[i]).join(' ')) + '</p>').join('');
    } else 때칸 = '<p class="ss-why">두 분이 처음 만난 달을 넣으면, 그때와 지금 두 분의 식상과 일지가 어떻게 달라졌는지 보여 드려요.</p>';
    const 때 = '<details class="ss-q card"' + (opts.만난 ? ' open' : '') + '><summary>4. 때 — 만난 달과 지금</summary>' + 때칸 + '</details>';
    // 5 — 안고 갈 것, 맞춰 갈 것
    const 끝 = '<details class="ss-q card"><summary>5. 안고 갈 것, 맞춰 갈 것</summary>' + (맞
      ? '<h4 class="ss-sub">안고 갈 것 — 쉽게 안 바뀌어요</h4>' + 맞.안고.map(t => '<p>' + esc(t) + '</p>').join('') + '<h4 class="ss-sub">맞춰 갈 것 — 말 한마디, 방식 하나로 달라져요</h4>' + 맞.맞춰.map(t => '<p>' + esc(t) + '</p>').join('') + '<p class="ss-why">안고 갈지, 못 안고 갈지는 두 분이 정해요.</p>'
      : '<p class="ss-why">두 분 조합의 글은 쓰고 있어요.</p>') + '</details>';
    // 지금 단계의 질문 여섯
    const 반응원고 = (global.ChaeksaSsomBanung || {})[z.키] || {};
    const 반응칸 = (i) => !S.반응틀[i] ? '' : '<div class="ss-act"><p class="ss-ask">' + esc(S.반응물음[i]) + '</p><div class="ss-btns">'
      + S.반응틀[i].map(r => '<button type="button" class="ss-r" data-q="' + i + '" data-r="' + esc(r) + '">' + esc(r) + '</button>').join('') + '</div><div class="ss-next"></div></div>';
    const 기록 = S.기록(z.키), 끝기록 = 기록[기록.length - 1];
    const 이어 = 끝기록 ? '<div class="card ss-log"><p>지난번 기록 — ' + esc(끝기록.때) + ' · 「' + esc(S.질문[끝기록.장]) + '」에 <b>' + esc(끝기록.반응) + '</b></p><p class="ss-why">기록은 이 기기에만 남아요.</p></div>' : '';
    const 단계표 = (global.ChaeksaSsomDangye || {}), 단계 = opts.단계 || '썸', 단계칸 = (단계표.단계 || []).find(x => x.키 === 단계);
    if (단계 !== '썸' && 단계칸) {
      const 글들 = ((단계표.원고 || {})[z.키] || {})[단계];
      const 단질 = '<h3 class="ss-part">지금 단계의 질문 — ' + esc(단계칸.이름) + '</h3>' + (글들
        ? 단계칸.질문.map((q, i) => '<details class="ss-q card"><summary>' + esc(q) + '</summary>' + 칸(글들[i] || ['이 질문의 글은 쓰고 있어요.']) + '</details>').join('')
        : '<div class="card"><p>이 단계에서 두 분 조합의 글은 아직 쓰고 있어요.</p><p class="ss-why">질문: ' + esc(단계칸.질문.join(' · ')) + '</p></div>');
      box.innerHTML = 근거 + 알기칸(1, 나R, '당신', '나를 알고') + 알기칸(2, 그R, '그 사람', '그 사람을 알고') + 주고받음 + 때 + 끝 + 단질;
      box.querySelectorAll('.ss-say').forEach(p => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ss-copy'; b.textContent = '복사';
        b.onclick = () => { try { navigator.clipboard.writeText(p.textContent.replace(/복사(했어요)?$/, '').replace(/[“”]/g, '').trim()); b.textContent = '복사했어요'; } catch (e) {} }; p.appendChild(b); });
      return;
    }
    const 질문들 = 원고
      ? '<h3 class="ss-part">지금 단계의 질문 — 막 썸을 시작했어요</h3>' + 이어 + '<button type="button" class="btn" id="ssVn" style="width:100%;margin:6px 0 4px">장면으로 보기 — 책사가 한 장씩 들려 드려요</button>'
        + S.질문.map((q, i) => '<details class="ss-q card"' + ((끝기록 && 끝기록.장 === i) ? ' open' : '') + ' data-i="' + i + '"><summary>' + esc(q) + '</summary>' + 칸(원고[i] || []) + 반응칸(i) + '</details>').join('')
      : '<h3 class="ss-part">지금 단계의 질문</h3><div class="card"><p>두 분 조합의 질문 글은 아직 쓰고 있어요.</p></div>';
    box.innerHTML = 근거 + 알기칸(1, 나R, '당신', '나를 알고') + 알기칸(2, 그R, '그 사람', '그 사람을 알고') + 주고받음 + 때 + 끝 + 질문들;
    // 대사 상자마다 복사 단추
    const 복사단추 = (root) => root.querySelectorAll('.ss-say').forEach(p => { if (p.querySelector('.ss-copy')) return; const b = document.createElement('button'); b.type = 'button'; b.className = 'ss-copy'; b.textContent = '복사';
      b.onclick = () => { const t = p.textContent.replace(/^(당신|상대):\s*/, '').replace(/복사(했어요)?$/, '').replace(/[“”]/g, '').trim(); try { navigator.clipboard.writeText(t); b.textContent = '복사했어요'; } catch (e) {} }; p.appendChild(b); });
    복사단추(box);
    const 보이기 = (i, r, 적) => {
      const d = box.querySelector('details[data-i="' + i + '"]'); if (!d) return;
      d.querySelectorAll('.ss-r').forEach(x => x.classList.toggle('on', x.dataset.r === r));
      const 글 = (반응원고[i] || {})[r];
      d.querySelector('.ss-next').innerHTML = 글 ? 칸(글) : '<p class="ss-why">이 반응에 이어지는 글은 쓰고 있어요.</p>';
      복사단추(d);
      if (적) S.적기(z.키, i, r);
    };
    box.querySelectorAll('.ss-r').forEach(b => b.onclick = () => 보이기(+b.dataset.q, b.dataset.r, true));
    if (끝기록 && 원고) 보이기(끝기록.장, 끝기록.반응, false);
    const vn = box.querySelector('#ssVn');
    if (vn) vn.onclick = () => { try { sessionStorage.setItem('chaeksa.ssomVn', JSON.stringify({ 키: z.키 })); } catch (e) {} location.href = 'ssom-vn.html'; };
  }

  function 세우기() {
    const box = document.getElementById('gcOut'), f = document.getElementById('gcForm');
    if (!box || !f) return;
    const q = (id) => document.getElementById(id);
    ['gcPlaceA', 'gcPlaceB'].forEach(id => { if (PL && q(id)) q(id).innerHTML = PL.options(); });
    let p = null; try { p = JSON.parse(localStorage.getItem('chaeksa.profile') || 'null'); } catch (e) {}
    if (p && p.year) {
      q('gcDateA').value = p.year + '-' + String(p.month).padStart(2, '0') + '-' + String(p.day).padStart(2, '0');
      if (!p.noTime && p.hour != null && p.hour !== '') q('gcTimeA').value = String(p.hour).padStart(2, '0') + ':' + String(p.minute || 0).padStart(2, '0');
      q('gcGA').value = p.gender === 'M' ? 'M' : 'F';
    }
    const 잠금 = (n) => { const c = q('gcNoTime' + n); if (c) q('gcTime' + n).disabled = c.checked; };
    ['A', 'B'].forEach(n => { const c = q('gcNoTime' + n); if (c) { c.addEventListener('change', () => 잠금(n)); 잠금(n); } });
    const 읽기 = (n) => {
      const [y, m, d] = (q('gcDate' + n).value || '').split('-').map(Number);
      const [hh, mi] = (q('gcTime' + n).value || '12:00').split(':').map(Number);
      if (!y || !m || !d) return null;
      const 모름 = !!(q('gcNoTime' + n) && q('gcNoTime' + n).checked);
      const 곳 = PL ? PL.resolve(q('gcPlace' + n).value) : { lon: 126.98, tzOffset: null };
      return { year: y, month: m, day: d, hour: 모름 ? null : hh, minute: 모름 ? 0 : (mi || 0), gender: q('gcG' + n).value || null, longitude: 곳.lon, tzOffset: 곳.tzOffset };
    };
    f.onsubmit = (e) => {
      e.preventDefault();
      const a = 읽기('A'), b = 읽기('B');
      if (!a || !b) return;
      const mv = (q('gcMet') && q('gcMet').value || '').split('-').map(Number);
      그리기(box, a, b, { 만난: mv[0] ? { y: mv[0], m: mv[1] } : null, 단계: (q('gcStage') && q('gcStage').value) || '썸' });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 세우기); else 세우기();
  global.ChaeksaSsomPage = { 그리기 };
})(window);
