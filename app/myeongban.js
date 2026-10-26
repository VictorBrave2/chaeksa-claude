/* 「내 명반에는 무엇이 적혀 있을까」(myeongban.html) — 그리기만 한다. 계산은 비공개 서버 /api/myeongban(명반 엔진 · 《紫微斗數全書》 판정표 · 움직이는 해 1차).
 * 10-10 사장님 「자미두수 명판을 두고 글자를 누르면 해석해 주는 느낌」 · 「주성 14부터」 · 「추천대로 가고 작가 넘겨서 진행해」(작업판 자미-1 정함 7).
 *   명반 — 열두 궁 네모 판(전통 배치: 巳午未申 윗줄 · 辰 · 酉 양옆 · 卯 · 戌 · 寅丑子亥 아랫줄 · 가운데 2×2 머리). 칸마다 궁 이름(쉬운 말) · 지지 · 주성(밝기) · 보좌 · 살성 · 사화 표시 · 큰 운 띠.
 *   별을 누르면 아래 시트 — 머리(별 · 궁 · 내 밝기) → 작가 줄(서버 걸림 규칙 id 에 이어진 줄만 · 내 밝기 줄만, 밝기 null 줄은 늘) → 움직이는 해 → 「옛 책 원문 보기」 접힘(걸림 글자 그대로 · 권:줄 · 뜻 · 일부는 일부 머리) → 「안 걸린 줄」 접힘.
 *   빈칸 둘(貪狼|疾厄 · 天梁|福德)은 빈칸 글 + 짝 줄. 궁 이름을 누르면 궁 한 줄 + 그 궁의 별 목록(각각 누르기).
 *   판정 없음(「좋다 · 나쁘다」 안 냄) · LLM 없음 · 통설 없음 · 원문은 글자 그대로.
 * 2판(10-10 작업판 자미-2 · 사장님 「다음판 ㄱㄱ」 · 메인 정함 ①~⑤): 칸 안의 보좌 8 · 살성 6 딱지와 사화 딱지(科 · 祿 · 權 · 忌)도 누른다 — 서버 칸 「文曲|命宮」 · 「化科|命宮」(별종류 · 실은별)이 있을 때만(없으면 1판처럼 이름만).
 *   시트는 1판과 같은 꼴(머리 → 작가 줄 → 움직이는 해 → 원문 접힘 → 안 걸림 접힘). 작가 줄은 걸림 규칙 id + 걸린 새 짝(일판칸 없는 것) id 에 이어진 것만, 짝으로 걸린 줄엔 이 궁에 같이 있는 짝 별 이름표.
 *   빈칸은 빈칸꼴(사화 · 별만 · 나머지) 한 줄 + 별 한 줄(卷一 문답 원문 · 권:줄). 일판칸 짝(주성 칸에 이미 있는 줄)은 「주성 칸에도 있는 줄」 접힘에만(이 궁에 그 짝이 있을 때). 天空 은 화면 이름 「天空(地空)」(쪽2.천공이름).
 *   사화 시트 머리에 어느 별에 붙었는지 한 줄(서버 실은별). 궁 시트 별 목록에 보좌 · 살성 · 사화도. 글은 myeongban-copy.js 쪽2 · 칸 216(작가 원고 myeongban-copy-v2).
 * 3판(10-11 작업판 정리-1 — 남은 조목을 화면에 잇는다 · 서버 v0.3): ① 주성 시트에 「두 별이 함께」 묶음 — 서버 칸.짝칸(그 궁의 두 주성이 함께일 때만 걸리는 줄)의 걸림 id 에 이어진 작가 줄 + 「…과 함께」 이름표.
 *   원문 · 일부 · 안 걸림은 시트의 같은 접힘에 짝 이름표를 달아 넣는다(접힘을 둘로 만들지 않는다). 밝기는 서버가 걸림으로 이미 가렸다(두 별 밝기가 달라 내 밝기로 다시 거르지 않는다).
 *   ② 궁 시트에 궁줄 — 서버 명반.궁[i].궁줄(夾 · 생시 · 띠 · 잡성 · 태양 · 태음 밝기)의 걸림 id 에 이어진 작가 줄, 夾(양옆 궁이 끼는 줄)은 따로 머리. 원문 · 일부 · 안 걸림 접힘.
 *   ③ 응답에 3판 키(칸.짝칸 · 명반.궁[i].궁줄)가 없으면(v0.2 서버) 2판 그대로. 글은 myeongban-copy.js 쪽3 · 짝칸 · 궁줄(작가 원고 myeongban-copy-v3).
 * 반응 단추와 답 전송은 걷었다. 자취(track)는 「myeongban」 한 번 — 첫 명반이 그려질 때.
 * 문장은 myeongban-copy.js(작가 원고 myeongban-copy-v1 · v2 · v3). 여기 박힌 짧은 말은 다섯뿐 — 움직이는 해의 까닭 1층 말(큰 운 · 그해의 운 · 그해의 기운 — 작가의 「때」 문장 낱말 그대로) · 별 없는 궁 한 줄 · 짝 줄 「내 명반에서 걸려요」 · 큰 운 띠 「큰 운」 · 짝 이름표 「…와 함께」. */
(function () {
  'use strict';
  var API = 'https://chaeksa-behavior-core.vercel.app';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var C = window.MYEONGBAN_COPY || {}, 쪽 = C.쪽 || {}, 쪽2 = C.쪽2 || {}, 칸글 = C.칸 || {};
  var 쪽3 = C.쪽3 || {}, 짝칸글 = C.짝칸 || {}, 궁줄글 = C.궁줄 || {};   // 3판 — 묶음 머리 · 짝칸 32(「紫微+天府|命宮」 꼴) · 궁줄 12(「命宮」 꼴)
  var 머리3 = function (k) { var m = 쪽3.머리 || {}; return typeof m[k] === 'string' ? m[k] : ''; };
  // 원고에서 글 하나 — 「칸.때머리」 꼴 길. 없으면 기본. 글2 는 2판 쪽 글(쪽2).
  var 글 = function (길, 기본) { var o = 쪽, ks = String(길).split('.'); for (var i = 0; i < ks.length && o != null; i++) o = o[ks[i]]; return typeof o === 'string' ? o : (기본 == null ? '' : 기본); };
  var 글2 = function (길, 기본) { var o = 쪽2, ks = String(길).split('.'); for (var i = 0; i < ks.length && o != null; i++) o = o[ks[i]]; return typeof o === 'string' ? o : (기본 == null ? '' : 기본); };
  // 받침 — 앞말의 마지막 한글 글자. 한글이 없으면 null(조사를 원고 그대로 둔다)
  var 받침 = function (x) { var t = String(x || ''); for (var i = t.length - 1; i >= 0; i--) { var c = t.charCodeAt(i); if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 > 0; } return null; };
  var 조사쌍 = { 이: ['이', '가'], 가: ['이', '가'], 과: ['과', '와'], 와: ['과', '와'], 을: ['을', '를'], 를: ['을', '를'], 은: ['은', '는'], 는: ['은', '는'] };
  // 2판 틀 — {별} · {사화} 뒤 조사를 앞말 받침에 맞춘다(「화록이」 · 「화과가」). 원고 낱말은 그대로.
  var 틀2 = function (t, v) { return String(t || '').replace(/\{([^{}]+)\}(이|가|과|와|을|를|은|는)?/g, function (_, n, j) { var x = v[n] == null ? '' : String(v[n]); if (!j) return x; var b = 받침(x); return x + (b == null ? j : 조사쌍[j][b ? 0 : 1]); }); };
  var 틀 = function (t, v) { return String(t || '').replace(/\{([^{}]+)\}/g, function (_, n) { return v[n] == null ? '' : v[n]; }); };
  var 표 = '', 결과 = null, 셌다 = false, 지금 = null;   // 지금 = { 이름, body } — 명반 가운데 「명식 짧게」(이 기기 안의 값, 주소에 싣지 않는다)

  // 전통 배치 — 지지 → [줄, 칸]. 가운데 2×2(줄 2~3 · 칸 2~3)는 명반 머리.
  var 자리 = { 巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4], 辰: [2, 1], 酉: [2, 4], 卯: [3, 1], 戌: [3, 4], 寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4] };
  // 10-22 사장님 「명반을 한글로 표현해 한자가 너무 많더라」 — 판의 이름표는 한글(밝기는 이 쪽 밝기 풀이를 줄인 말 · 궁은 궁 이름 + 쉬운 이름 · 지지는 소리)
  var 밝기짧게 = { 廟: '가장 밝음', 旺: '밝음', 得地: '꽤 밝음', 利益: '조금 밝음', 平和: '보통', 不得地: '조금 어두움', 落陷: '빛 잃음' };
  var 궁한글 = { 命宮: '명궁', 兄弟: '형제궁', 妻妾: '부처궁', 子女: '자녀궁', 財帛: '재백궁', 疾厄: '질액궁', 遷移: '천이궁', 奴僕: '노복궁', 官祿: '관록궁', 田宅: '전택궁', 福德: '복덕궁', 父母: '부모궁' };
  var 글자소리 = { 甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무', 己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계', 子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해' };
  var 오행국한글 = { 水二局: '수이국', 木三局: '목삼국', 金四局: '금사국', 土五局: '토오국', 火六局: '화육국' };
  var 소리 = function (t) { return String(t || '').split('').map(function (c) { return 글자소리[c] || c; }).join(''); };
  var 화한글 = { 化祿: '화록', 化權: '화권', 化科: '화과', 化忌: '화기' };
  var 궁쉬운 = function (g) { return (쪽.궁 && 쪽.궁[g] && 쪽.궁[g].쉬운) || ''; };
  var 궁말 = function (g) { return 궁쉬운(g) + '(' + (궁한글[g] || g) + ')'; };
  var 별쉬운 = function (s) { return (쪽.별 && 쪽.별[s] && 쪽.별[s].쉬운) || (쪽2.별 && 쪽2.별[s] && 쪽2.별[s].쉬운) || s; };
  // 화면 이름 — 天空 은 「天空(地空)」(2판 정함 ⑤ · 쪽2.천공이름). 나머지는 한자 그대로
  var 별이름 = function (s) { return (쪽2.별 && 쪽2.별[s] && 쪽2.별[s].화면이름) || (s === '天空' ? 글2('천공이름.화면', s) : s); };
  var 종류쉬운 = function (k) { return 글2('종류.' + k + '.쉬운', ''); };
  // 「천부에 붙은 화과」 — 사화 칸 머리(쪽2.사화칸.머리)
  var 붙은말 = function (실은, 화, 길) { return 틀2(글2('사화칸.' + (길 || '머리'), '{별}에 붙은 {사화}'), { 별: 별쉬운(실은), 사화: 별쉬운(화) }); };
  var 궁of = function (이름) { return 결과 ? 결과.명반.궁.filter(function (g) { return g.이름 === 이름; })[0] : null; };

  try { $('p').innerHTML = window.ChaeksaPlaces ? ChaeksaPlaces.options() : '<option value="KR:서울">서울</option>'; $('p').value = 'KR:서울'; } catch (e) {}
  $('h1').textContent = '정통자미두수';
  $('eyebrow').textContent = '별들이 그린 당신의 귀한 자리';
  $('sub').textContent = '명반의 별을 누르고, 나에게 모인 좋은 조건을 읽어 보세요.';
  $('hint').textContent = 글('입력.시필요', '');
  $('go').textContent = '내 명반 읽기';

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
  // 사화 딱지 — 서버 칸 「化X|궁」이 있으면 단추(2판), 없으면 1판처럼 표시만
  function 화딱지(화들, 궁) {
    return (화들 || []).map(function (화) {
      var k = 화 + '|' + 궁, c = 화한글[화] || String(화).slice(-1), cls = 'mb-hwa' + (화 === '化忌' ? ' gi' : '');
      return 결과.칸[k] ? '<button type="button" class="' + cls + '" data-cell="' + esc(k) + '" aria-label="' + esc(화 + ' ' + 별쉬운(화)) + '">' + esc(c) + '</button>' : '<em class="' + cls + '">' + esc(c) + '</em>';
    }).join('');
  }
  function 궁칸(g) {
    var M = 결과.명반, a = 자리[g.지지] || [1, 1], 사화 = {}, 놓인 = {};
    (g.사화 || []).forEach(function (x) { (사화[x.별] = 사화[x.별] || []).push(x.화); });
    var h = '<div class="mb-cell' + (g.이름 === '命宮' ? ' is-ming' : '') + '" style="grid-area:' + a[0] + '/' + a[1] + '" data-g="' + esc(g.이름) + '">';
    h += '<div class="mb-gh"><button type="button" class="mb-gname" data-gung="' + esc(g.이름) + '">' + esc(궁쉬운(g.이름)).replace('과 동료', '과<br>동료') + '<small>' + esc(궁한글[g.이름] || g.이름) + '</small></button><span class="mb-ji">' + esc(소리((g.궁간 || '') + g.지지)) + (M.신궁 === g.이름 ? '<span class="mb-tag">' + esc(글('명반.신궁표시', '신궁')) + '</span>' : '') + '</span></div>';
    if (g.주성.length) {
      h += '<div class="mb-stars">' + g.주성.map(function (s) {
        놓인[s.이름] = 1;
        return '<span class="mb-srow"><button type="button" class="mb-star" data-cell="' + esc(s.이름 + '|' + g.이름) + '">' + esc(별쉬운(s.이름)) + '<i>' + esc(밝기짧게[s.밝기] || s.밝기 || '') + '</i></button>' + 화딱지(사화[s.이름], g.이름) + '</span>';
      }).join('') + '</div>';
    } else h += '<div class="mb-empty">—</div>';
    // 보좌 · 살성 — 서버 칸 「별|궁」이 있으면 단추(2판), 없으면 이름만. 사화가 붙은 보좌는 그 옆에 사화 딱지
    var 딱 = function (s, 살) {
      놓인[s] = 1;
      var k = s + '|' + g.이름, cls = 'mb-aux' + (살 ? ' sal' : ''), 이 = 별쉬운(s);   // 10-22 한글 이름
      return '<span class="mb-srow">' + (결과.칸[k] ? '<button type="button" class="' + cls + '" data-cell="' + esc(k) + '">' + esc(이) + '</button>' : '<span class="' + cls + ' off">' + esc(이) + '</span>') + 화딱지(사화[s], g.이름) + '</span>';
    };
    var 딱들 = (g.보좌 || []).map(function (s) { return 딱(s, false); }).concat((g.살성 || []).map(function (s) { return 딱(s, true); }));
    Object.keys(사화).forEach(function (s) { if (!놓인[s]) 딱들.push('<span class="mb-srow">' + 화딱지(사화[s], g.이름) + '</span>'); });   // 주성 · 보좌 · 살성 밖의 별에 붙은 사화(없어야 맞다)
    h += '<div class="mb-sub">' + 딱들.join('') + '</div>';
    if (g.대한) {
      var now = g.대한.끝해 >= M.해범위[0] && g.대한.시작해 <= M.해범위[1];
      h += '<div class="mb-dh' + (now ? ' now' : '') + '">큰 운 ' + g.대한.시작해 + '~' + String(g.대한.끝해).slice(-2) + '</div>';
    }
    return h + '</div>';
  }
  function 그리기() {
    var R = 결과; if (!R) return;
    var M = R.명반, h = '';
    h += '<div class="mb-top"><div class="sec">' + esc(글('명반.머리', '당신의 명반')) + '</div><p class="why">' + esc(M.해범위[0] + '~' + M.해범위[1]) + '</p></div>';
    var 종류 = []; (M.경계 || []).forEach(function (말) { var k = 경계종류(말); if (k && 종류.indexOf(k) < 0) 종류.push(k); });
    if ((M.경계 || []).length) h += '<div class="mb-edge"><p>' + esc(글('명반.경계', '')) + '</p>' + 종류.map(function (k) { return '<p>' + esc(글('명반.경계종류.' + k, '')) + '</p>'; }).join('') + '</div>';
    h += '<div class="mb" id="mb">' + M.궁.map(궁칸).join('')
      + '<div class="mb-center"><div class="c1">' + esc('당신을 보는 칸(' + 글('명반.명궁표시', '명궁') + ') — ' + 소리(M.명궁지지) + ' 칸 · 명반의 바탕 ' + (오행국한글[M.오행국] || M.오행국) + '(' + M.오행국 + ')') + '</div>'
      + '<div class="c2">' + esc(글('명반.신궁표시', '신궁') + ' — ' + 궁말(M.신궁)) + '</div>'
      + (명식짧게() ? '<div class="c3">' + esc(명식짧게()) + '</div>' : '')
      + '<div class="c3 tap' + (탭본() ? ' still' : '') + '">👆 ' + esc(글('명반.누르기', '')) + '</div></div>'
      + '</div>';
    if (window.ChaeksaZiweiFilter) h += ChaeksaZiweiFilter.html(R.filterStory);
    if (R.filterStory) h += '<details class="mb-original"><summary>열두 궁 전체 풀이</summary>';
    h += 흐름html(M);   // 10-24 열두 칸 글 흐름(결론 → 근거 접힘)
    if (R.filterStory) h += '</details>';
    if (!R.filterStory) h += '<div class="end"><p class="line">' + esc(글('끝.줄', '')) + '</p><p class="why">' + esc(글('끝.풀이', '')) + '</p></div>';
    h += '<div class="share-row"><button type="button" class="btn ghost small" data-share="1">' + esc(글('공유.단추', '이 화면 친구에게 보내기')) + '</button><p class="why" id="shareMsg">' + esc(글('공유.안내', '')) + '</p></div>';
    $('out').innerHTML = h;
  }

  // ── 누르면 열리는 칸
  // 4판(10-15 사장님 「명반 화면에도 넣어」) — 서버가 걸림 · 일부 줄마다 붙여 주는 「오늘 말」(옛 구절을 오늘 삶의 일로 옮긴 한 줄, 비공개 대조표 1225줄)을 직역 아래에.
  //   옮기지 않는 구절(옮긴거리 none)은 문장 자체가 「옛 책은 …고 했다 — 오늘 일로 옮기지 않는다」 꼴이라 머리말 없이, 나머지는 「오늘로 옮기면 — 」을 앞에(머리말은 작가 검수 대상). 서버가 안 주면(옛 판) 아무것도 안 그린다.
  function 오늘말줄(x) {
    if (!x || !x.오늘말) return '';
    return '<p class="t">' + (x.옮긴거리 === 'none' ? '' : esc(글('칸.오늘말머리', '요즘 삶으로 말하면 — '))) + esc(x.오늘말) + '</p>';
  }
  function 원문칸(x, 일부) {
    return '<div class="src' + (일부 ? ' part' : '') + '"><p class="q" lang="zh-Hant">' + esc(x.구절) + '</p>' + (x.뜻 ? '<p class="m">' + esc(x.뜻) + '</p>' : '') + 오늘말줄(x)
      + (일부 && x.왜 ? '<p class="l">' + esc(x.왜) + '</p>' : '') + (x.줄 ? '<p class="l">' + esc(x.줄) + '</p>' : '') + '</div>';
  }
  function 까닭말(k) {
    if (k.종류 === '대한') return '10년 운이 이 자리에 머뭅니다.';
    if (k.종류 === '태세') return '한 해의 운인 태세가 이 자리에 옵니다.';
    if (k.종류 === '소운') return '한 해의 운인 소운이 이 자리에 옵니다.';
    if (k.종류 === '유년사화') return 별쉬운(k.별) + '에 ' + (화한글[k.화] || k.화) + ' 표시가 붙습니다.';
    return k.말 || '';
  }
  function 추론of(key) { var A = (window.MYEONGBAN_COPY || {}).추론 || {}; return A[key] || {}; }
  function 받침말(w, 있음, 없음) { var c = String(w).replace(/[^가-힣]/g, '').slice(-1); if (!c) return 없음; return (c.charCodeAt(0) - 0xAC00) % 28 ? 있음 : 없음; }
  var 으로 = function (w) { var c = String(w).replace(/[^가-힣]/g, '').slice(-1); if (!c) return '로'; var j = (c.charCodeAt(0) - 0xAC00) % 28; return (j === 0 || j === 8) ? '로' : '으로'; };
  // 5판 — 내게 해당하는 쉬운 풀이부터. 조건 미확인·다른 조건·원문·운의 연도는 접어 둔다.
  var 읽기 = window.ChaeksaZiweiReading || { stars: {}, palaces: {}, text: function (s) { return s || ''; } };
  function 읽는말(s) { return 읽기.text(s); }
  function 조건읽기(value) {
    var s = String(value || '');
    Object.keys(궁한글).forEach(function (k) { s = s.split(궁한글[k]).join(궁쉬운(k) + ' 자리'); });
    Object.keys(궁한글).sort(function (a, b) { return b.length - a.length; }).forEach(function (k) { s = s.split(k + '宮').join(궁쉬운(k) + ' 자리').split(k + '궁').join(궁쉬운(k) + ' 자리').split(k).join(궁쉬운(k) + ' 자리'); });
    Object.keys(읽기.stars).sort(function (a, b) { return b.length - a.length; }).forEach(function (k) { s = s.split(k).join(별쉬운(k)); });
    Object.keys(밝기짧게).sort(function (a, b) { return b.length - a.length; }).forEach(function (k) { s = s.split(k).join(밝기짧게[k]); });
    s = 소리(s).replace(/같은 궁/g, '같은 자리').replace(/([자축인묘진사오미신유술해])궁/g, '$1 칸').replace(/^(.+? 자리) ([자축인묘진사오미신유술해])에 /, '$1 · $2 칸 · ');
    s = s.replace(/생시/g, '태어난 시간대').replace(/음시|음궁/g, '음').replace(/양시|양궁/g, '양');
    var parts = s.split(' · '); s = parts.filter(function (p, i) { return parts.indexOf(p) === i; }).join(' · ');
    return /[\u3400-\u9fff]/.test(s) ? '' : s;
  }
  function 풀이줄(l, tag) {
    var conditions = (l.내조건 || []).map(조건읽기).filter(Boolean);
    return '<div class="mb-reading-row">' + (conditions.length ? '<p class="mb-reading-condition">' + esc(conditions.join(' / ')) + '</p>' : '') + '<p class="mb-line">' + (tag ? '<span class="tag">' + esc(tag) + '</span>' : '') + esc(읽는말(l.글 || l)) + '</p></div>';
  }
  function 실제줄(원고, 셀, 내, 더id) {
    var ids = {}; (셀.걸림 || []).forEach(function (x) { ids[x.id] = true; });
    (더id || []).forEach(function (x) { ids[x.id] = true; });
    var sources = (셀.걸림 || []).concat(더id || []);
    return (원고.줄 || []).filter(function (l) { return (l.규칙 || []).some(function (id) { return ids[id]; }) && 밝기맞음(l.밝기, 내); }).map(function (l) {
      var conditions = [];
      sources.forEach(function (x) { if ((l.규칙 || []).indexOf(x.id) >= 0 && x.왜 && conditions.indexOf(x.왜) < 0) conditions.push(x.왜); });
      return { 글: l.글, 갈래: l.갈래, 내조건: conditions };
    });
  }
  function 풀이묶음(줄들, 추론, 특성명) {
    var h = '', seen = {};
    ['특성', '사건'].forEach(function (kind) {
      var ls = 줄들.filter(function (l) { return kind === '특성' ? l.갈래 === '특성' : l.갈래 !== '특성'; });
      var ts = (추론 || {})[kind === '특성' ? '성품' : '일'] || [];
      if (!ls.length && !ts.length) return;
      h += '<div class="sec">' + (kind === '특성' ? esc(특성명 || '성향과 모습') : '삶에서 겪는 일') + '</div>';
      if (ls.length) ls.forEach(function (l) { var t = 읽는말(l.글) + (l.내조건 || []).join('|'); if (!seen[t]) { h += 풀이줄(l); seen[t] = true; } });
      else h += ts.map(function (t) { return 풀이줄(t, '책사의 해석'); }).join('');
    });
    return h;
  }
  function 근거접힘(제목, rows, intro) {
    if (!rows.length) return '';
    var seen = {};
    return '<details class="fold"><summary>' + esc(제목) + '</summary>' + (intro ? '<p class="why">' + esc(intro) + '</p>' : '') + rows.filter(function (x) { var k = x.id || x.구절; if (seen[k]) return false; seen[k] = true; return true; }).map(function (x) { return 원문칸(x, !!x.왜); }).join('') + '</details>';
  }
  function 연도풀이(셀) {
    var years = 셀.움직이는해 || [];
    var h = '<details class="fold"><summary>운이 이 자리에 오는 연도</summary><p class="why">앞으로 20년의 운 배치입니다. 위 풀이의 일이 이 해에 모두 일어난다는 뜻은 아닙니다.</p>';
    if (years.length) h += years.map(function (y) { return '<p class="yr"><b>' + esc(y.해) + '년</b> — ' + esc((y.까닭 || []).map(까닭말).join(' · ')) + '</p>'; }).join('');
    else h += '<p class="mb-none">앞으로 20년 안에 이 별과 자리에 연결되는 운이 계산되지 않았습니다.</p>';
    return h + '</details>';
  }
  function 별시트(key) { 열기(별시트html(key)); }
  function 별시트html(key) {
    var star = key.split('|')[0], palace = key.split('|')[1], cell = 결과.칸[key] || {}, g = 궁of(palace) || {};
    var def = (쪽.별 || {})[star] || (쪽2.별 || {})[star] || {}, 내 = cell.내밝기 || ((g.주성 || []).filter(function (x) { return x.이름 === star; })[0] || {}).밝기 || '';
    var pairs = cell.짝 || [], extra = pairs.filter(function (x) { return x.걸림 === '걸림' && !x.일판칸; });
    var lines = 실제줄(칸글[key] || {}, cell, 내, extra), twin = cell.짝칸;
    var hits = (cell.걸림 || []).slice(), partial = (cell.일부 || []).slice(), other = (cell.안걸림 || []).slice();
    pairs.forEach(function (x) { if (x.일판칸 && !(x.여기있는짝 || []).length) return; (x.걸림 === '걸림' ? hits : x.걸림 === '일부' ? partial : other).push(x); });
    var h = '<p class="sh-k">' + esc(궁쉬운(palace) + ' · ' + (궁한글[palace] || palace)) + '</p>';
    h += '<h2 class="sh-t">' + esc(별쉬운(star)) + '<small>' + esc(별이름(star)) + '</small></h2>';
    if (읽기.stars[star]) h += '<p class="sh-b sh-intro">' + esc(읽기.stars[star]) + '</p>';
    if (cell.실은별) h += '<p class="sh-location">' + esc(별쉬운(cell.실은별) + '에 ' + 별쉬운(star) + 받침말(별쉬운(star), '이', '가') + ' 붙어 있습니다.') + '</p>';
    h += '<p class="sh-context">' + esc(읽기.palaces[palace] || '') + '</p>';
    h += '<p class="why sh-attribution">고전 풀이는 《자미두수전서》에서 옮겼습니다. 책사의 해석은 따로 표시했습니다.</p>';
    var body = 풀이묶음(lines, 추론of(key));
    h += body || '<p class="mb-none">이 별이 이 자리에 있을 때의 풀이 가운데, 조건을 모두 확인한 문장은 아직 없습니다.</p>';
    if (twin) {
      var twinLines = 실제줄(짝칸글[twin.키] || {}, twin, '');
      if (twinLines.length) h += '<div class="sec">' + esc(별쉬운(twin.함께) + 받침말(별쉬운(twin.함께), '과', '와') + ' 함께 읽는 풀이') + '</div>' + twinLines.map(function (l) { return 풀이줄(l); }).join('');
      hits = hits.concat(twin.걸림 || []); partial = partial.concat(twin.일부 || []); other = other.concat(twin.안걸림 || []);
    }
    h += 연도풀이(cell);
    h += 근거접힘('풀이의 고전 원문과 근거', hits, '위 풀이가 연결된 원문입니다. 옛 표현과 그 뜻을 함께 적었습니다.');
    h += 근거접힘('아직 확인할 수 없는 조건', partial, '일부 조건만 확인되어, 위의 내 풀이에는 넣지 않은 대목입니다.');
    h += 근거접힘('내 명반과 다른 조건의 풀이', other, '내게 해당하는 풀이가 아닙니다. 다른 별 배치나 출생 조건을 설명한 대목입니다.');
    h += '<details class="fold"><summary>이 별의 이름과 밝기 알아보기</summary>';
    if (내) h += '<p class="mb-line">이 명반의 밝기: ' + esc(밝기짧게[내] || 내) + '</p><p class="why">실제 빛의 밝기가 아니라, 옛 책이 별의 위치에 붙인 분류입니다. 같은 별도 놓인 자리에 따라 풀이가 달라집니다.</p>';
    if (def.한줄) h += '<p class="mb-line">' + esc(def.한줄) + '</p>';
    if (def.원문) h += 원문칸({ 구절: def.원문, 줄: def.줄 }, false);
    return h + '</details>';
  }
  function 궁시트(name) { var h = 궁시트html(name); if (h) 열기(h); }
  function 궁시트html(name) {
    var g = 궁of(name); if (!g) return '';
    var h = '<p class="sh-k">' + esc(궁한글[name] || name) + '</p><h2 class="sh-t">' + esc(궁쉬운(name)) + '</h2><p class="sh-b sh-intro">' + esc(읽기.palaces[name] || '') + '</p>';
    if (결과.명반.신궁 === name) h += '<p class="why">이곳은 명궁과 짝을 이루는 신궁이기도 합니다.</p>';
    var summaries = [];
    (g.주성 || []).forEach(function (x) {
      var k = x.이름 + '|' + name, c = 결과.칸[k] || {}, extra = (c.짝 || []).filter(function (z) { return z.걸림 === '걸림' && !z.일판칸; });
      var lines = 실제줄(칸글[k] || {}, c, x.밝기 || '', extra), traits = lines.filter(function (l) { return l.갈래 === '특성'; });
      var chosen = traits.length ? traits : lines;
      if (chosen.length) chosen.forEach(function (l) { summaries.push(풀이줄(l, 별쉬운(x.이름))); });
      else { var inferred = 추론of(k), line = (inferred.성품 || inferred.일 || [])[0]; if (line) summaries.push(풀이줄(line, 별쉬운(x.이름) + ' · 책사의 해석')); }
    });
    if (summaries.length) h += '<div class="sec">이 자리의 별에서 읽은 모습</div><p class="why">《자미두수전서》의 풀이와 책사의 해석입니다. 별을 누르면 각각의 근거를 볼 수 있습니다.</p>' + summaries.join('');
    else if (!g.주성.length) h += '<p class="why">이 칸에는 중심이 되는 열네 별이 없습니다. 아래에 있는 다른 별의 풀이를 볼 수 있습니다.</p>';
    var stars = (g.주성 || []).map(function (x) { return [x.이름, 밝기짧게[x.밝기] || '']; }).concat((g.보좌 || []).map(function (x) { return [x, '함께 놓인 별']; }), (g.살성 || []).map(function (x) { return [x, '함께 놓인 별']; }), (g.사화 || []).map(function (x) { return [x.화, 별쉬운(x.별) + '에 붙은 표시']; }));
    var buttons = [], seen = {};
    stars.forEach(function (x) { var k = x[0] + '|' + name; if (seen[k]) return; seen[k] = true; if (결과.칸[k]) buttons.push('<button type="button" data-cell="' + esc(k) + '">' + esc(별쉬운(x[0])) + '<small>' + esc(x[1]) + '</small></button>'); });
    if (buttons.length) h += '<div class="sec">별을 눌러 더 알아보기</div><div class="sh-stars">' + buttons.join('') + '</div>';
    var cell = g.궁줄 || {}, lines = 실제줄(궁줄글[name] || {}, cell, '');
    if (lines.length) h += '<div class="sec">이 자리에 함께 해당하는 풀이</div><p class="why">태어난 시간과 다른 별의 배치까지 살펴본 고전 풀이입니다.</p>' + lines.map(function (l) { return 풀이줄(l); }).join('');
    if (g.대한) h += '<details class="fold"><summary>이 자리의 10년 운</summary><p class="mb-line">' + esc(g.대한.시작해 + '~' + g.대한.끝해 + '년') + '</p><p class="why">명반에서 10년 단위로 옮겨 가는 운을 대한이라고 합니다. 이 기간에는 이 자리의 별을 함께 읽습니다.</p></details>';
    h += 근거접힘('이 자리 풀이의 고전 원문', cell.걸림 || [], '위 풀이가 연결된 원문입니다.');
    h += 근거접힘('아직 확인할 수 없는 조건', cell.일부 || [], '일부 조건만 확인된 대목입니다. 이 일들이 나에게 일어난다고 판정한 것은 아닙니다.');
    h += 근거접힘('내 명반과 다른 조건의 풀이', cell.안걸림 || [], '다른 배치에서의 풀이입니다.');
    return h;
  }
  // ── 10-24 사장님 「ㄱㄱ 명반도」(「결론 (근거 작게) 결론 (근거 작게)」 꼴) — 그림 아래에 열두 칸이 글로 흐른다.
  //   칸마다: 머리(궁 이름 · 지지 칸) → 물음 자리에 쉬운 이름 → 결론 = 그 칸에 선 큰 별마다 「별(밝기) — 첫 줄」(시트가 보여 주던 작가 줄 그대로, 새 문장 없음) → 「근거 보기」 접힘 안에 궁 시트 · 별 시트 전부.
  //   눌러서 열던 시트는 그대로 둔다(그림은 누르고, 흐름은 읽는다).
  function 첫줄(key) {
    var 별 = key.split('|')[0], 셀 = 결과.칸[key], 원고 = 칸글[key] || { 줄: [] }; if (!셀) return '';
    var 내 = 셀.내밝기 || '', 걸림id = {}; (셀.걸림 || []).forEach(function (x) { 걸림id[x.id] = true; });
    (셀.짝 || []).forEach(function (x) { if (x.걸림 === '걸림' && !x.일판칸) 걸림id[x.id] = true; });
    var 줄들 = (원고.줄 || []).filter(function (l) { return (l.규칙 || []).some(function (id) { return 걸림id[id]; }) && 밝기맞음(l.밝기, 내); });
    var 특 = 줄들.filter(function (l) { return l.갈래 === '특성'; }), 사 = 줄들.filter(function (l) { return l.갈래 !== '특성'; });
    if (특.length) return 읽는말(특[0].글); if (사.length) return 읽는말(사[0].글);
    var 추 = 추론of(key); if (추.성품 && 추.성품.length) return 추.성품[0]; if (추.일 && 추.일.length) return 추.일[0];
    if (셀.빈칸) return '이 별이 이 자리에 있을 때는 조건을 모두 확인한 풀이가 아직 없습니다.';
    var 별글 = (쪽2.별 && 쪽2.별[별]) || {}; return 읽기.stars[별] || '';
  }
  function 흐름html(M) {
    var 차례 = M.궁.slice().sort(function (a, b) { return (a.이름 === '命宮' ? 0 : 1) - (b.이름 === '命宮' ? 0 : 1); });
    return 차례.map(function (g) {
      var 결론 = [];
      g.주성.forEach(function (s) { var 줄 = 첫줄(s.이름 + '|' + g.이름); if (줄) 결론.push('<p><b>' + esc(별쉬운(s.이름)) + (s.밝기 ? ' · ' + esc(밝기짧게[s.밝기] || s.밝기) : '') + '</b> — ' + esc(줄) + '</p>'); });
      if (!결론.length) { var 보조 = (g.보좌 || []).concat(g.살성 || []).map(function (x) { return x + '|' + g.이름; }).filter(function (k) { return 결과.칸[k]; })[0]; if (보조) { var 줄b = 첫줄(보조); if (줄b) 결론.push('<p><b>' + esc(별쉬운(보조.split('|')[0])) + '</b> — ' + esc(줄b) + '</p>'); } }
      if (!결론.length && g.궁줄) { var 걸id = {}; (g.궁줄.걸림 || []).forEach(function (x) { 걸id[x.id] = true; }); var 궁줄줄 = ((궁줄글[g.이름] || {}).줄 || []).filter(function (l) { return (l.규칙 || []).some(function (id) { return 걸id[id]; }); }); if (궁줄줄.length) 결론.push('<p>' + esc(읽는말(궁줄줄[0].글)) + '</p>'); }   // 큰 별 줄이 없으면 이 궁에 걸린 궁줄(띠 · 시 · 밝기) 첫 줄
      var 근거 = 궁시트html(g.이름) + g.주성.map(function (s) { return '<div class="mb-flow-sub"><div class="sec">' + esc(별쉬운(s.이름)) + '</div>' + 별시트html(s.이름 + '|' + g.이름) + '</div>'; }).join('');
      return '<section class="card jt-ch mb-flow" id="mbFlow-' + esc(g.이름) + '"><div class="jt-head"><span class="jt-no">' + esc((궁한글[g.이름] || g.이름) + ' · ' + 소리(g.지지) + ' 칸' + (M.신궁 === g.이름 ? ' · ' + 글('명반.신궁표시', '신궁') : '')) + '</span><h2>' + esc(궁쉬운(g.이름) || 궁한글[g.이름] || g.이름) + '</h2></div>'
        + (결론.length ? '<div class="jt-answer mb-flow-ans">' + 결론.join('') + '</div>' : '')
        + '<details class="jt-ev"' + (결론.length ? '' : ' open') + '><summary>근거 보기</summary>' + 근거 + '</details></section>';
    }).join('');
  }
  function 열기(h) {
    $('shBody').innerHTML = h;
    $('shBack').classList.remove('hide'); $('sh').classList.remove('hide'); document.body.classList.add('sh-open');
    $('sh').scrollTop = 0;   // 보인 뒤에 맨 위로(숨긴 채로는 안 먹어서, 앞 시트를 내려 읽고 닫은 뒤 다음 시트가 아래에서 열렸다 — 2판에서 고침)
    requestAnimationFrame(function () { $('shBack').classList.add('on'); $('sh').classList.add('on'); });
  }
  function 닫기() {
    $('shBack').classList.remove('on'); $('sh').classList.remove('on'); document.body.classList.remove('sh-open');
    setTimeout(function () { if (!$('sh').classList.contains('on')) { $('shBack').classList.add('hide'); $('sh').classList.add('hide'); } }, 230);
  }
  // 10-11 사장님 「궁 누르고 별 눌렀다가 뒤로가기 누르면 궁 누른 화면으로 왔으면 좋겠는데」 — 시트를 쌓는다.
  //   시트를 열 때마다 브라우저 기록을 한 칸 쌓아, 휴대폰 뒤로가기 = 한 칸 앞 시트(맨 앞이면 닫기). 별 시트가 궁 시트 위에 열렸으면 맨 위에 「← 궁으로」.
  var 쌓임 = [], 닫는중 = false;
  function 그리기시트(v) {
    if (v.t === '별') 별시트(v.k); else 궁시트(v.k);
    if (쌓임.length > 1) {
      // 「나(명궁)로」 — 조사는 괄호 앞 낱말(쉬운 이름)에 붙인다
      var 앞 = 쌓임[쌓임.length - 2], 말 = 앞.t === '궁' ? '← ' + 궁말(앞.k) + 으로(궁쉬운(앞.k) || 궁한글[앞.k] || 앞.k) : '← 이전으로';
      $('shBody').insertAdjacentHTML('afterbegin', '<button type="button" class="sh-prev" data-shback="1">' + esc(말) + '</button>');
    }
  }
  function 보이기(v) {
    쌓임.push(v);
    try { history.pushState({ mb: 쌓임.length }, ''); } catch (e) {}
    그리기시트(v);
  }
  function 다닫기() {
    var n = 쌓임.length; 쌓임 = []; 닫기();
    if (n) { 닫는중 = true; try { history.go(-n); } catch (e) { 닫는중 = false; } }
  }
  window.addEventListener('popstate', function () {
    if (닫는중) { 닫는중 = false; return; }
    if (!쌓임.length) return;
    쌓임.pop();
    if (쌓임.length) 그리기시트(쌓임[쌓임.length - 1]); else 닫기();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('sh').classList.contains('hide')) 다닫기(); });

  // 10-11 사장님 「움직이니까 눈에 거슬리는데 한번 터치하면 안 움직이면 좋겠어」 — 명반에서 아무 데나 한 번 누르면 안내 알약이 멈추고, 다음에 와도 멈춰 있다(이 기기에만 기억).
  function 탭본() { try { return localStorage.getItem('chaeksa.mbTapSeen') === '1'; } catch (e) { return false; } }
  document.addEventListener('click', function (e) { if (!(e.target.closest && e.target.closest('#out'))) return; try { localStorage.setItem('chaeksa.mbTapSeen', '1'); } catch (e2) {} Array.prototype.forEach.call(document.querySelectorAll('.mb-center .c3.tap'), function (x) { x.classList.add('still'); }); }, true);
  document.addEventListener('click', async function (e) {
    var t = e.target;
    if (t === $('shBack') || (t.closest && t.closest('#shX'))) { 다닫기(); return; }
    if (t.closest && t.closest('[data-shback]')) { history.back(); return; }
    var st = t.closest && t.closest('[data-cell]');
    if (st && 결과) { 보이기({ t: '별', k: st.getAttribute('data-cell') }); return; }
    var gn = t.closest && t.closest('[data-gung]');
    if (gn && 결과) { 보이기({ t: '궁', k: gn.getAttribute('data-gung') }); return; }
    // 공유 — 주소 하나만 보낸다(생일 · 결과는 싣지 않음). brain 과 같은 길(share.js shareLink)
    var sh = t.closest && t.closest('[data-share]');
    if (sh) {
      var 주소 = 'https://chaeksa.kr/myeongban.html', 말 = $('shareMsg');
      var r = window.ChaeksaShare && ChaeksaShare.shareLink ? await ChaeksaShare.shareLink({ title: '정통자미두수 — 책사', text: '별의 배치에서 찾은 당신의 귀한 조건', url: 주소 }) : '';
      if (말) 말.textContent = r === 'copied' ? '주소를 복사했어요. 카톡 대화창에 붙여 넣으세요.' : r === '' ? '이 주소를 보내 주세요 — ' + 주소 : 글('공유.안내', '');
      try { if (r && r !== 'aborted' && window.ChaeksaTrack && ChaeksaTrack.event) ChaeksaTrack.event('myeongban_share'); } catch (e2) {}
      return;
    }
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
    if (p.birth.hour == null) { $('out').innerHTML = ''; $('f').classList.remove('hide'); $('err').textContent = '태어난 시각이 있어야 명반을 그려요. 시각을 넣어 주세요.'; $('hh').focus(); return; }
    $('f').classList.add('hide');
    var 이름 = p.name && p.name !== '이름 없음' ? p.name : p.relation || '나';
    보기({ year: p.birth.year, month: p.birth.month, day: p.birth.day, hour: p.birth.hour, minute: p.birth.minute || 0, gender: p.birth.gender === 'F' ? 'F' : 'M', place: p.birth.place || 'KR:서울' }, 이름, 스크롤);
  }
  try { if (PP) { PP.migrate(); 사람들 = PP.list().filter(function (p) { return p.birth && p.birth.year; }); } } catch (e) { 사람들 = []; }
  if (사람들.length) {
    var 나 = PP.self(), 먼저 = Math.max(0, 사람들.findIndex(function (p) { return 나 && p.id === 나.id; }));
    $('who').innerHTML = '<p class="who-h">저장한 생년월일로 볼 사람을 고르세요</p><div class="who">' + 사람들.map(function (p, i) { return '<button type="button" data-i="' + i + '">' + esc(이름표(p)) + '</button>'; }).join('') + '<button type="button" data-new="1">다른 생년월일 넣기</button></div>';
    $('who').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b) return;
      if (b.getAttribute('data-new')) { Array.prototype.forEach.call(document.querySelectorAll('#who .who button'), function (x) { x.classList.remove('on'); }); b.classList.add('on'); $('f').reset(); $('p').value = 'KR:서울'; $('f').classList.remove('hide'); $('out').innerHTML = ''; $('err').textContent = ''; $('y').focus(); return; }
      고르기(+b.getAttribute('data-i'), true);
    });
    $('f').classList.add('hide');
    고르기(먼저);
  }
  // 처음 넣은 생년월일은 「나」로 남겨 둔다(when.js · gwi.js 와 같은 길, 10-05 「이용자 정보 입력은 프로필로」) — 이미 「나」가 있으면 건드리지 않는다.
  //   10-10 깔때기 ② 생년월일 넣음(profile)도 people.js add 가 여기서 찍는다.
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
    // 시 · 분 숫자 칸(10-06 사장님 「시간 입력 바꿔 줘」) — 분은 비우면 0, 시는 0~23 · 분은 0~59 만
    var 시 = $('hh').value.trim(), 분 = $('mi').value.trim(), g = (document.querySelector('input[name=g]:checked') || {}).value || 'M';
    var body = { year: +$('y').value, month: +$('m').value, day: +$('d').value, hour: 시 === '' || +시 < 0 || +시 > 23 || +시 % 1 ? NaN : +시, minute: 분 === '' ? 0 : +분, gender: g, place: $('p').value };
    if (isNaN(body.minute) || body.minute < 0 || body.minute > 59 || body.minute % 1) { $('err').textContent = '분은 0부터 59까지 넣어 주세요.'; return; }
    if (!body.year || !body.month || !body.day) { $('err').textContent = '태어난 날을 다 넣어 주세요.'; return; }
    if (isNaN(body.hour)) { $('err').textContent = '태어난 시각이 있어야 명반을 그려요. 시각을 넣어 주세요.'; return; }
    남겨두기(body);
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
    } catch (err) { $('err').textContent = '연결하지 못했어요. 다시 눌러 주세요.'; }
  }
})();
