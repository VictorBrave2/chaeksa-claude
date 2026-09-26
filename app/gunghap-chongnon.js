/* 궁합총론 — 화면 (2026-09-23 사장님 「정통사주처럼 궁합총론을 만들자」)
 *
 *   판정엔진(panjeong.js) + 궁합 관점(gunghap-gwanjeom.js) = 이 화면          (법전 63조)
 *
 * 이 파일에는 명리가 없다. 두 분의 생년월일을 받아 관점을 부르고, 관점이 내준 말을 장마다 카드로 그린다.
 * 장을 잇지 않고 끊어 둔다 — 장마다 보는 것이 다르고, 한 글로 이으면 좋다 · 나쁘다로 합쳐진다.
 * LLM 을 부르지 않는다. 전부 미리 써 둔 칸을 엔진 값으로 골라 내는 것이다.
 * 맺음 장이 없다. 13장은 이미 파는 아홉 가지로 가는 길뿐이다.
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine, Q = global.ChaeksaGunghapGwanjeom, PL = global.ChaeksaPlaces;
  if (!E || !Q) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const 오행말 = ['목', '화', '토', '금', '수'];
  const 문단 = (arr) => (arr || []).filter(Boolean).map(t => '<p>' + esc(t) + '</p>').join('');
  const 답칸 = (t) => t ? '<p class="jt-answer">' + esc(t) + '</p>' : '';
  const 흐린 = (arr) => (arr || []).filter(Boolean).map(t => '<p class="jt-yet">' + esc(t) + '</p>').join('');

  function 명식표(R) {
    const Pp = R.pillars, gods = (R.analysis && R.analysis.gods) || {}, 순 = ['hour', 'day', 'month', 'year'], 머리 = { hour: '시', day: '일', month: '월', year: '연' };
    const 칸 = (k, 줄) => {
      const p = Pp[k];
      if (!p) return 줄 === 'gan' || 줄 === 'ji' ? '<td class="jt-' + 줄 + '" style="color:var(--ink3)">&nbsp;<small>모름</small></td>' : '<td class="jt-god"></td>';
      if (줄 === 'top') return '<td class="jt-god">' + (k === 'day' ? '이 사람' : esc((gods[k] || {}).stem || '')) + '</td>';
      if (줄 === 'gan') return '<td class="jt-gan e' + E.STEM_ELEM[p.stem] + (k === 'day' ? ' jt-me' : '') + '">' + E.STEMS[p.stem] + '<small>' + E.STEMS_KO[p.stem] + 오행말[E.STEM_ELEM[p.stem]] + '</small></td>';
      if (줄 === 'ji') return '<td class="jt-ji e' + E.BRANCH_ELEM[p.branch] + '">' + E.BRANCHES[p.branch] + '<small>' + E.BRANCHES_KO[p.branch] + 오행말[E.BRANCH_ELEM[p.branch]] + '</small></td>';
      return '<td class="jt-god">' + esc((gods[k] || {}).branch || '') + '</td>';
    };
    const 줄 = (종류) => '<tr>' + 순.map(k => 칸(k, 종류)).join('') + '</tr>';
    return '<table class="jt-table"><tr>' + 순.map(k => '<th>' + 머리[k] + '</th>').join('') + '</tr>' + 줄('top') + 줄('gan') + 줄('ji') + 줄('bot') + '</table>';
  }

  const 오행줄 = (센) => '<div class="jt-oh">' + 센.map((n, o) => '<span class="e' + o + '"><b>' + 오행말[o] + '</b>' + n + '자</span>').join('') + '</div>';
  const 원문칸 = (x) => '<blockquote class="jt-q"><p>' + esc(x[0]) + '</p><p>「' + esc(x[1]) + '」</p></blockquote>';
  const 살칸 = (x) => '<div class="jt-du"><div class="jt-du-h"><b>' + esc(x.이름) + '</b><span>' + esc(x.글[0]) + '</span></div>' + 문단((x.줄 || []).concat([x.글[3]])) + '<blockquote class="jt-q"><p>삼명통회 ' + esc(x.글[1]) + '</p><p>「' + esc(x.글[2]) + '」</p></blockquote></div>';
  const 두칸 = (나, 그, 속나, 속그) => '<div class="gc-two">'
    + '<div class="gc-col"><div class="gc-who">나</div>' + (속나 || '') + 문단(나) + '</div>'
    + '<div class="gc-col"><div class="gc-who">그 사람</div>' + (속그 || '') + 문단(그) + '</div></div>';

  // 09-24 사장님 「통설로 콘텐츠를 만들면 재미없지」 — 웹 통설 줄과 통설 칸을 걷는다. 원문 · 계산 줄만 낸다.
  const 통설말 = /고들 해요|는 말이 많아요|말도 있어요|따라다녀요|요즘 명리가들|두루 하는 말|통설/;
  const 거름 = (줄) => Array.isArray(줄) ? 줄.filter(t => typeof t !== 'string' || !통설말.test(t)) : 줄;
  function 칸그리기(v0, 속나, 속그) {
    const v = Object.assign({}, v0, { 머리: 거름(v0.머리), 나: 거름(v0.나), 그: 거름(v0.그), 사이: 거름(v0.사이), 갈림: 거름(v0.갈림), 비움: 거름(v0.비움), 통설: [] });
    const out = [];
    if (v.답) out.push(답칸(v.답));   // 09-27 장마다 첫 줄 = 1층 답 한 줄(관점이 이미 잰 값에서). 근거는 그 아래 그대로.
    if (v.머리 && v.머리.length) out.push(문단(v.머리));
    if (v.원문 && v.원문.length) out.push(v.원문.map(원문칸).join(''));
    if ((v.나 && v.나.length) || (v.그 && v.그.length) || 속나 || 속그) out.push(두칸(v.나, v.그, 속나, 속그));
    if (v.사이 && v.사이.length) out.push('<h3>두 사람 사이</h3>' + 문단(v.사이));
    if (v.갈림 && v.갈림.length) out.push(문단(v.갈림));
    if (v.통설 && v.통설.length) out.push('<h3>요즘은 이렇게들 말해요</h3>' + 문단(v.통설) + '<p class="jt-yet">' + esc(Q.통설주) + '</p>');
    if (v.비움 && v.비움.length) out.push('<h3>여기서 안 낸 것</h3>' + 흐린(v.비움));
    return out.join('');
  }

  const 장목록 = [];
  const 장 = (번호, 제목, 부제, 속) => {
    장목록.push([번호, 제목]);
    return '<details class="card jt-ch" id="gcCh' + 번호 + '"' + (번호 === 1 ? ' open' : '') + '><summary><span class="jt-no">제 ' + 번호 + '장</span><h2>' + esc(제목) + '</h2>' + (부제 ? '<p class="jt-sub">' + esc(부제) + '</p>' : '') + '</summary>' + 속 + '</details>';
  };
  const 목차 = () => '<nav class="card jt-toc"><div class="jt-no">목차</div>' + 장목록.map(([n, t]) => '<a href="#gcCh' + n + '" data-ch="' + n + '"><b>' + n + '</b>' + esc(t) + '</a>').join('') + '</nav>';

  function 그리기(box, 입력나, 입력그) {
    let C; try { C = Q.바탕(입력나, 입력그); } catch (e) { box.innerHTML = '<p class="hint">이 생년월일은 계산하지 못했어요.</p>'; return; }
    const out = []; 장목록.length = 0;
    // 장마다 따로 감싼다 — 한 장이 죽어도 나머지 장은 나온다.
    const 안전 = (번호, 제목, 부제, 짓기) => {
      let 속; try { 속 = 짓기(); } catch (e) { 속 = '<p class="jt-yet">이 장을 지금 그리지 못했어요. 잠시 뒤에 다시 열어 주세요.</p>'; if (global.console) console.warn('궁합총론 ' + 번호 + '장', e); }
      out.push(장(번호, 제목, 부제, 속));
    };

    안전(1, '두 사람의 여덟 글자', '나란히 놓고 보면 어떤 기운이 가장 센가', () => {
      const v = Q.장1(C);
      return 칸그리기(v, 명식표(C.나.R) + '<h3>오행이 몇 글자씩</h3>' + 오행줄(v.오행.나), 명식표(C.그.R) + '<h3>오행이 몇 글자씩</h3>' + 오행줄(v.오행.그));
    });
    안전(2, '두 사람을 뜻하는 글자', '나를 뜻하는 글자 둘이 만나면 서로 어떻게 되나', () => 칸그리기(Q.장2(C)));
    안전(3, '배우자 자리끼리', '두 사람의 태어난 날의 글자가 붙나 부딪히나', () => 칸그리기(Q.장3(C)));
    안전(4, '각자의 배우자 자리', '각자 어떤 사람에게 끌리나', () => 칸그리기(Q.장4(C)));
    안전(5, '배우자별', '짝을 뜻하는 글자가 각자의 사주에 있나', () => 칸그리기(Q.장5(C)));
    안전(6, '계절', '서로에게 가장 필요한 기운을 상대가 가졌나', () => 칸그리기(Q.장6(C)));
    안전(7, '그 사람이 곁에 오면', '내 모습이 그대로인가, 바뀌나', () => 칸그리기(Q.장7(C)));
    안전(8, '신살과 귀인', '각자의 신살 · 귀인, 그리고 상대의 글자가 나에게 무엇이 되나', () => {
      const v = Q.장8(C);
      const 벌 = (x) => (x.살.length || x.귀.length ? x.살.concat(x.귀).map(살칸).join('') : '<p class="jt-yet">책이 꼽은 것 가운데 이 글자들에 있는 것은 없어요.</p>');
      return 칸그리기(v, 벌(v.살귀.나), 벌(v.살귀.그));
    });
    안전(9, '그 사람 안의 나, 내 안의 그 사람', '서로의 사주 안에서 상대를 뜻하는 글자가 어떤 모습인가', () => 칸그리기(Q.장9(C)));
    안전(10, '돈과 활동', '누가 먼저 일을 만들고, 돈은 어떤 모양인가', () => 칸그리기(Q.장10(C)));
    안전(11, '10년마다 바뀌는 운', '두 사람의 10년을 나란히', () => {
      const v = Q.장11(C);
      // 정통사주 11장처럼 — 지금 대운은 다 펴고, 나머지는 앞 세 줄만 보이고 뒤는 접는다
      const 접어 = (d) => (d.지금 || d.줄.length <= 3) ? 문단(d.줄) : 문단(d.줄.slice(0, 3)) + '<details class="jt-more"><summary>이 10년에 만나는 글자 ' + (d.줄.length - 3) + '줄 더 보기</summary>' + 문단(d.줄.slice(3)) + '</details>';
      const 벌 = (list) => list ? list.map(d => '<div class="jt-du' + (d.지금 ? ' now' : '') + '"><div class="jt-du-h"><b>' + esc(d.나이) + '</b><span>' + esc(d.간지) + ' · ' + d.시작해 + '년부터</span>' + (d.지금 ? '<i>지금</i>' : '') + '</div>' + 접어(d) + '</div>').join('') : '<p class="jt-yet">성별을 넣으면 보여요.</p>';
      // 09-27 사장님 「대운칸 삭제하자」 — 두 사람 10년 목록은 걷고 첫 줄(지금 10년) 답만
      return 칸그리기(Object.assign({}, v, { 머리: [] }), null, null);
    });
    안전(12, '앞으로 다섯 해', '같은 해에 두 사람에게 오는 것', () => {
      const v = Q.장12(C);
      return 답칸(v.답) + 문단(v.머리) + v.해들.map(y => '<div class="jt-du"><div class="jt-du-h"><b>' + y.해 + '년</b><span>' + esc(y.간지) + '</span></div>'
        + '<div class="gc-two"><div class="gc-col"><div class="gc-who">나</div>' + 문단(y.나) + '</div><div class="gc-col"><div class="gc-who">그 사람</div>' + 문단(y.그) + '</div></div></div>').join('')
        + '<h3>여기서 안 낸 것</h3>' + 흐린(v.비움);
    });
    안전(13, '더 묻고 싶으면', '', () => {
      const v = Q.장13();
      return 문단(v.머리) + '<div class="gc-links">' + v.길.map(([t, h]) => '<a href="' + h + '">' + esc(t) + '</a>').join('') + '</div>';
    });

    box.innerHTML = 목차() + out.join('');
    box.querySelectorAll('.jt-toc a').forEach(a => a.addEventListener('click', () => { const d = box.querySelector('#gcCh' + a.dataset.ch); if (d) d.open = true; }));
  }

  function 세우기() {
    const box = document.getElementById('gcOut'), f = document.getElementById('gcForm');
    if (!box || !f) return;
    const q = (id) => document.getElementById(id);
    ['gcPlaceA', 'gcPlaceB'].forEach(id => { if (PL && q(id)) q(id).innerHTML = PL.options(); });
    // 앱에 이미 넣어 둔 내 생년월일이 있으면 「나」 칸을 미리 채운다
    let p = null; try { p = JSON.parse(localStorage.getItem('chaeksa.profile') || 'null'); } catch (e) {}
    if (p && p.year) {
      q('gcDateA').value = p.year + '-' + String(p.month).padStart(2, '0') + '-' + String(p.day).padStart(2, '0');
      if (!p.noTime && p.hour != null && p.hour !== '') q('gcTimeA').value = String(p.hour).padStart(2, '0') + ':' + String(p.minute || 0).padStart(2, '0');
      else if (q('gcNoTimeA')) q('gcNoTimeA').checked = true;
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
  global.ChaeksaGunghapChongnon = { 그리기 };
})(window);
