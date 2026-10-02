/* 출산택일 시뮬레이터 — 화면 (법전 60 · 63조, 2026-09-17)
 *
 *   판정엔진(panjeong.js)  +  출산택일 관점(gwanjeom.js)  =  이 화면
 *
 * **이 파일에는 명리가 한 줄도 없다.** 하는 일은 셋뿐이다 —
 *   ① 고른 날을 열두 시진의 시계 시각으로 나눈다(진태양시 보정은 엔진이 낸 값 그대로)
 *   ② 시진마다 엔진을 부르고 관점에 읽힌다
 *   ③ 관점이 내준 말을 그린다
 * 점수 · 순위 · 등수를 내지 않는다(60조). 줄은 「궁통보감 · 자평진전 모두 걸리는 것 없음」이라는 조건으로만 거른다(65조 — 적천수는 보조지표라 거르지 않는다).
 *
 * 왜 지었나: 네이버 택일 글이 「들어와서 확인하라」고 하는데 확인할 화면이 없었다 — 첫 방문 61명에 생년월일을 넣은 사람 넷(09-17 실측).
 * 부모가 보고 싶은 것은 「내가 고른 시각에 낳으면 이 아이를 어떻게 보나」다(사장님 09-17 「시뮬레이션 도구를 만들어 줘야 할 듯」).
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine, P = global.ChaeksaPanjeong, W = global.ChaeksaGwanjeom, PL = global.ChaeksaPlaces;
  if (!E || !P || !W) return;

  const 두 = (n) => (n < 10 ? '0' : '') + n;
  const 시각 = (m) => { m = ((m % 1440) + 1440) % 1440; return 두(Math.floor(m / 60)) + ':' + 두(m % 60); };
  const 간지말 = (p) => E.STEMS_KO[p.stem] + E.BRANCHES_KO[p.branch] + '(' + E.STEMS[p.stem] + E.BRANCHES[p.branch] + ')';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** 하루를 시진 창으로 나눠 창마다 엔진 + 관점. 자시는 하루에 두 번 걸린다(새벽 앞 · 밤 끝) — 밤 11시 반 넘어 낳으면 다음 날 일주다. */
  function 하루(y, m, d, 성별, 곳값) {
    const 곳 = PL ? PL.resolve(곳값) : { name: '서울', lon: 126.98, tzOffset: null };
    const 넣 = (h, mi) => E.calc({ year: y, month: m, day: d, hour: h, minute: mi, gender: 성별, longitude: 곳.lon, tzOffset: 곳.tzOffset });
    const 낮 = 넣(12, 0);
    const 밀림 = Math.round(-(낮.solarOffsetMin || 0));                      // 시계가 해보다 빠른 만큼(서울 12월이면 +28분)
    // 경계는 어림(밀림)으로 자리를 잡고, **엔진에 분 단위로 물어** 확정한다 — 병원에 말할 시각이라 1분도 어긋나면 안 된다.
    // (어림만 쓰면 반올림으로 1분이 밀린다: 2026-12-18 서울 미시는 13:28 부터인데 13:29 로 나왔다.)
    const 시지 = (t) => { t = Math.max(0, Math.min(1439, t)); return 넣(Math.floor(t / 60), t % 60).pillars.hour.branch; };
    const 경계 = [];
    for (let i = 0; i < 12; i++) {
      const 어림 = (((23 + 2 * i) * 60 + 밀림) % 1440 + 1440) % 1440;
      if (어림 < 4 || 어림 > 1435) { 경계.push(어림); continue; }
      const 앞 = 시지(어림 - 4); let 잡음 = 어림;
      for (let t = 어림 - 3; t <= 어림 + 4; t++) { if (시지(t) !== 앞) { 잡음 = t; break; } }
      경계.push(잡음);
    }
    경계.sort((a, b) => a - b);
    const 끝점 = [0].concat(경계.filter(x => x > 0 && x < 1440), [1440]);
    const rows = [];
    for (let k = 0; k < 끝점.length - 1; k++) {
      const a = 끝점[k], b = 끝점[k + 1]; if (b - a < 2) continue;
      const 가운데 = Math.floor((a + b) / 2);
      const R = 넣(Math.floor(가운데 / 60), 가운데 % 60);
      let 판 = null, 본 = null;
      try { 판 = P.판정(R, new Date(y, m - 1, d), { 운들: [] }); 본 = W.읽기(W.출산택일, 판, R); } catch (e) { 본 = null; }
      rows.push({ 시작: a, 끝: b - 1, 창: 시각(a) + '~' + 시각(b - 1), 시진: E.BRANCHES_KO[R.pillars.hour.branch] + '시',
                  일주: 간지말(R.pillars.day), 시주: 간지말(R.pillars.hour), 연주: 간지말(R.pillars.year), 월주: 간지말(R.pillars.month), 본, 밤끝: k === 끝점.length - 2 && a >= 22 * 60 });
    }
    return { rows, 곳: 곳.name, 밀림 };
  }

  function 줄(r) {
    if (!r.본) return '<div class="tk-row"><div class="tk-sum"><b>' + esc(r.시진) + '</b><span>' + esc(r.창) + '</span><i>읽지 못했어요</i></div></div>';
    const 칩 = r.본.눈들.map(n => '<span class="tk-eye' + (n.걸림 ? ' tk-hit' : '') + (n.보조 ? ' tk-aux' : '') + '"><em>' + esc(n.고전) + (n.보조 ? ' · 참고' : '') + '</em>' + esc(n.한줄) + '</span>').join('');
    const 속 = r.본.눈들.map(n => '<div class="tk-why"><b>' + esc(n.고전) + (n.보조 ? ' · 참고' : '') + '</b><span>' + esc(n.묻는것) + '</span>' + n.풀이.map(p => '<p>' + esc(p) + '</p>').join('') + '</div>').join('');
    return '<details class="tk-row' + (r.본.없음 ? ' tk-clean' : '') + '">'
      + '<summary><div class="tk-sum"><b>' + esc(r.시진) + '</b><span>' + esc(r.창) + '</span><i>' + esc(r.일주) + '일 ' + esc(r.시주) + '시' + (r.밤끝 ? ' · 다음 날 일주' : '') + '</i></div>'
      + (r.본.으뜸 ? '<div class="tk-badge tk-top">' + esc(W.출산택일.으뜸말) + '</div>' : '')
      + (r.본.없음 ? '<div class="tk-badge">' + esc(W.출산택일.없음말) + '</div>' : '')
      + '<div class="tk-eyes">' + 칩 + '</div></summary>' + 속 + '</details>';
  }

  // 시뮬레이터 끝 — 보고서와 무엇이 다른지 두 줄 + 견본 · 신청(10-02 개편 3묶음 「출산택일 한 길」).
  // 전에는 「보고서 신청하기」 단추 하나뿐이라, 무료로 하루씩 본 것과 값을 내고 받는 보고서가 무엇이 다른지 몰랐다.
  // 보고서 쪽 말(상품이름 · 받는 것 · 신청 길 · 견본 주소)은 상품 약속 장부(yaksok.js 택일 줄), 값은 상품표(products)에서 읽는다 — 여기 손으로 적지 않는다.
  // 장부가 없는 화면(시험 쪽)이면 신청 단추만 남는다. 신청 단추는 taekil.html 과 같은 길 — 사이트 신청서(taekil-apply.html, 10-02 네이버폼 걷음).
  // 출산택일 탭 안(10-02 맨 위 두 문 — 보고서 신청 · 시뮬레이터)이면 신청 단추는 쪽을 옮기지 않고 「보고서 신청」 칸으로 바꿔 주기만 한다:
  // data-tk-door="report" 를 달면 app.js(택일문달기)가 받아 칸을 바꾼다. 주소(href)는 스크립트가 못 받을 때 갈 길로 그대로 둔다.
  // taekil-sim.html(시뮬레이터 한 쪽)은 탭이 아니라 지금처럼 신청 쪽으로 간다.
  function 다리(탭안) {
    const Y = global.ChaeksaYaksok, r = Y && Y.줄 ? Y.줄('taekil') : null;
    const 신청 = '<a class="btn small" id="tkApply" href="taekil-apply.html?from=sim"'
      + (탭안 ? ' data-tk-door="report"' : '') + '>보고서 신청하기</a>';
    if (!r) return '<div class="tk-vs tk-vs-go">' + 신청 + '</div>';
    return '<div class="tk-vs">'
      + '<p class="tk-vs-h">시뮬레이터와 보고서는 이렇게 달라요</p>'
      + '<div class="tk-vs-row"><b>이 시뮬레이터 · 무료</b><p>날짜 하루를 골라 그날 열두 시각을 직접 봐요. 가족 생년월일과 병원 시간은 넣지 않고, 대운(10년마다 바뀌는 운)도 보지 않아요.</p></div>'
      + '<div class="tk-vs-row"><b>' + esc(r.상품이름) + (r.코드 ? Y.값자리(r.코드, ' · ', '', 'won') : '') + '</b><ul>'
      + Y.받는것목록('taekil').map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div>'
      + '<div class="tk-vs-go">' + (r.견본 ? '<a class="btn ghost small" href="' + esc(r.견본) + '?from=sim">견본 보기</a>' : '') + 신청 + '</div>'
      + '<p class="tk-note">' + esc(Y.신청글('taekil')) + '</p>'
      + '</div>';
  }

  /** box 안에 시뮬레이터를 세운다. opts.date = 'YYYY-MM-DD' */
  function render(box, opts) {
    if (!box) return;
    opts = opts || {};
    const 오늘 = new Date();
    let 날 = opts.date || (오늘.getFullYear() + '-' + 두(오늘.getMonth() + 1) + '-' + 두(오늘.getDate()));
    let 성별 = opts.gender || 'M', 곳값 = opts.place || 'KR:서울', 거르기 = false;
    box.innerHTML = '<section class="card tk" data-plain="1">'
      + '<h2>이 시각에 낳으면 — 세 고전이 보는 것</h2>'
      + '<p class="hint" style="margin:0 0 12px">날짜를 고르면 그날 열두 시진을 시계 시각으로 나눠, 시진마다 세 고전이 각자 본 것을 적어 드려요. 회원가입 없이 무료예요.</p>'
      + '<div class="tk-form"><label>날짜<input type="date" id="tkDate" value="' + esc(날) + '"></label>'
      + '<label>성별<select id="tkG"><option value="M">남아</option><option value="F">여아</option></select></label>'
      + '<label>태어날 곳<select id="tkPlace">' + (PL ? PL.options() : '<option value="KR:서울">서울</option>') + '</select></label></div>'
      + '<div class="tk-nav"><button type="button" class="btn ghost small" id="tkPrev">← 앞날</button><b id="tkHead"></b><button type="button" class="btn ghost small" id="tkNext">뒷날 →</button></div>'
      + '<label class="tk-filter"><input type="checkbox" id="tkClean"> 궁통보감 · 자평진전 두 책 모두 문제 삼지 않는 시각만 보기</label>'
      + '<p class="tk-note" id="tkTop"></p><div id="tkList"></div>'
      + '<div class="tk-send"><button type="button" class="btn ghost small" id="tkSend">이 날 가족에게 보내기</button><p class="tk-note" id="tkSendSay">' + esc(보내기안내) + '</p></div>'
      + '<p class="tk-note">' + esc(W.출산택일.꼬리) + '</p>'
      + 다리(!!(box.closest && box.closest('[data-tk-pane]')))
      + '<p class="tk-note">출산 날짜와 시각은 산모와 아기의 안전, 담당 선생님의 판단이 먼저예요. 택일은 그 범위 안에서 고르는 참고자료입니다.</p>'
      + '</section>';
    const q = (id) => box.querySelector('#' + id);
    q('tkG').value = 성별; q('tkPlace').value = 곳값;
    try { global.ChaeksaYaksok && global.ChaeksaYaksok.값채우기(box); } catch (e) {}
    function 그리기() {
      const [y, m, d] = 날.split('-').map(Number);
      if (!y || !m || !d) return;
      let r; try { r = 하루(y, m, d, 성별, 곳값); } catch (e) { q('tkList').innerHTML = '<p class="tk-note">이 날짜는 계산하지 못했어요.</p>'; return; }
      const 첫 = r.rows[Math.floor(r.rows.length / 2)];
      q('tkHead').textContent = m + '월 ' + d + '일 · ' + (첫 ? 첫.일주 + '일' : '');
      const 깨끗 = r.rows.filter(x => x.본 && x.본.없음).length, 으뜸수 = r.rows.filter(x => x.본 && x.본.으뜸 && !x.밤끝).length;
      q('tkTop').textContent = W.출산택일.머리 + ' ' + r.곳 + ' 기준 시계 시각이에요(이날은 시계가 해보다 ' + Math.abs(r.밀림) + '분 ' + (r.밀림 >= 0 ? '빨라요' : '늦어요') + '). '
        + (깨끗 ? '이날은 궁통보감 · 자평진전 두 책 모두 문제 삼지 않는 시각이 ' + 깨끗 + '개 있어요.' + (으뜸수 ? ' 그 가운데 ' + 으뜸수 + '개는 궁통보감이 찾는 글자가 다 뜬 으뜸 시각이에요.' : '') : '이날은 궁통보감 · 자평진전 두 책 모두 문제 삼지 않는 시각이 없어요. 앞뒤 날도 보세요.');
      const 보일 = 거르기 ? r.rows.filter(x => x.본 && x.본.없음) : r.rows;
      q('tkList').innerHTML = 보일.length ? 보일.map(줄).join('') : '<p class="tk-note">이날은 해당하는 시각이 없어요.</p>';
    }
    const 옮기기 = (n) => { const [y, m, d] = 날.split('-').map(Number); const t = new Date(y, m - 1, d + n); 날 = t.getFullYear() + '-' + 두(t.getMonth() + 1) + '-' + 두(t.getDate()); q('tkDate').value = 날; 그리기(); };
    q('tkDate').onchange = (e) => { if (e.target.value) { 날 = e.target.value; 그리기(); } };
    q('tkG').onchange = (e) => { 성별 = e.target.value; 그리기(); };
    q('tkPlace').onchange = (e) => { 곳값 = e.target.value; 그리기(); };
    q('tkClean').onchange = (e) => { 거르기 = e.target.checked; 그리기(); };
    q('tkPrev').onclick = () => 옮기기(-1); q('tkNext').onclick = () => 옮기기(1);
    q('tkSend').onclick = async () => {
      const b = q('tkSend'), say = q('tkSendSay'), [, m, d] = 날.split('-').map(Number);
      if (!m || !d || b.disabled) return;
      const url = 보낼주소(날);
      b.disabled = true;
      try { global.ChaeksaTrack && global.ChaeksaTrack.event && global.ChaeksaTrack.event('share-tk'); } catch (e) {}
      let r = '';
      try {
        r = await 링크보내기({ title: m + '월 ' + d + '일에 낳으면 — 시각마다 세 고전이 보는 것', text: '이 날 열두 시각을 궁통보감 · 자평진전 · 적천수가 각각 어떻게 보는지 같이 봐 주세요 · 책사',
          image: 'https://chaeksa.kr/art/kakao/taekil-main.jpg', url, button: '이 날 시각 보기' });
      } catch (e) { r = ''; }
      b.disabled = false;
      say.textContent = r === 'copied' ? '주소를 복사했어요 — 카톡 대화창에 붙여 넣어 보내 주세요. ' + 보내기안내
        : r ? 보내기안내 : '이 주소를 복사해서 보내 주세요: ' + url;
    };
    그리기();
  }

  // 「이 날 가족에게 보내기」(10-02 개편 2묶음 「공유 카드 넓히기」) — 가족이 같은 날짜 화면을 연다. 주소에는 날짜와 꼬리표(from=share-tk)만 싣는다.
  // 성별 · 태어날 곳 · 부모 생년월일은 싣지 않는다(받는 쪽에서 다시 고른다). 보내는 길은 share.js shareLink(카카오 링크 → 폰 공유 창 → 주소 복사),
  // share.js 가 없는 화면(시험 페이지)에서는 폰 공유 창 → 주소 복사만.
  const 보내기안내 = '주소에는 고른 날짜만 실려요. 성별 · 태어날 곳은 받는 쪽에서 다시 고르면 돼요.';
  const 보낼주소 = (날) => 'https://chaeksa.kr/taekil-sim.html?d=' + encodeURIComponent(날) + '&from=share-tk';
  async function 링크보내기(o) {
    const SH = global.ChaeksaShare;
    if (SH && SH.shareLink) return SH.shareLink(o);
    if (navigator.share) { try { await navigator.share({ title: o.title, text: o.text, url: o.url }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'aborted'; } }
    try { if (navigator.clipboard) { await navigator.clipboard.writeText(o.url); return 'copied'; } } catch (e) {}
    return '';
  }

  /** 글에서 온 사람이면 그 달로 연다 — 주소에 d=YYYY-MM-DD 가 있으면 그 날(사이트 정본은 이것을 단다).
      없으면 꼬리표로 — blog-m12 · site-gt12 → 2026-12, blog-m3 → 2027-03(월별 글은 2026-09 ~ 2027-08). gt = 궁통보감 글. */
  function 첫날() {
    let tag = '', d = '';
    try { const q = new URLSearchParams(location.search); d = q.get('d') || ''; tag = q.get('from') || sessionStorage.getItem('chaeksa.from') || ''; } catch (e) {}
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const mm = /-(?:m|gt)(\d{1,2})$/.exec(tag); if (!mm) return null;
    const m = +mm[1]; if (m < 1 || m > 12) return null;
    return (m >= 9 ? 2026 : 2027) + '-' + 두(m) + '-15';
  }

  function 세우기() { const box = document.getElementById('tkSim'); if (box && !box.dataset.on) { box.dataset.on = '1'; render(box, { date: 첫날() }); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 세우기); else 세우기();

  global.ChaeksaTaekilSim = { 하루, render, 보낼주소 };
})(window);
