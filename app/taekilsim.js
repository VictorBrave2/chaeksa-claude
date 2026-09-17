/* 출산택일 시뮬레이터 — 화면 (법전 60 · 63조, 2026-09-17)
 *
 *   판정엔진(panjeong.js)  +  출산택일 관점(gwanjeom.js)  =  이 화면
 *
 * **이 파일에는 명리가 한 줄도 없다.** 하는 일은 셋뿐이다 —
 *   ① 고른 날을 열두 시진의 시계 시각으로 나눈다(진태양시 보정은 엔진이 낸 값 그대로)
 *   ② 시진마다 엔진을 부르고 관점에 읽힌다
 *   ③ 관점이 내준 말을 그린다
 * 점수 · 순위 · 등수를 내지 않는다(60조). 줄은 「세 관점에서 걸리는 것 없음」이라는 조건으로만 거른다. 그 조건은 길하다는 뜻이 아니다(64조).
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
    const 칩 = r.본.눈들.map(n => '<span class="tk-eye' + (n.걸림 ? ' tk-hit' : '') + '"><em>' + esc(n.고전) + '</em>' + esc(n.한줄) + '</span>').join('');
    const 속 = r.본.눈들.map(n => '<div class="tk-why"><b>' + esc(n.고전) + '</b><span>' + esc(n.묻는것) + '</span>' + n.풀이.map(p => '<p>' + esc(p) + '</p>').join('') + '</div>').join('');
    return '<details class="tk-row' + (r.본.없음 ? ' tk-clean' : '') + '">'
      + '<summary><div class="tk-sum"><b>' + esc(r.시진) + '</b><span>' + esc(r.창) + '</span><i>' + esc(r.일주) + '일 ' + esc(r.시주) + '시' + (r.밤끝 ? ' · 다음 날 일주' : '') + '</i></div>'
      + (r.본.없음 ? '<div class="tk-badge">' + esc(W.출산택일.없음말) + '</div>' : '')
      + '<div class="tk-eyes">' + 칩 + '</div></summary>' + 속 + '</details>';
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
      + '<label class="tk-filter"><input type="checkbox" id="tkClean"> 세 관점에서 걸리는 것 없는 자리만 보기</label>'
      + '<p class="tk-note" id="tkTop"></p><div id="tkList"></div>'
      + '<p class="tk-note">' + esc(W.출산택일.꼬리) + '</p>'
      + '<a class="btn" href="taekil-apply.html?from=sim" style="display:block;text-align:center;text-decoration:none;margin-top:12px">보고서 신청하기</a>'
      + '<p class="tk-note">출산 날짜와 시각은 산모와 아기의 안전, 담당 선생님의 판단이 먼저예요. 택일은 그 범위 안에서 고르는 참고자료입니다.</p>'
      + '</section>';
    const q = (id) => box.querySelector('#' + id);
    q('tkG').value = 성별; q('tkPlace').value = 곳값;
    function 그리기() {
      const [y, m, d] = 날.split('-').map(Number);
      if (!y || !m || !d) return;
      let r; try { r = 하루(y, m, d, 성별, 곳값); } catch (e) { q('tkList').innerHTML = '<p class="tk-note">이 날짜는 계산하지 못했어요.</p>'; return; }
      const 첫 = r.rows[Math.floor(r.rows.length / 2)];
      q('tkHead').textContent = m + '월 ' + d + '일 · ' + (첫 ? 첫.일주 + '일' : '');
      const 깨끗 = r.rows.filter(x => x.본 && x.본.없음).length;
      q('tkTop').textContent = W.출산택일.머리 + ' ' + r.곳 + ' 기준 시계 시각이에요(이날은 시계가 해보다 ' + Math.abs(r.밀림) + '분 ' + (r.밀림 >= 0 ? '빨라요' : '늦어요') + '). '
        + (깨끗 ? '이날은 세 관점에서 걸리는 것 없는 자리가 ' + 깨끗 + '곳 있어요. ' + W.출산택일.없음풀이 : '이날은 세 관점에서 다 안 걸리는 자리가 없어요. 앞뒤 날도 보세요.');
      const 보일 = 거르기 ? r.rows.filter(x => x.본 && x.본.없음) : r.rows;
      q('tkList').innerHTML = 보일.length ? 보일.map(줄).join('') : '<p class="tk-note">이날은 해당하는 자리가 없어요.</p>';
    }
    const 옮기기 = (n) => { const [y, m, d] = 날.split('-').map(Number); const t = new Date(y, m - 1, d + n); 날 = t.getFullYear() + '-' + 두(t.getMonth() + 1) + '-' + 두(t.getDate()); q('tkDate').value = 날; 그리기(); };
    q('tkDate').onchange = (e) => { if (e.target.value) { 날 = e.target.value; 그리기(); } };
    q('tkG').onchange = (e) => { 성별 = e.target.value; 그리기(); };
    q('tkPlace').onchange = (e) => { 곳값 = e.target.value; 그리기(); };
    q('tkClean').onchange = (e) => { 거르기 = e.target.checked; 그리기(); };
    q('tkPrev').onclick = () => 옮기기(-1); q('tkNext').onclick = () => 옮기기(1);
    그리기();
  }

  /** 글에서 온 사람이면 그 달로 연다 — 꼬리표 blog-m12 → 2026-12, blog-m3 → 2027-03(월별 글은 2026-09 ~ 2027-08). */
  function 첫날() {
    let tag = ''; try { tag = new URLSearchParams(location.search).get('from') || sessionStorage.getItem('chaeksa.from') || ''; } catch (e) {}
    const mm = /-m(\d{1,2})$/.exec(tag); if (!mm) return null;
    const m = +mm[1]; if (m < 1 || m > 12) return null;
    return (m >= 9 ? 2026 : 2027) + '-' + 두(m) + '-15';
  }

  function 세우기() { const box = document.getElementById('tkSim'); if (box && !box.dataset.on) { box.dataset.on = '1'; render(box, { date: 첫날() }); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 세우기); else 세우기();

  global.ChaeksaTaekilSim = { 하루, render };
})(window);
