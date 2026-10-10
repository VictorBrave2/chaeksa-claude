/* 「내 명반에는 무엇이 적혀 있을까」(myeongban.html) — 그리기만 한다. 계산은 비공개 서버 /api/myeongban(명반 엔진 · 《紫微斗數全書》 판정표 · 움직이는 해 1차).
 * 10-10 사장님 「자미두수 명판을 두고 글자를 누르면 해석해 주는 느낌」 · 「주성 14부터」 · 「추천대로 가고 작가 넘겨서 진행해」(작업판 자미-1 정함 7).
 *   명반 — 열두 궁 네모 판(전통 배치: 巳午未申 윗줄 · 辰 · 酉 양옆 · 卯 · 戌 · 寅丑子亥 아랫줄 · 가운데 2×2 머리). 칸마다 궁 이름(쉬운 말) · 지지 · 주성(밝기) · 보좌 · 살성 · 사화 표시 · 큰 운 띠.
 *   별을 누르면 아래 시트 — 머리(별 · 궁 · 내 밝기) → 작가 줄(서버 걸림 규칙 id 에 이어진 줄만 · 내 밝기 줄만, 밝기 null 줄은 늘) → 움직이는 해 → 「옛 책 원문 보기」 접힘(걸림 글자 그대로 · 권:줄 · 뜻 · 일부는 일부 머리) → 「안 걸린 줄」 접힘 → 맞아요 · 아니에요.
 *   빈칸 둘(貪狼|疾厄 · 天梁|福德)은 빈칸 글 + 짝 줄. 궁 이름을 누르면 궁 한 줄 + 그 궁의 별 목록(각각 누르기).
 *   판정 없음(「좋다 · 나쁘다」 안 냄) · LLM 없음 · 통설 없음 · 원문은 글자 그대로. 보좌 · 살성 · 사화는 이름만(다음 판).
 * 답은 /api/love-feedback 에 run 「myeongban-<서버가 준 열쇠>」 · id 「MB:<별>|<궁>」 으로 남긴다(생일은 보내지 않는다 — brain.js 와 같은 길). 자취(track)는 「myeongban」 한 번 — 첫 명반이 그려질 때.
 * 문장은 myeongban-copy.js(작가 원고 myeongban-copy-v1). 여기 박힌 짧은 말은 넷뿐 — 움직이는 해의 까닭 1층 말(큰 운 · 그해의 운 · 그해의 기운 — 작가의 「때」 문장 낱말 그대로) · 별 없는 궁 한 줄 · 짝 줄 「내 명반에서 걸려요」 · 큰 운 띠 「큰 운」. */
(function () {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var C = window.MYEONGBAN_COPY || {}, 쪽 = C.쪽 || {}, 칸글 = C.칸 || {};
  // 원고에서 글 하나 — 「칸.때머리」 꼴 길. 없으면 기본.
  var 글 = function (길, 기본) { var o = 쪽, ks = String(길).split('.'); for (var i = 0; i < ks.length && o != null; i++) o = o[ks[i]]; return typeof o === 'string' ? o : (기본 == null ? '' : 기본); };
  var 틀 = function (t, v) { return String(t || '').replace(/\{([^{}]+)\}/g, function (_, n) { return v[n] == null ? '' : v[n]; }); };
  var 표 = '', 결과 = null, 셌다 = false, 지금 = null;   // 지금 = { 이름, body } — 명반 가운데 「명식 짧게」(이 기기 안의 값, 주소에 싣지 않는다)

  // 전통 배치 — 지지 → [줄, 칸]. 가운데 2×2(줄 2~3 · 칸 2~3)는 명반 머리.
  var 자리 = { 巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4], 辰: [2, 1], 酉: [2, 4], 卯: [3, 1], 戌: [3, 4], 寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4] };
  var 밝기짧게 = { 廟: '廟', 旺: '旺', 得地: '得', 利益: '利', 平和: '平', 不得地: '不', 落陷: '陷' };
  var 궁쉬운 = function (g) { return (쪽.궁 && 쪽.궁[g] && 쪽.궁[g].쉬운) || ''; };
  var 별쉬운 = function (s) { return (쪽.별 && 쪽.별[s] && 쪽.별[s].쉬운) || s; };
  var 궁of = function (이름) { return 결과 ? 결과.명반.궁.filter(function (g) { return g.이름 === 이름; })[0] : null; };

  try { $('p').innerHTML = window.ChaeksaPlaces ? ChaeksaPlaces.options() : '<option value="KR:서울">서울</option>'; $('p').value = 'KR:서울'; } catch (e) {}
  if (쪽.제목) $('h1').textContent = 쪽.제목;
  if (쪽.눈썹) $('eyebrow').textContent = 쪽.눈썹;
  $('sub').textContent = 글('첫줄', '');
  $('hint').textContent = 글('입력.시필요', '');
  $('go').textContent = 글('입력.단추', '내 명반 그리기');

  function 남기기(id, v) {
    if (!표) return;
    try { fetch(API + '/api/love-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: 'myeongban-' + 표, id: id, value: v }) }); } catch (e) {}
  }
  var 단추 = function (id) { return '<div class="btns" data-id="' + esc(id) + '"><button type="button" data-v="yes">' + esc(글('맞아요.예', '맞아요')) + '</button><button type="button" data-v="no">' + esc(글('맞아요.아니요', '아니에요')) + '</button></div><p class="why after" data-after="' + esc(id) + '"></p>'; };

  // 엔진 경계 말 → 작가 경계종류 열쇠(엔진 말은 1층에 내지 않는다 — 작가 원고 경계메모). 모르는 말은 머리 줄만.
  function 경계종류(말) {
    if (/시진이 바뀌/.test(말)) return '시진';
    if (/23시|0시 환일/.test(말)) return '23시';
    if (/자정/.test(말)) return '자정';
    if (/초하루|그믐/.test(말)) return '음력 달';
    if (/^윤\d+월생/.test(말)) return '윤달';
    if (/^입춘 \d+분/.test(말)) return '입춘';
    if (/입춘 기준|설~입춘/.test(말)) return '연 경계';
    return null;
  }

  // 작가 줄의 밝기(규칙 값 그대로: 廟 · 旺 / 落陷 / 陷地 / 庙旺 / 入庙 …) 에 내 밝기(엔진 일곱 값)가 드나. 밝기 null 은 늘.
  function 밝기풀기(x) {
    var s = String(x || '').trim(); if (!s) return [];
    if (/陷/.test(s)) return ['落陷'];
    if (s === '庙旺' || s === '廟旺') return ['廟', '旺'];
    if (/廟|庙/.test(s)) return ['廟'];
    if (s === '旺') return ['旺'];
    return [s];
  }
  function 밝기맞음(줄밝기, 내) {
    if (!줄밝기) return true;
    var 셋 = []; String(줄밝기).split(/\s*·\s*/).forEach(function (p) { 셋 = 셋.concat(밝기풀기(p)); });
    return !내 || 셋.indexOf(내) >= 0;
  }

  // ── 명반 그리기
  function 명식짧게() {
    if (!지금) return '';
    var b = 지금.body, 곳 = String(b.place || '').split(':')[1] || '';
    return (지금.이름 ? 지금.이름 + ' · ' : '') + b.year + '.' + b.month + '.' + b.day + ' ' + b.hour + '시' + (b.minute ? ' ' + b.minute + '분' : '') + ' · ' + (b.gender === 'F' ? '여' : '남') + (곳 ? ' · ' + 곳 : '');
  }
  function 궁칸(g) {
    var M = 결과.명반, a = 자리[g.지지] || [1, 1], 사화 = {};
    (g.사화 || []).forEach(function (x) { 사화[x.별] = (사화[x.별] ? 사화[x.별] + ' ' : '') + String(x.화).slice(-1); });
    var h = '<div class="mb-cell' + (g.이름 === '命宮' ? ' is-ming' : '') + '" style="grid-area:' + a[0] + '/' + a[1] + '" data-g="' + esc(g.이름) + '">';
    h += '<div class="mb-gh"><button type="button" class="mb-gname" data-gung="' + esc(g.이름) + '">' + esc(g.이름) + '<small>' + esc(궁쉬운(g.이름)) + '</small></button><span class="mb-ji">' + esc((g.궁간 || '') + g.지지) + (M.신궁 === g.이름 ? '<span class="mb-tag">' + esc(글('명반.신궁표시', '신궁')) + '</span>' : '') + '</span></div>';
    if (g.주성.length) {
      h += '<div class="mb-stars">' + g.주성.map(function (s) {
        var m = 사화[s.이름] ? String(사화[s.이름]).split(' ').map(function (c) { return '<em class="' + (c === '忌' ? 'gi' : '') + '">' + esc(c) + '</em>'; }).join('') : '';
        return '<button type="button" class="mb-star" data-cell="' + esc(s.이름 + '|' + g.이름) + '">' + esc(s.이름) + '<i>' + esc(밝기짧게[s.밝기] || s.밝기 || '') + '</i>' + m + '</button>';
      }).join('') + '</div>';
    } else h += '<div class="mb-empty">—</div>';
    var 보 = (g.보좌 || []).join(' '), 살 = (g.살성 || []).join(' ');
    h += '<div class="mb-sub">' + esc(보) + (보 && 살 ? ' ' : '') + (살 ? '<span class="sal">' + esc(살) + '</span>' : '') + '</div>';
    if (g.대한) {
      var now = g.대한.끝해 >= M.해범위[0] && g.대한.시작해 <= M.해범위[1];
      h += '<div class="mb-dh' + (now ? ' now' : '') + '">큰 운 ' + g.대한.시작해 + '~' + String(g.대한.끝해).slice(-2) + '</div>';
    }
    return h + '</div>';
  }
  function 그리기() {
    var R = 결과; if (!R) return;
    var M = R.명반, h = '';
    h += '<div class="mb-top"><div class="sec">' + esc(글('명반.머리', '내 명반')) + '</div><p class="why">' + esc(M.해범위[0] + '~' + M.해범위[1]) + '</p></div>';
    var 종류 = []; (M.경계 || []).forEach(function (말) { var k = 경계종류(말); if (k && 종류.indexOf(k) < 0) 종류.push(k); });
    if ((M.경계 || []).length) h += '<div class="mb-edge"><p>' + esc(글('명반.경계', '')) + '</p>' + 종류.map(function (k) { return '<p>' + esc(글('명반.경계종류.' + k, '')) + '</p>'; }).join('') + '</div>';
    h += '<div class="mb" id="mb">' + M.궁.map(궁칸).join('')
      + '<div class="mb-center"><div class="c1">' + esc(글('명반.명궁표시', '명궁') + ' ' + M.명궁지지 + ' · ' + M.오행국) + '</div>'
      + '<div class="c2">' + esc(글('명반.신궁표시', '신궁') + ' ' + M.신궁 + (궁쉬운(M.신궁) ? '(' + 궁쉬운(M.신궁) + ')' : '')) + '</div>'
      + (명식짧게() ? '<div class="c3">' + esc(명식짧게()) + '</div>' : '')
      + '<div class="c3">' + esc(글('명반.누르기', '')) + '</div></div>'
      + '</div>';
    h += '<div class="end"><p class="line">' + esc(글('끝.줄', '')) + '</p><p class="why">' + esc(글('끝.풀이', '')) + '</p></div>';
    h += '<div class="share-row"><button type="button" class="btn ghost small" data-share="1">' + esc(글('공유.단추', '이 화면 친구에게 보내기')) + '</button><p class="why" id="shareMsg">' + esc(글('공유.안내', '')) + '</p></div>';
    $('out').innerHTML = h;
  }

  // ── 누르면 열리는 칸
  function 원문칸(x, 일부) {
    return '<div class="src' + (일부 ? ' part' : '') + '"><p class="q" lang="zh-Hant">' + esc(x.구절) + '</p>' + (x.뜻 ? '<p class="m">' + esc(x.뜻) + '</p>' : '')
      + (일부 && x.왜 ? '<p class="l">' + esc(x.왜) + '</p>' : '') + (x.줄 ? '<p class="l">' + esc(x.줄) + '</p>' : '') + '</div>';
  }
  function 까닭말(k) {
    if (k.종류 === '대한') return '큰 운(대한)이 이 궁에 머무는 해';
    if (k.종류 === '태세') return '그해의 운(태세)이 이 궁에 오는 해';
    if (k.종류 === '소운') return '그해의 운(소운)이 이 궁에 오는 해';
    if (k.종류 === '유년사화') return '그해의 기운(' + k.화 + ')이 ' + 별쉬운(k.별) + '에 붙는 해';
    return k.말 || '';
  }
  function 줄html(l) { return '<p class="mb-line">' + (l.밝기 ? '<span class="tag">' + esc(글('칸.내자리머리', '내 자리에선')) + '</span>' : '') + esc(l.글) + '</p>'; }
  function 별시트(key) {
    var 별 = key.split('|')[0], 궁 = key.split('|')[1], 셀 = 결과.칸[key] || { 걸림: [], 일부: [], 안걸림: [], 움직이는해: [], 짝: [] }, g = 궁of(궁) || {}, 원고 = 칸글[key] || { 줄: [] };
    var 내 = 셀.내밝기 || ((g.주성 || []).filter(function (s) { return s.이름 === 별; })[0] || {}).밝기 || '', h = '';
    h += '<p class="sh-k">' + esc(궁 + (궁쉬운(궁) ? '(' + 궁쉬운(궁) + ')' : '') + ' · ' + (g.지지 || '') + (결과.명반.신궁 === 궁 ? ' · ' + 글('명반.신궁표시', '신궁') : '')) + '</p>';
    h += '<p class="sh-t">' + esc(별) + '<small>' + esc(별쉬운(별)) + (내 ? ' · ' + 내 : '') + '</small></p>';
    if (내 && 글('밝기.' + 내, '')) h += '<p class="sh-b">' + esc(글('밝기.' + 내, '')) + ' <small>' + esc(글('칸.밝기머리', '')) + '</small></p>';
    if (쪽.별 && 쪽.별[별]) h += '<p class="why">' + esc(쪽.별[별].한줄) + '</p>';
    if (셀.빈칸) {
      h += '<div class="sec">' + esc(글('칸.빈칸', '')) + '</div><p class="mb-line">' + esc(원고.빈칸 || 글('칸.빈칸', '')) + '</p>';
      if ((셀.짝 || []).length) {
        h += '<p class="why">' + esc(글('칸.빈칸짝', '')) + '</p>' + 셀.짝.map(function (x) {
          var 머리 = (x.짝 || []).join(' · ') + (x.걸림 === '걸림' ? ' — 내 명반에서 걸려요' : x.걸림 === '일부' ? ' — ' + 글('칸.일부', '') : '');
          return '<div class="src' + (x.걸림 === '걸림' ? '' : ' part') + '"><p class="l">' + esc(머리) + '</p><p class="q" lang="zh-Hant">' + esc(x.구절) + '</p>' + (x.뜻 ? '<p class="m">' + esc(x.뜻) + '</p>' : '') + (x.줄 ? '<p class="l">' + esc(x.줄) + '</p>' : '') + '</div>';
        }).join('');
      }
    } else {
      h += '<p class="why">' + esc(글('칸.머리', '')) + '</p>';
      var 걸림id = {}; (셀.걸림 || []).forEach(function (x) { 걸림id[x.id] = true; });
      var 줄들 = (원고.줄 || []).filter(function (l) { return (l.규칙 || []).some(function (id) { return 걸림id[id]; }) && 밝기맞음(l.밝기, 내); });
      var 특 = 줄들.filter(function (l) { return l.갈래 === '특성'; }), 사 = 줄들.filter(function (l) { return l.갈래 !== '특성'; });
      h += '<div class="sec">' + esc(글('칸.특성머리', '')) + '</div>' + (특.length ? 특.map(줄html).join('') : '<p class="mb-none">' + esc(글('칸.특성없음', '')) + '</p>');
      h += '<div class="sec">' + esc(글('칸.사건머리', '')) + '</div>' + (사.length ? 사.map(줄html).join('') : '<p class="mb-none">' + esc(글('칸.사건없음', '')) + '</p>');
    }
    // 움직이는 해 — 서버가 낸 1차(대한 · 태세 · 소운 · 이 별의 유년 사화)만. 길흉 아님.
    var 해들 = 셀.움직이는해 || [];
    h += '<div class="sec">' + esc(글('칸.때머리', '')) + '</div>';
    if (해들.length) {
      h += '<p class="mb-line">' + esc(틀(글('칸.때', ''), { 해들: 해들.map(function (y) { return y.해; }).join(' · ') + '년' })) + '</p>';
      h += 해들.map(function (y) { return '<p class="yr"><b>' + y.해 + '년</b> <small>' + esc(y.간지 || '') + '</small> — ' + esc((y.까닭 || []).map(까닭말).join(' · ')) + '</p>'; }).join('');
    }
    if (셀.대한안옴 || !해들.length) h += '<p class="mb-none">' + esc(글('칸.때없음', '')) + '</p>';
    // 옛 책 원문 보기 — 걸림 글자 그대로 · 권:줄 · 판정표 뜻, 일부는 일부 머리 + 까닭
    if (!셀.빈칸 && ((셀.걸림 || []).length || (셀.일부 || []).length)) {
      h += '<details class="fold"><summary>' + esc(글('칸.원문접힘', '옛 책 원문 보기')) + '</summary><p class="why">' + esc(글('칸.원문머리', '')) + '</p>' + (셀.걸림 || []).map(function (x) { return 원문칸(x, false); }).join('');
      if ((셀.일부 || []).length) h += '<p class="why">' + esc(글('칸.일부', '')) + '</p>' + 셀.일부.map(function (x) { return 원문칸(x, true); }).join('');
      h += '</details>';
    }
    if ((셀.안걸림 || []).length) h += '<details class="fold"><summary>' + esc(글('칸.안걸림접힘', '')) + '</summary><p class="why">' + esc(글('칸.안걸림풀이', '')) + '</p>' + 셀.안걸림.map(function (x) { return 원문칸(x, false); }).join('') + '</details>';
    h += '<p class="q2">' + esc(글('맞아요.물음', '')) + '</p>' + 단추('MB:' + key) + '<p class="note">' + esc(글('맞아요.맺음', '')) + '</p>';
    열기(h);
  }
  function 궁시트(이름) {
    var g = 궁of(이름); if (!g) return;
    var h = '<p class="sh-k">' + esc((g.궁간 || '') + g.지지 + (결과.명반.신궁 === 이름 ? ' · ' + 글('명반.신궁표시', '신궁') : '')) + '</p>';
    h += '<p class="sh-t">' + esc(이름) + '<small>' + esc(궁쉬운(이름)) + '</small></p>';
    if (쪽.궁 && 쪽.궁[이름]) h += '<p class="sh-b">' + esc(쪽.궁[이름].한줄) + '</p>';
    if (결과.명반.신궁 === 이름) h += '<p class="why">' + esc(글('명반.신궁한줄', '')) + '</p>';
    if (g.대한) h += '<p class="why">' + esc('큰 운(대한) ' + g.대한.시작해 + '~' + g.대한.끝해 + '년') + '</p>';
    if (g.주성.length) h += '<div class="sec">' + esc(글('명반.누르기', '')) + '</div><div class="sh-stars">' + g.주성.map(function (s) { return '<button type="button" data-cell="' + esc(s.이름 + '|' + 이름) + '">' + esc(s.이름) + '<small>' + esc(별쉬운(s.이름) + (s.밝기 ? ' · ' + s.밝기 : '')) + '</small></button>'; }).join('') + '</div>';
    else h += '<p class="mb-none">이 궁에는 열네 별 가운데 앉은 별이 없어요.</p>';
    var 나머지 = (g.보좌 || []).concat(g.살성 || []).concat((g.사화 || []).map(function (x) { return x.별 + ' ' + x.화; }));
    if (나머지.length) h += '<p class="why"><small>' + esc(나머지.join(' · ')) + '</small></p>';
    열기(h);
  }
  function 열기(h) {
    $('shBody').innerHTML = h; $('sh').scrollTop = 0;
    $('shBack').classList.remove('hide'); $('sh').classList.remove('hide'); document.body.classList.add('sh-open');
    requestAnimationFrame(function () { $('shBack').classList.add('on'); $('sh').classList.add('on'); });
  }
  function 닫기() {
    $('shBack').classList.remove('on'); $('sh').classList.remove('on'); document.body.classList.remove('sh-open');
    setTimeout(function () { if (!$('sh').classList.contains('on')) { $('shBack').classList.add('hide'); $('sh').classList.add('hide'); } }, 230);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('sh').classList.contains('hide')) 닫기(); });

  document.addEventListener('click', async function (e) {
    var t = e.target;
    if (t === $('shBack') || (t.closest && t.closest('#shX'))) { 닫기(); return; }
    var st = t.closest && t.closest('[data-cell]');
    if (st && 결과) { 별시트(st.getAttribute('data-cell')); return; }
    var gn = t.closest && t.closest('[data-gung]');
    if (gn && 결과) { 궁시트(gn.getAttribute('data-gung')); return; }
    // 공유 — 주소 하나만 보낸다(생일 · 결과는 싣지 않음). brain 과 같은 길(share.js shareLink)
    var sh = t.closest && t.closest('[data-share]');
    if (sh) {
      var 주소 = 'https://chaeksa.kr/myeongban.html', 말 = $('shareMsg');
      var r = window.ChaeksaShare && ChaeksaShare.shareLink ? await ChaeksaShare.shareLink({ title: 글('공유.제목', '내 명반에는 무엇이 적혀 있을까요? — 책사'), text: 글('공유.글', ''), url: 주소 }) : '';
      if (말) 말.textContent = r === 'copied' ? '주소를 복사했어요. 카톡 대화창에 붙여 넣으세요.' : r === '' ? '이 주소를 보내 주세요 — ' + 주소 : 글('공유.안내', '');
      try { if (r && r !== 'aborted' && window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('myeongban_share'); } catch (e2) {}
      return;
    }
    var b = t.closest && t.closest('.btns button'); if (!b) return;
    var box = b.parentNode, id = box.getAttribute('data-id'), v = b.getAttribute('data-v');
    남기기(id, v);
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (x) { x.classList.toggle('on', x === b); });
    var 뒤 = document.querySelector('[data-after="' + id.replace(/"/g, '\\"') + '"]');
    if (뒤) 뒤.textContent = v === 'yes' ? 글('맞아요.고마움', '') : 글('맞아요.아니에요뒤', '');
    try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('myeongban_vote'); } catch (e3) {}
  });

  // 넣어 둔 생년월일(people.js) — brain 과 같은 길(10-05 사장님 「이용자 정보 입력은 프로필로」). 시 모름은 막는다(명궁이 달과 시로 선다).
  var PP = window.ChaeksaPeople, 사람들 = [];
  function 칸채우기(b) {
    $('y').value = b.year || ''; $('m').value = b.month || ''; $('d').value = b.day || '';
    $('hh').value = b.hour == null ? '' : b.hour; $('mi').value = b.hour == null ? '' : (b.minute || 0);
    var r = document.querySelector('input[name=g][value=' + (b.gender === 'F' ? 'F' : 'M') + ']'); if (r) r.checked = true;
    if (b.place) { $('p').value = b.place; if ($('p').value !== b.place) $('p').value = 'KR:서울'; }
  }
  function 이름표(p) { var b = p.birth, 이름 = p.name && p.name !== '이름 없음' ? p.name : p.relation || '나'; return 이름 + ' · ' + b.year + '.' + b.month + '.' + b.day + (b.hour == null ? '' : ' ' + b.hour + '시'); }
  function 고르기(i, 스크롤) {
    var p = 사람들[i]; if (!p) return;
    Array.prototype.forEach.call(document.querySelectorAll('#who .who button[data-i]'), function (x) { x.classList.toggle('on', +x.getAttribute('data-i') === i); });
    칸채우기(p.birth);
    if (p.birth.hour == null) { $('out').innerHTML = ''; $('f').classList.remove('hide'); $('err').textContent = '태어난 시각이 있어야 명반이 서요. 시각을 넣어 주세요.'; $('hh').focus(); return; }
    $('f').classList.add('hide');
    var 이름 = p.name && p.name !== '이름 없음' ? p.name : p.relation || '나';
    보기({ year: p.birth.year, month: p.birth.month, day: p.birth.day, hour: p.birth.hour, minute: p.birth.minute || 0, gender: p.birth.gender === 'F' ? 'F' : 'M', place: p.birth.place || 'KR:서울' }, 이름, 스크롤);
  }
  try { if (PP) { PP.migrate(); 사람들 = PP.list().filter(function (p) { return p.birth && p.birth.year; }); } } catch (e) { 사람들 = []; }
  if (사람들.length) {
    var 나 = PP.self(), 먼저 = Math.max(0, 사람들.findIndex(function (p) { return 나 && p.id === 나.id; }));
    $('who').innerHTML = '<p class="who-h">넣어 둔 생년월일로 볼게요</p><div class="who">' + 사람들.map(function (p, i) { return '<button type="button" data-i="' + i + '">' + esc(이름표(p)) + '</button>'; }).join('') + '<button type="button" data-new="1">다른 생년월일 넣기</button></div>';
    $('who').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b) return;
      if (b.getAttribute('data-new')) { Array.prototype.forEach.call(document.querySelectorAll('#who .who button'), function (x) { x.classList.remove('on'); }); b.classList.add('on'); $('f').reset(); $('p').value = 'KR:서울'; $('f').classList.remove('hide'); $('out').innerHTML = ''; $('err').textContent = ''; $('y').focus(); return; }
      고르기(+b.getAttribute('data-i'), true);
    });
    $('f').classList.add('hide');
    고르기(먼저);
  }
  $('f').addEventListener('submit', function (e) {
    e.preventDefault();
    // 시 · 분 숫자 칸(10-06 사장님 「시간 입력 바꿔 줘」) — 분은 비우면 0, 시는 0~23 · 분은 0~59 만
    var 시 = $('hh').value.trim(), 분 = $('mi').value.trim(), g = (document.querySelector('input[name=g]:checked') || {}).value || 'M';
    var body = { year: +$('y').value, month: +$('m').value, day: +$('d').value, hour: 시 === '' || +시 < 0 || +시 > 23 || +시 % 1 ? NaN : +시, minute: 분 === '' ? 0 : +분, gender: g, place: $('p').value };
    if (isNaN(body.minute) || body.minute < 0 || body.minute > 59 || body.minute % 1) { $('err').textContent = '분은 0부터 59까지 넣어 주세요.'; return; }
    if (!body.year || !body.month || !body.day) { $('err').textContent = '태어난 날을 다 넣어 주세요.'; return; }
    if (isNaN(body.hour)) { $('err').textContent = '태어난 시각이 있어야 명반이 서요.'; return; }
    보기(body, '', true);
  });
  async function 보기(body, 이름, 스크롤) {
    $('err').textContent = '명반을 그리고 있어요…';
    try {
      var r = await fetch(API + '/api/myeongban', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var j = await r.json();
      if (!r.ok) { $('err').textContent = j.error || '계산하지 못했어요.'; return; }
      결과 = j; 표 = j.표 || ''; 지금 = { 이름: 이름 || '', body: body }; $('err').textContent = '';
      그리기();
      // 손님이 눌러서 그린 것이면 명반으로 내려간다(처음 열릴 때 넣어 둔 사람으로 저절로 그린 것은 그대로 — 첫 줄부터 읽게)
      if (스크롤) try { var 머리 = document.querySelector('.mb-top'); if (머리) 머리.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e4) {}
      if (!셌다) { 셌다 = true; try { if (window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('myeongban'); } catch (e2) {} }
    } catch (err) { $('err').textContent = '연결이 잠깐 끊겼어요. 다시 눌러 주세요.'; }
  }
})();
