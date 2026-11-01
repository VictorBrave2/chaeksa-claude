/* 명식 카드 한 장 — myeongsik.html(상담 글에 넣을 그림 · tools_card.py 가 찍는다) · taekil-report.html(자동 보고서) · taekil-admin.html 이 같이 쓴다(10-02 설계서 ⑤).
 * 판정은 여기서 안 한다 — 시뮬레이터 엔진(ChaeksaTaekilSim.하루 · ChaeksaEngine.calc)과 출산택일 관점(ChaeksaGwanjeom)이 낸 말을 그리기만 한다.
 * 엔진 사슬(places → astro → lunar → engine → … → gwanjeom → taekilsim)이 먼저 실려 있어야 한다. 없으면 null.
 *
 * html(opt) — opt = { slot: 'YYYY-MM-DDTHH:MM'(그 시진 안의 아무 분 — 카드에는 그 시진의 시계 창이 찍힌다), label, place: 'KR:서울',
 *                     g: 'M' | 'F' | 그 밖(남아로 재고 성별은 안 적는다), pre: 클래스 앞말, availableWindow?: {시작,끝}(분) }
 *   pre 가 '' 이면 myeongsik.html 의 옛 그림과 글자 하나까지 같은 꼴(그 쪽 CSS 가 꾸민다). 보고서 쪽은 'msc-' 로 부르고 css('msc-') 를 한 번 넣는다.
 */
(function (global) {
  'use strict';
  const 요일 = '일월화수목금토', 오행말 = ['목', '화', '토', '금', '수'], 오행한 = 오행말;   // 칸 이름 「정(화)」 꼴 — 10-23 사장님
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function html(opt) {
    opt = opt || {};
    const E = global.ChaeksaEngine, S = global.ChaeksaTaekilSim, PL = global.ChaeksaPlaces, GW = global.ChaeksaGwanjeom;
    if (!E || !S || !S.하루 || !PL || !GW) return null;
    const pre = opt.pre || '', c = (n) => n.split(' ').map(x => pre + x).join(' ');
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{2})$/.exec(String(opt.slot || '')); if (!m) return null;
    const [y, mo, d, hh, mi] = m.slice(1).map(Number), t = hh * 60 + mi;
    const place = opt.place || 'KR:서울', g = opt.g === 'F' ? 'F' : 'M';
    const day = S.하루(y, mo, d, g, place), r = day.rows.find(x => t >= x.시작 && t <= x.끝); if (!r) return null;
    const R = E.calc(Object.assign({ year: y, month: mo, day: d, hour: hh, minute: mi, gender: g }, (() => { const p = PL.resolve(place); return { longitude: p.lon, tzOffset: p.tzOffset }; })()));
    const P = R.pillars, gods = R.analysis && R.analysis.gods || {}, 순 = ['hour', 'day', 'month', 'year'], 머리 = { hour: '시각', day: '날', month: '달', year: '해' };
    const 칸 = (k, 줄) => {
      const p = P[k];
      if (줄 === 'top') return '<td class="' + c('god') + '">' + (k === 'day' ? '아이' : esc((gods[k] || {}).stem || '')) + '</td>';
      if (줄 === 'gan') return '<td class="' + c('gan e' + E.STEM_ELEM[p.stem] + (k === 'day' ? ' me' : '')) + '">' + E.STEMS[p.stem] + '<small>' + E.STEMS_KO[p.stem] + '(' + 오행한[E.STEM_ELEM[p.stem]] + ')' + '</small></td>';
      if (줄 === 'ji') return '<td class="' + c('ji e' + E.BRANCH_ELEM[p.branch]) + '">' + E.BRANCHES[p.branch] + '<small>' + E.BRANCHES_KO[p.branch] + '(' + 오행한[E.BRANCH_ELEM[p.branch]] + ')' + '</small></td>';
      return '<td class="' + c('god') + '">' + esc((gods[k] || {}).branch || '') + '</td>';
    };
    const 줄 = (종류) => '<tr>' + 순.map(k => 칸(k, 종류)).join('') + '</tr>';
    const 눈 = r.본 ? r.본.눈들.map(n => '<p class="' + c('eye' + (n.걸림 ? ' hit' : '')) + '"><em>' + esc(n.고전) + (n.보조 ? ' · 참고' : '') + '</em><span>' + esc(n.한줄) + '</span></p>').join('') : '';
    const 요 = 요일[new Date(y, mo - 1, d).getDay()];
    // 표시 범위만 좁힌다. 원래 시진과 명식 계산의 slot·row는 그대로 사용한다.
    const available = opt.availableWindow;
    const validWindow = !!(available && Number.isInteger(available.시작) && Number.isInteger(available.끝)
      && r.시작 <= available.시작 && available.시작 <= available.끝 && available.끝 <= r.끝);
    const clockText = minute => String(Math.floor(minute / 60)).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0');
    const shownWindow = validWindow ? clockText(available.시작) + ' ~ ' + clockText(available.끝) : r.창.replace('~', ' ~ ');
    const narrowed = validWindow && (available.시작 !== r.시작 || available.끝 !== r.끝);
    return '<div class="' + c('card') + '"><div class="' + c('k') + '">' + esc(opt.label || '사주 여덟 글자(명식)') + '</div>'
      + (validWindow ? '<p class="' + c('sub') + '">병원에 전할 시간</p>' : '')
      + '<div class="' + c('when') + '">' + mo + '월 ' + d + '일(' + 요 + ') ' + esc(shownWindow) + '</div>'
      + (narrowed ? '<p class="' + c('sub') + '">전체 시진 · ' + esc(r.창.replace('~', ' ~ ')) + '</p>' : '')
      + '<p class="' + c('sub') + '">' + esc(day.곳) + ' 시계 시각 · ' + esc(r.시진) + (opt.g === 'M' ? ' · 남아' : opt.g === 'F' ? ' · 여아' : '') + '</p>'
      + '<table><tr>' + 순.map(k => '<th>' + 머리[k] + '</th>').join('') + '</tr>' + 줄('top') + 줄('gan') + 줄('ji') + 줄('bot') + '</table>'
      + '<div class="' + c('eyes') + '">' + (r.본 && r.본.으뜸 ? '<span class="' + c('badge') + '" style="background:#1b1916;margin-right:6px">' + esc(GW.출산택일.으뜸말) + '</span>' : '') + (r.본 && r.본.없음 ? '<span class="' + c('badge') + '">' + esc(GW.출산택일.없음말) + '</span>' : '') + 눈 + '</div>'
      + '<div class="' + c('foot') + '"><span>책사 · chaeksa.kr</span><span>세 고전이 각자 본 것 · 점수로 합치지 않습니다</span></div></div>';
  }

  /** 11-02 원국표 — 엔진 결과(ChaeksaEngine.calc) 하나로 여덟 글자 표만(정통사주 맨 위 · 사장님 「명식을 보여주고 분석을 시작해야 신뢰도」).
   *  차례 시 · 일 · 월 · 년(10-21) · 칸 이름 「정(화)」(10-23) · 위 줄 천간 십신 · 아래 줄 지지 십신 · 일간 칸은 테두리. 판정 없음 — 그리기만. 꾸밈은 css(pre) 그대로.
   *  opt = { pre: 'msc-', label(없으면 머리 줄 없음), sub, 나: 일간 칸 위 이름(기본 '일간') } */
  function 원국표(R, opt) {
    opt = opt || {};
    const E = global.ChaeksaEngine; if (!E || !R || !R.pillars) return '';
    const pre = opt.pre == null ? 'msc-' : opt.pre, c = (n) => n.split(' ').map(x => pre + x).join(' ');
    const P = R.pillars, gods = R.analysis && R.analysis.gods || {}, 순 = ['hour', 'day', 'month', 'year'], 머리 = { hour: '시', day: '일', month: '월', year: '년' };
    // DES-0022: opt.pre로만 선택. 보고서의 html/css와 기존 msc 표는 그대로 둔다.
    if (pre === 'mwk-') {
      const letter = (p, stem) => {
        if (!p) return '<div class="mwk-letter"><b>—</b><small>—</small></div>';
        const n=stem?p.stem:p.branch, e=(stem?E.STEM_ELEM:E.BRANCH_ELEM)[n];
        return '<div class="mwk-letter mwk-e'+e+'"><b lang="zh">'+(stem?E.STEMS:E.BRANCHES)[n]+'</b><small>'+(stem?E.STEMS_KO:E.BRANCHES_KO)[n]+'('+오행한[e]+')</small></div>';
      };
      return '<div class="mwk-card">'+(opt.sub?'<p class="mwk-sub">'+esc(opt.sub)+'</p>':'')+'<div class="mwk-deck">'+순.map(k=>{
        const p=P[k],g=gods[k]||{};
        return '<section class="mwk-pillar'+(k==='day'?' mwk-me':'')+'" aria-label="'+머리[k]+' 기둥">'+'<div class="mwk-crown"><span>'+머리[k]+'</span></div><div class="mwk-body">'+letter(p,true)+'<span class="mwk-divider" aria-hidden="true"></span>'+letter(p,false)+'</div><div class="mwk-foot"><span>'+(p?(k==='day'?esc(opt.나||'일간'):esc(g.stem||'')):'—')+'</span><span>'+esc(p?g.branch||'':'—')+'</span></div></section>';
      }).join('')+'</div></div>';
    }
    const 칸 = (k, 줄) => {
      const p = P[k];
      if (!p) return '<td class="' + c(줄 === 'gan' || 줄 === 'ji' ? 줄 : 'god') + '"></td>';
      if (줄 === 'top') return '<td class="' + c('god') + '">' + (k === 'day' ? esc(opt.나 || '일간') : esc((gods[k] || {}).stem || '')) + '</td>';
      if (줄 === 'gan') return '<td class="' + c('gan e' + E.STEM_ELEM[p.stem] + (k === 'day' ? ' me' : '')) + '">' + E.STEMS[p.stem] + '<small>' + E.STEMS_KO[p.stem] + '(' + 오행한[E.STEM_ELEM[p.stem]] + ')</small></td>';
      if (줄 === 'ji') return '<td class="' + c('ji e' + E.BRANCH_ELEM[p.branch]) + '">' + E.BRANCHES[p.branch] + '<small>' + E.BRANCHES_KO[p.branch] + '(' + 오행한[E.BRANCH_ELEM[p.branch]] + ')</small></td>';
      return '<td class="' + c('god') + '">' + esc((gods[k] || {}).branch || '') + '</td>';
    };
    const 줄 = (종류) => '<tr>' + 순.map(k => 칸(k, 종류)).join('') + '</tr>';
    return '<div class="' + c('card') + '">' + (opt.label ? '<div class="' + c('k') + '">' + esc(opt.label) + '</div>' : '')   // 11-02 사장님 「사주 여덟글자(명식) 글자를 지워도 좋을 듯」 — 머리 글은 넘겨줄 때만
      + (opt.sub ? '<p class="' + c('sub') + '">' + esc(opt.sub) + '</p>' : '')
      + '<table><tr>' + 순.map(k => '<th>' + 머리[k] + '</th>').join('') + '</tr>' + 줄('top') + 줄('gan') + 줄('ji') + 줄('bot') + '</table></div>';
  }

  /** 앞말(pre)을 붙인 카드 꾸밈 — 보고서 쪽은 낮 · 밤 어느 바탕이든 종이 카드 그대로(myeongsik.html 과 같은 색). 폰 폭에 맞게 줄인다. */
  function css(pre) {
    const p = '.' + (pre || 'msc-');
    return p + 'card{max-width:540px;margin:12px 0;background:#fbf9f5;color:#1b1916;border:1px solid #ddd6c9;border-radius:12px;padding:22px 18px 18px;box-shadow:0 8px 24px rgba(40,32,20,.10);font-family:"Noto Sans KR","Malgun Gothic",sans-serif;box-sizing:border-box}'
      + p + 'k{font-size:11.5px;letter-spacing:.18em;color:#8c2f23;font-weight:500}'
      + p + 'when{font-family:"Noto Serif KR",serif;font-size:20px;font-weight:700;line-height:1.35;margin:8px 0 2px;letter-spacing:-.02em}'
      + p + 'sub{font-size:13px;color:#5d584f;margin:0 0 14px}'
      + p + 'card table{width:100%;border-collapse:separate;border-spacing:5px 0;table-layout:fixed;text-align:center}'
      + p + 'card th{font-size:12px;font-weight:500;color:#8c8578;padding-bottom:6px}'
      + p + 'card td' + p + 'god{font-size:12px;color:#5d584f;padding:5px 0}'
      + p + 'card td' + p + 'gan,' + p + 'card td' + p + 'ji{font-family:"Noto Serif KR",serif;font-size:32px;font-weight:700;line-height:1;padding:11px 0 9px;background:#fff;border:1px solid #ddd6c9}'
      + p + 'card td' + p + 'gan{border-radius:10px 10px 0 0;border-bottom:0}' + p + 'card td' + p + 'ji{border-radius:0 0 10px 10px}'
      + p + 'card td small{display:block;font-family:"Noto Sans KR",sans-serif;font-size:11px;font-weight:500;margin-top:5px;letter-spacing:0}'
      + p + 'e0{color:#2f6b4f}' + p + 'e1{color:#b23a2b}' + p + 'e2{color:#8a6a2a}' + p + 'e3{color:#6b6f78}' + p + 'e4{color:#274b7a}'
      + p + 'card td' + p + 'me{outline:2px solid #8c2f23;outline-offset:-2px}'
      + p + 'eyes{margin:16px 0 0;padding:12px 0 0;border-top:1px solid #ddd6c9}'
      + p + 'eye{display:flex;gap:10px;font-size:13px;line-height:1.65;margin:0 0 5px}'
      + p + 'eye em{font-style:normal;flex:0 0 6.6em;white-space:nowrap;color:#8c8578;font-size:12px;padding-top:1px}'
      + p + 'eye' + p + 'hit span{color:#8c8578}'
      + p + 'badge{display:inline-block;margin:0 0 10px;padding:4px 10px;border-radius:999px;background:#8c2f23;color:#fff;font-size:12px;font-weight:700}'
      + p + 'foot{margin-top:12px;font-size:11px;color:#8c8578;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}'
      + '@media (max-width:420px){' + p + 'card{padding:18px 12px 14px}' + p + 'card td' + p + 'gan,' + p + 'card td' + p + 'ji{font-size:26px}' + p + 'eye{flex-direction:column;gap:0}' + p + 'eye em{flex:none}}';
  }
  let 꾸밈넣음 = false;
  /** css(pre) 를 쪽 머리에 한 번 넣는다 */
  function 꾸밈(pre) {
    if (꾸밈넣음 || typeof document === 'undefined') return;
    꾸밈넣음 = true;
    const s = document.createElement('style'); s.textContent = css(pre); document.head.appendChild(s);
  }

  global.ChaeksaMyeongsikCard = { html, css, 꾸밈, 원국표 };
})(window);
