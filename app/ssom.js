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

  function 그리기(box, a, b) {
    let 나R, 그R; try { 나R = E.calc(a); 그R = E.calc(b); } catch (e) { box.innerHTML = '<p class="hint">이 생년월일은 계산하지 못했어요.</p>'; return; }
    const z = S.짝(나R, 그R), 원고 = W[z.키];
    const 근거 = '<div class="card"><p class="ss-why">나는 일지 ' + 지말(z.나쪽.일지) + ', 식상은 ' + esc(식상말(z.나식상)) + '.<br>그 사람은 일지 ' + 지말(z.그쪽.일지) + ', 식상은 ' + esc(식상말(z.그식상)) + '.<br>'
      + '일지는 어떤 사람을 바라는지, 식상은 상대를 어떻게 대하는지예요. 글 속 장면과 대사는 이해를 돕는 예시예요.</p></div>';
    if (!원고) {
      box.innerHTML = 근거 + '<div class="card"><p>두 분 조합의 글은 아직 쓰고 있어요. 조합마다 사람이 쓰고 검수한 글만 내놓아서, 다 채우기까지 시간이 걸려요.</p><p class="ss-why">조합 ' + esc(z.키) + '</p></div>';
      return;
    }
    box.innerHTML = 근거 + S.질문.map((q, i) => '<details class="ss-q card"' + (i === 0 ? ' open' : '') + '><summary>' + (i + 1) + '. ' + esc(q) + '</summary>' + (원고[i] || []).map(줄).join('') + '</details>').join('');
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
      그리기(box, a, b);
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 세우기); else 세우기();
  global.ChaeksaSsomPage = { 그리기 };
})(window);
