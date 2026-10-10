/* 「나는 귀한 사람일까」(gwi.html) — 그리기만 한다. 계산은 비공개 서버 /api/gwi(옛 책 滴天髓 何知章 — 귀하다고 꼽은 짜임 일곱 · 벼슬에서 멀다고 본 짜임 넷 · 덧 둘, 책사의 지금 귀 둘, 남녀 각 12,932명 분포).
 * 10-10 사장님 「귀한 사람이다 라는 것을 명식과 계산으로 도출해보자」 → 「둘 다로 가자, 귀 새 뜻으로 쓰고」 → 「귀 시제품 7개 다 네 추천대로 가」(작업판 귀-1). 「나는 고지능일까」(brain.js)와 같은 꼴.
 *   탭 1(옛 책이 귀하다고 꼽은 짜임) — 貴 수 · 賤 수를 나란히(빼지 않는다) · 「n개 이상 p%」 · 「꼭 n개 q%」 · 걸린 짜임 이름 · 걸림말 · 원문은 접힘. 덧 둘(G8 · C5)은 수에 안 넣고 「못 잼」 칸.
 *   탭 2(책사가 세운 지금의 귀) — ① 살면서 꺼내 쓰는 것이 넷인가(법전 70조) ② 바깥의 요구와 책임이 나에게 이어지는가 + 운에서 받는 해 · 둘 다인 사람 %.
 *   판정 없음 — 「귀한 사람이다 · 천하다」를 내지 않는다. 세고 · 빈도를 보이고 · 멈춘다. 끝 줄 「당신의 언행은 누구를 향합니까」(사장님 ⑦).
 * 시를 몰라도 본다(brain 과 다름) — 서버가 열두 시를 다 넣어 모두 같을 때만 걸림으로 내고, 시모름 표시를 준다.
 * 답은 /api/love-feedback 에 run 「gwi-<서버가 준 열쇠>」 · id 로 남긴다(생일은 보내지 않는다). id: GY = 옛 책 탭 물음 · GJ = 지금의 귀 탭 물음.
 * 문장은 gwi-copy.js(작가 원고 gwi-copy-v1). 관점을 하나로 합치지 않는다. 자취(track)는 「gwi」 한 번 — 첫 결과가 그려질 때.
 */
(function () {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var C = window.GWI_COPY || {};
  // 원고에서 글 하나 — 「옛.빈도.이상」 꼴 길. 없으면 기본.
  var 글 = function (길, 기본) { var o = C, ks = String(길).split('.'); for (var i = 0; i < ks.length && o != null; i++) o = o[ks[i]]; return typeof o === 'string' ? o : (기본 == null ? '' : 기본); };
  var 틀 = function (t, v) { return String(t || '').replace(/\{([^{}]+)\}/g, function (_, n) { return v[n] == null ? '' : v[n]; }); };
  var 표 = '', 결과 = null, 탭 = '1', 셌다 = false;

  try { $('p').innerHTML = window.ChaeksaPlaces ? ChaeksaPlaces.options() : '<option value="KR:서울">서울</option>'; $('p').value = 'KR:서울'; } catch (e) {}
  if (C.제목) $('h1').textContent = C.제목;
  if (C.눈썹) $('eyebrow').textContent = C.눈썹;
  $('sub').textContent = 글('첫줄', '');
  $('hint').textContent = 글('입력.시모름안내', '');
  $('go').textContent = 글('입력.단추', '귀의 조건 보기');

  function 남기기(id, v) {
    if (!표) return;
    try { fetch(API + '/api/love-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: 'gwi-' + 표, id: id, value: v }) }); } catch (e) {}
  }
  var 단추 = function (id) { return '<div class="btns" data-id="' + id + '"><button type="button" data-v="yes">' + esc(글('맞아요.예', '맞아요')) + '</button><button type="button" data-v="no">' + esc(글('맞아요.아니요', '아니에요')) + '</button></div><p class="why" data-after="' + id + '"></p>'; };
  var 성별말 = function (g) { return g === 'F' ? '여자' : '남자'; };
  var 출처말 = function (s) { return String(s || '').replace(/ · (docs|jamidusu)\/\S+/g, ''); };
  var 귀묶음 = '귀하다고 꼽은 짜임', 천묶음 = '벼슬에서 멀다고 본 짜임', 덧묶음 = '수에 넣지 않은 짜임';
  // 옛 책 짜임 한 칸 — 이름 · 있음말/없음말(원고)은 펼쳐 두고, 원문 · 뜻 · 근거(엔진 값) · 출처는 접는다. 이름 · 말은 원고(1층 말), 원문 · 근거는 서버 그대로.
  function 짜임칸(x, 묶음, 성) {
    var a = (C.옛 && C.옛.항목 && C.옛.항목[x.id]) || {};
    var 못잼 = x.걸림 === '못잼', 상태 = 못잼 ? '못 잼' : x.걸림 ? '내 사주에 있음' : '내 사주에 없음';
    var 말 = 못잼 ? (a.못잼말 || '') : x.걸림 ? (a.걸림말 || '') : (a.없음말 || '');
    return '<div class="card"><div class="k">' + esc(묶음 + ' · ' + 상태) + '</div><div class="y" style="font-size:var(--t4)">' + esc(a.이름 || x.이름) + '</div>'
      + (말 ? '<p>' + esc(말) + '</p>' : '')
      + '<details class="fold"><summary>원문 보기</summary><p class="q" lang="zh-Hant">' + esc(x.원문) + '</p>' + (a.뜻 ? '<p class="why">' + esc(a.뜻) + '</p>' : '')
      + '<p class="why"><small>' + esc(x.근거) + '<br>' + esc(출처말(x.출처)) + (x.p == null ? '' : '<br>이 짜임이 있는 사람 — 같은 ' + esc(성) + ' 가운데 ' + esc(x.p) + '%') + '</small></p></details></div>';
  }
  // 굵은 빈도 줄 — 「n개 이상 p%」 + 「꼭 n개 q%」. 0개면 「q%가 나처럼 하나도 없어요」. 표본에 n개 이상이 없으면 드묾없음.
  function 빈도줄(T) {
    if (!T.n) return 틀(글('옛.빈도.없음빈도'), { q: T.q });
    var 이상 = T.p > 0 ? 틀(글('옛.빈도.이상'), { n: T.n, p: T.p }) : 틀(글('옛.빈도.드묾없음'), { n: T.n });
    return 이상 + (T.q == null ? '' : ' ' + 틀(글('옛.빈도.꼭'), { n: T.n, q: T.q }));
  }
  var 걸린 = function (x) { return x.걸림 === true; }, 안걸린 = function (x) { return x.걸림 !== true; };
  // 10-11 운에서 받는 해 — 해마다 「{해}년 — {글자}({글자뜻})」 + 가장 가까운 해를 앞세운 한 줄(작가 misc-copy-1010 「귀받는해」 → 원고 지금.관통.받는해목록). 판정 말 없음.
  //   한 해에 책임 글자가 둘이면 한 줄에 「 · 」로 잇는다. 글자 · 정관/편관은 서버 책임 칸(10-11~ {천간, 십신, 층}).
  //   책임 칸이 없는 옛 응답이면 근거 문자열에서 천간 한 자를 꺼내 일간과 견주어 가른다 — 나를 누르는 오행이고 음양이 같으면 편관 · 다르면 정관.
  var 천간들 = '甲乙丙丁戊己庚辛壬癸';
  function 관가름(일간, 간) { var a = 천간들.indexOf(일간), b = 천간들.indexOf(간); if (a < 0 || b < 0 || (b >> 1) !== ((a >> 1) + 3) % 5) return ''; return a % 2 === b % 2 ? '편관' : '정관'; }
  function 책임들(x, 일간) {
    if (x.책임 && x.책임.length) return x.책임;
    return (x.글자 || []).map(function (s) { var m = /([甲乙丙丁戊己庚辛壬癸])\(/.exec(String(s)); return m ? { 천간: m[1], 십신: 관가름(일간, m[1]) } : null; }).filter(function (c) { return c && c.십신; });
  }
  function 받는해칸(받, 일간, 올해) {
    var B = (C.지금 && C.지금.관통 && C.지금.관통.받는해목록) || {};
    if (!B.줄) return '<p>' + esc(틀(글('지금.관통.받는해'), { 해들: 받.map(function (x) { return x.해 + '년'; }).join(' · ') })) + '</p>';
    var k = B.줄.indexOf('{글자}'), 앞틀 = k < 0 ? B.줄 : B.줄.slice(0, k), 글자틀 = k < 0 ? '' : B.줄.slice(k);
    var 줄들 = 받.map(function (x) {
      var 본 = {}, 조각 = 책임들(x, 일간).filter(function (c) { var 키 = c.천간 + c.십신; if (본[키]) return false; 본[키] = 1; return true; })
        .map(function (c) { return 틀(글자틀, { 글자: c.천간, 글자뜻: c.십신 === '정관' ? B.정관뜻 : B.편관뜻 }); });
      return 조각.length ? 틀(앞틀, { 해: x.해 }) + 조각.join(' · ') : x.해 + '년';
    });
    var 첫 = 받[0].해, 몇 = 첫 - 올해;
    return '<p class="yr-lead"><b>' + esc(몇 <= 0 ? 틀(B.가까운올해, { 해: 첫 }) : 틀(B.가까운, { 몇: 몇, 해: 첫 })) + '</b></p>'
      + (B.머리 ? '<p class="why">' + esc(B.머리) + '</p>' : '')
      + '<ul class="yrs">' + 줄들.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
  }
  function 그리기() {
    var R = 결과; if (!R) return;
    var 옛 = R.옛, 귀 = 옛.귀, 천 = 옛.천, J = R.지금, 성 = 성별말(R.성별), 표본 = R.표본 ? R.표본[R.성별 === 'F' ? '여' : '남'] : null, h = '';
    h += '<p class="why" style="margin:0 2px var(--s2)"><small>내 사주 — ' + esc(R.명식 || '') + (옛.시모름 ? '<br>' + esc(글('입력.시모름안내')) : '') + '</small></p>';
    h += '<div class="tabs" role="tablist">' + [['1', 글('탭.옛', '옛 책이 귀하다고 꼽은 짜임')], ['2', 글('탭.지금', '책사가 세운 지금의 귀')]].map(function (t) {
      return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (탭 === t[0]) + '" class="' + (탭 === t[0] ? 'on' : '') + '">' + esc(t[1]) + '</button>';
    }).join('') + '</div>';
    // 탭 1 — 옛 책이 귀하다고 꼽은 짜임: 貴 수 · 賤 수 나란히(따로 센다, 빼지 않는다) · 빈도 · 걸린 짜임 · 없는 짜임은 접힘 · 덧 둘
    h += '<div data-pane="1"' + (탭 === '1' ? '' : ' class="hide"') + '>';
    h += '<div class="duo"><div class="card"><div class="k">' + esc(귀묶음) + '</div><div class="y">' + esc(귀.n) + '<small> / ' + esc(귀.전체) + '</small></div></div>'
      + '<div class="card"><div class="k">' + esc(천묶음) + '</div><div class="y">' + esc(천.n) + '<small> / ' + esc(천.전체) + '</small></div></div></div>';
    h += '<div class="big"><p>' + esc(귀.n ? 틀(글('옛.귀머리'), { n: 귀.n }) : 글('옛.귀머리0')) + '</p><p><b>' + esc(빈도줄(귀)) + '</b></p></div>';
    h += '<div class="big"><p>' + esc(천.n ? 틀(글('옛.빈도.천머리'), { n: 천.n }) : 글('옛.빈도.천머리0')) + '</p><p><b>' + esc(빈도줄(천)) + '</b></p></div>';
    h += '<p class="why">' + esc(글('옛.머리')) + '</p>';
    if (글('옛.낱말')) h += '<details class="fold"><summary>낱말 풀이 펼쳐 보기</summary><p class="why">' + esc(글('옛.낱말')) + '</p></details>';
    var 있 = 귀.항목.filter(걸린).map(function (x) { return 짜임칸(x, 귀묶음, 성); }).concat(천.항목.filter(걸린).map(function (x) { return 짜임칸(x, 천묶음, 성); }));
    var 없 = 귀.항목.filter(안걸린).map(function (x) { return 짜임칸(x, 귀묶음, 성); }).concat(천.항목.filter(안걸린).map(function (x) { return 짜임칸(x, 천묶음, 성); }));
    h += 있.join('');
    if (없.length) h += '<details class="fold"><summary>' + esc(틀(글('옛.나머지'), { n: 없.length })) + '</summary>' + 없.join('') + '</details>';
    if ((옛.덧 || []).length) h += '<div class="sec">수에 넣지 않은 둘</div><p class="why">' + esc(글('옛.못잼')) + '</p>' + 옛.덧.map(function (x) { return 짜임칸(x, 덧묶음, 성); }).join('');
    h += '<p class="q2">' + esc(글('맞아요.옛물음')) + '</p>' + 단추('GY');
    h += '</div>';
    // 탭 2 — 책사가 세운 지금의 귀: ① 꺼내 쓰는 것이 넷(70조) ② 바깥의 요구와 책임이 나에게 이어짐 + 운에서 받는 해 · 둘 다인 사람 %
    var g = J.그릇넷, t = J.관통, 단계글 = g.단계 != null ? String(g.단계) : (g.단계들 || []).join(' · ');
    h += '<div data-pane="2"' + (탭 === '2' ? '' : ' class="hide"') + '>';
    h += '<div class="duo"><div class="card"><div class="k">' + esc(글('지금.그릇넷.이름')) + '</div><div class="y">' + (g.걸림 ? '있음' : '없음') + (단계글 ? '<small> · ' + esc(단계글) + '가지</small>' : '') + '</div></div>'
      + '<div class="card"><div class="k">' + esc(글('지금.관통.이름')) + '</div><div class="y">' + (t.걸림 ? '있음' : '없음') + '</div></div></div>';
    h += '<div class="big"><p><b>' + esc(틀(글('지금.함께'), { p: J.함께p })) + '</b></p></div>';
    h += '<p class="why">' + esc(글('지금.머리')) + '</p>';
    h += '<div class="card"><div class="k">' + (g.걸림 ? '내 사주에 있음' : '내 사주에 없음') + '</div><div class="y" style="font-size:var(--t4)">' + esc(글('지금.그릇넷.이름')) + '</div>'
      + '<p>' + esc(g.걸림 ? 글('지금.그릇넷.걸림') : 틀(글('지금.그릇넷.없음'), { 단계: 단계글 })) + '</p>'
      + (g.시모름 ? '<p class="why">' + esc(글('지금.그릇넷.시모름')) + '</p>' : '')
      + '<p class="why"><b>' + esc(틀(글('지금.그릇넷.빈도'), { p: g.p })) + '</b></p>'
      + '<details class="fold"><summary>근거 보기</summary><p class="why"><small>' + esc(g.근거) + '</small></p></details></div>';
    var 받 = t.받는해 || [], 일간 = String(R.명식 || '').split(' ')[2] ? String(R.명식).split(' ')[2].charAt(0) : '', 올해 = t.받는해범위 ? t.받는해범위[0] : new Date().getFullYear();
    h += '<div class="card"><div class="k">' + (t.걸림 ? '내 사주에 있음' : '내 사주에 없음') + '</div><div class="y" style="font-size:var(--t4)">' + esc(글('지금.관통.이름')) + '</div>'
      + '<p>' + esc(t.걸림 ? 글('지금.관통.걸림') : 글('지금.관통.없음')) + '</p>'
      + (t.걸림 ? '' : 받.length ? 받는해칸(받, 일간, 올해) : '<p>' + esc(글('지금.관통.받는해없음')) + '</p>')
      + (t.시모름 ? '<p class="why">' + esc(글('지금.관통.시모름')) + '</p>' : '')
      + '<p class="why"><b>' + esc(틀(글('지금.관통.빈도'), { p: t.p })) + '</b></p>'
      + '<details class="fold"><summary>근거 보기</summary><p class="why"><small>' + esc(t.근거)
      + (t.받는해 || []).map(function (x) { return '<br>' + esc(x.해 + '년 ' + (x.간지 || '') + ' — ' + (x.글자 || []).join(' · ')); }).join('') + '</small></p></details></div>';
    h += '<p class="q2">' + esc(글('맞아요.지금물음')) + '</p>' + 단추('GJ');
    h += '</div>';
    // 끝 줄(사장님 ⑦) — 두 탭 아래 늘 보인다. 사주가 보여 주는 것은 조건과 때까지, 귀는 언행으로 완성된다.
    h += '<div class="end"><p class="line">' + esc(글('끝.줄', '당신의 언행은 누구를 향합니까')) + '</p><p class="why">' + esc(글('끝.풀이')) + '</p></div>';
    h += '<p class="note">' + esc(글('맞아요.맺음')) + (표본 ? ' <small>(같은 ' + esc(성) + ' ' + Number(표본).toLocaleString() + '명 사주로 센 분포)</small>' : '') + '</p>';
    h += '<div class="share-row"><button type="button" class="btn ghost small" data-share="1">' + esc(글('공유.단추', '이 화면 친구에게 보내기')) + '</button><p class="why" id="shareMsg">' + esc(글('공유.안내')) + '</p></div>';
    $('out').innerHTML = h;
  }
  document.addEventListener('click', async function (e) {
    // 공유 — 주소 하나만 보낸다(생일 · 결과는 싣지 않음). brain 과 같은 길(share.js shareLink)
    var sh = e.target.closest && e.target.closest('[data-share]');
    if (sh) {
      var 주소 = 'https://chaeksa.kr/gwi.html', 말 = $('shareMsg');
      var r = window.ChaeksaShare && ChaeksaShare.shareLink ? await ChaeksaShare.shareLink({ title: 글('공유.제목', '나는 귀한 사람일까요? — 책사'), text: 글('공유.글', ''), url: 주소 }) : '';
      if (말) 말.textContent = r === 'copied' ? '주소를 복사했어요. 카톡 대화창에 붙여 넣으세요.' : r === '' ? '이 주소를 보내 주세요 — ' + 주소 : '';
      return;
    }
    var tb = e.target.closest && e.target.closest('[data-tab]');
    if (tb) {
      탭 = tb.getAttribute('data-tab');
      Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (x) { var on = x === tb; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
      Array.prototype.forEach.call(document.querySelectorAll('[data-pane]'), function (x) { x.classList.toggle('hide', x.getAttribute('data-pane') !== 탭); });
      return;
    }
    var b = e.target.closest && e.target.closest('.btns button'); if (!b) return;
    var box = b.parentNode, id = box.getAttribute('data-id'), v = b.getAttribute('data-v');
    남기기(id, v);
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (x) { x.classList.toggle('on', x === b); });
    var 뒤 = document.querySelector('[data-after="' + id + '"]');
    if (뒤) 뒤.textContent = v === 'yes' ? 글('맞아요.고마움', '고마워요.') : 글('맞아요.아니에요뒤', '알려 주셔서 고마워요.');
  });
  // 넣어 둔 생년월일(people.js) — 「나」 먼저(10-05 사장님 「이용자 정보 입력은 프로필로」). 시각이 없는 사람도 그대로 본다(시모름).
  var PP = window.ChaeksaPeople, 사람들 = [];
  function 칸채우기(b) {
    $('y').value = b.year || ''; $('m').value = b.month || ''; $('d').value = b.day || '';
    $('hh').value = b.hour == null ? '' : b.hour; $('mi').value = b.hour == null ? '' : (b.minute || 0);
    var r = document.querySelector('input[name=g][value=' + (b.gender === 'F' ? 'F' : 'M') + ']'); if (r) r.checked = true;
    if (b.place) { $('p').value = b.place; if ($('p').value !== b.place) $('p').value = 'KR:서울'; }
  }
  function 이름표(p) { var b = p.birth, 이름 = p.name && p.name !== '이름 없음' ? p.name : p.relation || '나'; return 이름 + ' · ' + b.year + '.' + b.month + '.' + b.day + (b.hour == null ? ' (시 모름)' : ' ' + b.hour + '시'); }
  function 고르기(i) {
    var p = 사람들[i]; if (!p) return;
    Array.prototype.forEach.call(document.querySelectorAll('#who .who button[data-i]'), function (x) { x.classList.toggle('on', +x.getAttribute('data-i') === i); });
    칸채우기(p.birth);
    $('f').classList.add('hide');
    var 모름 = p.birth.hour == null;
    보기({ year: p.birth.year, month: p.birth.month, day: p.birth.day, hour: 모름 ? null : p.birth.hour, minute: 모름 ? null : (p.birth.minute || 0), gender: p.birth.gender === 'F' ? 'F' : 'M', place: p.birth.place || 'KR:서울' });
  }
  try { if (PP) { PP.migrate(); 사람들 = PP.list().filter(function (p) { return p.birth && p.birth.year; }); } } catch (e) { 사람들 = []; }
  if (사람들.length) {
    var 나 = PP.self(), 먼저 = Math.max(0, 사람들.findIndex(function (p) { return 나 && p.id === 나.id; }));
    $('who').innerHTML = '<p class="who-h">넣어 둔 생년월일로 볼게요</p><div class="who">' + 사람들.map(function (p, i) { return '<button type="button" data-i="' + i + '">' + esc(이름표(p)) + '</button>'; }).join('') + '<button type="button" data-new="1">다른 생년월일 넣기</button></div>';
    $('who').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b) return;
      if (b.getAttribute('data-new')) { Array.prototype.forEach.call(document.querySelectorAll('#who .who button'), function (x) { x.classList.remove('on'); }); b.classList.add('on'); $('f').reset(); $('p').value = 'KR:서울'; $('f').classList.remove('hide'); $('out').innerHTML = ''; $('y').focus(); return; }
      고르기(+b.getAttribute('data-i'));
    });
    $('f').classList.add('hide');
    고르기(먼저);
  }
  // 처음 넣은 생년월일은 「나」로 남겨 둔다(when.js 와 같은 길) — 이미 「나」가 있으면 건드리지 않는다
  function 남겨두기(body) {
    try {
      if (!PP || PP.hasSelf()) return;
      var pl = window.ChaeksaPlaces && ChaeksaPlaces.resolve ? ChaeksaPlaces.resolve(body.place) : null;
      var b = { year: body.year, month: body.month, day: body.day, hour: body.hour, minute: body.minute, gender: body.gender, calendar: 'solar', place: body.place };
      if (pl) { b.placeName = pl.name; b.longitude = pl.lon; b.tzOffset = pl.tzOffset; }
      PP.add({ name: '', relation: '나', isSelf: true, birth: b });
    } catch (e) {}
  }
  $('f').addEventListener('submit', function (e) {
    e.preventDefault();
    // 시 · 분 숫자 칸 — 시는 비우면 「시 모름」(서버가 열두 시를 다 넣어 본다), 넣으면 0~23 · 분은 0~59 만
    var 시 = $('hh').value.trim(), 분 = $('mi').value.trim(), g = (document.querySelector('input[name=g]:checked') || {}).value || 'M';
    var hour = 시 === '' ? null : (+시 < 0 || +시 > 23 || +시 % 1 || isNaN(+시) ? NaN : +시);
    var body = { year: +$('y').value, month: +$('m').value, day: +$('d').value, hour: hour, minute: hour == null ? null : (분 === '' ? 0 : +분), gender: g, place: $('p').value };
    if (isNaN(hour)) { $('err').textContent = '시는 0부터 23까지 넣어 주세요. 모르면 비워 두세요.'; return; }
    if (hour != null && (isNaN(body.minute) || body.minute < 0 || body.minute > 59 || body.minute % 1)) { $('err').textContent = '분은 0부터 59까지 넣어 주세요.'; return; }
    if (!body.year || !body.month || !body.day) { $('err').textContent = '태어난 날을 다 넣어 주세요.'; return; }
    남겨두기(body);
    보기(body);
  });
  async function 보기(body) {
    $('err').textContent = '계산하고 있어요…';
    try {
      var r = await fetch(API + '/api/gwi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var j = await r.json();
      if (!r.ok) { $('err').textContent = j.error || '계산하지 못했어요.'; return; }
      결과 = j; 표 = j.표 || ''; $('err').textContent = '';
      그리기();
      // 자취는 「gwi」 한 번 — 첫 결과가 그려질 때만(탭 · 답 · 공유는 따로 세지 않는다)
      if (!셌다) { 셌다 = true; try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('gwi'); } catch (e2) {} }
    } catch (err) { $('err').textContent = '연결이 잠깐 끊겼어요. 다시 눌러 주세요.'; }
  }
})();
