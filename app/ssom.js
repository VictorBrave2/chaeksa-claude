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
    // 첫 줄(굵은 요약)과 끝 줄(굵은 맺음)은 따로 꾸민다 — 문장이 한 덩어리로 보이던 것(09-24)
    const 칸 = (글) => 글.map((t, j) => { let h = 줄(t);
      if (j === 0 && /^\*\*/.test(t)) h = h.replace('<p>', '<p class="ss-lead">');
      else if (j === 글.length - 1 && /^\*\*/.test(t)) h = h.replace('<p>', '<p class="ss-end">');
      return h; }).join('');
    const 반응원고 = (global.ChaeksaSsomBanung || {})[z.키] || {};
    const 반응칸 = (i) => !S.반응틀[i] ? '' : '<div class="ss-act"><p class="ss-ask">' + esc(S.반응물음[i]) + '</p><div class="ss-btns">'
      + S.반응틀[i].map(r => '<button type="button" class="ss-r" data-q="' + i + '" data-r="' + esc(r) + '">' + esc(r) + '</button>').join('') + '</div><div class="ss-next"></div></div>';
    const 기록 = S.기록(z.키), 끝기록 = 기록[기록.length - 1];
    const 이어 = 끝기록 ? '<div class="card ss-log"><p>지난번 기록 — ' + esc(끝기록.때) + ' · ' + (끝기록.장 + 1) + '장 「' + esc(S.질문[끝기록.장]) + '」에 <b>' + esc(끝기록.반응) + '</b></p><p class="ss-why">그다음 수는 그 장 아래에 다시 적어 두었어요. 기록은 이 기기에만 남아요.</p></div>' : '';
    const 장면단추 = '<button type="button" class="btn" id="ssVn" style="width:100%;margin:6px 0 4px">장면으로 보기 — 책사가 한 장씩 들려 드려요</button>';
    box.innerHTML = 근거 + 이어 + 장면단추 + S.질문.map((q, i) => '<details class="ss-q card"' + (i === 0 || (끝기록 && 끝기록.장 === i) ? ' open' : '') + ' data-i="' + i + '"><summary>' + (i + 1) + '. ' + esc(q) + '</summary>' + 칸(원고[i] || []) + 반응칸(i) + '</details>').join('');
    // 대사 상자마다 복사 단추 — 카톡에 바로 붙여 넣게
    box.querySelectorAll('.ss-say').forEach(p => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ss-copy'; b.textContent = '복사';
      b.onclick = () => { const t = p.textContent.replace(/^(당신|상대):\s*/, '').replace(/복사(했어요)?$/, '').replace(/[“”]/g, '').trim(); try { navigator.clipboard.writeText(t); b.textContent = '복사했어요'; } catch (e) {} }; p.appendChild(b); });
    const 보이기 = (i, r, 적) => {
      const d = box.querySelector('details[data-i="' + i + '"]'); if (!d) return;
      d.querySelectorAll('.ss-r').forEach(x => x.classList.toggle('on', x.dataset.r === r));
      const 글 = (반응원고[i] || {})[r];
      d.querySelector('.ss-next').innerHTML = 글 ? 칸(글) : '<p class="ss-why">이 반응에 이어지는 글은 쓰고 있어요.</p>';
      d.querySelectorAll('.ss-next .ss-say').forEach(p => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ss-copy'; b.textContent = '복사';
        b.onclick = () => { try { navigator.clipboard.writeText(p.textContent.replace(/복사(했어요)?$/, '').replace(/[“”]/g, '').trim()); b.textContent = '복사했어요'; } catch (e) {} }; p.appendChild(b); });
      if (적) S.적기(z.키, i, r);
    };
    box.querySelectorAll('.ss-r').forEach(b => b.onclick = () => 보이기(+b.dataset.q, b.dataset.r, true));
    if (끝기록) 보이기(끝기록.장, 끝기록.반응, false);
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
      그리기(box, a, b);
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 세우기); else 세우기();
  global.ChaeksaSsomPage = { 그리기 };
})(window);
