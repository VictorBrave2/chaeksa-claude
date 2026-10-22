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
  // 응답의 판정과 글자는 그대로 두고 표시 순서와 낱말만 바꾼다.
  function 명식말(명식, 성별) {
    var s = String(명식 || '').trim(), 기둥 = s.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g) || [];
    if (기둥.length !== 3 && 기둥.length !== 4) return s;
    var 성 = 성별 === 'F' ? '여자' : 성별 === 'M' ? '남자' : /(?:여|여자)$/.test(s) ? '여자' : /(?:남|남자)$/.test(s) ? '남자' : '';
    return '내 사주(시 · 일 · 월 · 년) — ' + (기둥.length === 3 ? '시 모름 · ' : '') + 기둥.slice().reverse().join(' ') + (성 ? ' · ' + 성 : '');
  }
  var 근거낱말 = {
    '정관': '맡은 역할과 지킬 기준으로 오는 책임(정관)', '편관': '강한 요구와 긴장으로 오는 책임(편관)',
    '정인': '배움(정인)', '편인': '배움(편인)',
    '정재': '쌓이는 돈(정재)', '편재': '움직이는 돈(편재)', '식신': '말과 재능(식신)', '상관': '말과 재능(상관)',
    '비견': '나와 같은 힘(비견)', '겁재': '내 몫을 나누는 힘(겁재)',
    '관성': '책임(관성)', '재성': '돈(재성)', '인성': '배움(인성)', '식상': '말과 재능(식상)', '비겁': '나와 나란한 힘(비겁)',
    '관': '책임(관)', '재': '돈(재)', '인': '배움(인)',
    '천간': '위 글자(천간)', '지지': '아래 글자(지지)', '일간': '나를 뜻하는 글자(일간)',
    '연간': '태어난 해의 위 글자(연간)', '월간': '태어난 달의 위 글자(월간)', '시간': '태어난 시의 위 글자(시간)',
    '연지': '태어난 해의 아래 글자(연지)', '월지': '태어난 달의 아래 글자(월지)', '일지': '태어난 날의 아래 글자(일지)', '시지': '태어난 시의 아래 글자(시지)',
    '본기': '가장 중심이 되는 기운(본기)', '지장간': '아래 글자 속에 든 위 글자(지장간)',
    '합거': '묶여 힘을 못 씀(합거)', '통관': '가운데 글자가 이어 줌(통관)', '제복': '다른 글자가 눌러 막음(제복)',
    '무근': '힘을 받쳐 주는 뿌리가 없음(무근)', '身旺': '나를 뜻하는 글자가 힘을 씀(身旺)',
    '無官': '위 글자에 책임이 없음(無官)', '無印': '위 글자에 배움이 없음(無印)', '藏': '위에는 없고 아래 글자 속에 있음(藏)',
    '失令': '태어난 달의 힘을 못 받음(失令)', '得令': '태어난 달의 힘을 받음(得令)', '被傷': '다른 글자에게 공격받음(被傷)',
    '清': '책임이 맑음(清)', '세운': '그해의 운(세운)', '대운': '큰 흐름의 운(대운)', '원국': '타고난 사주(원국)'
  };
  var 근거낱말식 = new RegExp('(^|[^가-힣一-鿿])(' + Object.keys(근거낱말).sort(function (a, b) { return b.length - a.length; }).join('|') + ')(?=$|[^가-힣一-鿿])', 'g');
  // 10-23 화면 글 검사기 — 근거 줄의 엔진 표시(→ · ○ · × · 합산 · vs · 엄한 읽기)를 말로 옮긴다. 판정 · 값 · 글자는 그대로, 보이는 말만 바꾼다.
  var 간소리 = { 甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무', 己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계', 子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해' };
  var 간끝 = function (c) { var k = 간소리[c]; return k ? (k.charCodeAt(0) - 0xAC00) % 28 : -1; };   // 읽는 소리의 받침 번호(0 없음 · 8 ㄹ)
  var 간조 = function (c, 있, 없) { return c + (간끝(c) > 0 ? 있 : 없); }, 간로 = function (c) { var j = 간끝(c); return c + (j === 0 || j === 8 ? '로' : '으로'); };
  function 표시말(s) {
    var G = '([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥])', 나 = '(나를 뜻하는 글자\\(일간\\)|일간)';
    return String(s || '')
      .replace(new RegExp(G + '→' + G + ' 생', 'g'), function (_, a, b) { return 간조(a, '이', '가') + ' ' + 간조(b, '을', '를') + ' 낳음'; })
      .replace(new RegExp(G + '→' + G + ' 막힘 없이 극', 'g'), function (_, a, b) { return 간조(a, '이', '가') + ' ' + 간조(b, '을', '를') + ' 막힘 없이 침'; })
      .replace(new RegExp(G + '→' + G + ' 막힘', 'g'), function (_, a, b) { return a + '에서 ' + 간로(b) + ' 가다 막힘'; })
      .replace(new RegExp(G + '→' + 나 + ' 닿음', 'g'), function (_, a, b) { return 간조(a, '이', '가') + ' ' + b + '에 닿음'; })
      .replace(new RegExp('\\s*→\\s*' + 나 + ' 닿음', 'g'), ' — $1에 닿음').replace(new RegExp('\\s*→\\s*' + 나 + ' 받음', 'g'), ' — $1가 받음').replace(new RegExp('\\s*→\\s*' + 나 + ' 잡힘', 'g'), ' — $1에 닿기 전에 잡힘')
      .replace(/\s*→\s*/g, ' — ').replace(/합산/g, '모두 더한 힘').replace(/ vs /g, ' 대 ').replace(/\(엄한 읽기\)/g, '(옛 글을 좁게 읽음)')
      .replace(/\s*○(?=\()/g, ' 맞음').replace(/\s*×(?=\()/g, ' 안 맞음').replace(/\s*○/g, '(맞음)').replace(/\s*×/g, '(안 맞음)');
  }
  function 근거말(s) {
    // 「그릇 1 · 2 · 4 · 2/12시(…)」 — 뒤에 붙은 「N/12시」 수는 그릇 수에 넣지 않는다(?![\d\/]).
    return 표시말(String(s || '').replace(/법전\s*\d+조\s*/g, '').replace(/그릇 (\d+(?: · \d+(?![\d\/]))*)/g, '꺼내 쓰는 것 $1가지')
      .replace(/뿌리 없음/g, '힘을 받쳐 주는 아래 글자 없음')
      .replace(/忌\s*[·/]\s*喜\s*는 못 잼/g, '옛 책의 꺼림 · 반김은 재지 않음')
      .replace(/忌\s*는 못 잼/g, '옛 책의 꺼림은 재지 않음').replace(/喜\s*는 못 잼/g, '옛 책의 반김은 재지 않음')
      .replace(/子시 기준/g, '자(子)시를 넣었을 때의 근거')
      .replace(/無印 아님/g, '배움을 뜻하는 위 글자가 있어 이 조건 아님').replace(/無官 아님/g, '책임을 뜻하는 위 글자가 있어 이 조건 아님')
      .replace(근거낱말식, function (_, 앞, 말) { return 앞 + 근거낱말[말]; })
      // 낱말 표는 뒤에 한글이 붙으면 안 바꾼다 — 「천간에 · 지지에」 꼴만 따로(이미 바꾼 「위 글자(천간)」 안은 건드리지 않는다).
      .replace(/(^|[^(가-힣])(천간|지지)([이은가는])(?![가-힣])/g, function (_, 앞, 말, 조) { return 앞 + (말 === '천간' ? '위 글자(천간)' : '아래 글자(지지)') + (조 === '이' || 조 === '가' ? '가' : '는'); }).replace(/(^|[^(가-힣])천간(?=[에의도])/g, '$1위 글자(천간)').replace(/(^|[^(가-힣])지지(?=[에의도])/g, '$1아래 글자(지지)'));
  }
  function 시말(s) { var 글자 = '子丑寅卯辰巳午未申酉戌亥', 소리 = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']; var i = 글자.indexOf(s); return i >= 0 && String(s).length === 1 ? 소리[i] + '(' + s + ')시' : s; }
  // 시를 모를 때 펼친 줄 — 서버 근거의 「N/12시(…시)에서만」 · 「어느 시에서도」만 읽어 원고 틀에 넣는다. 子시 하나를 넣은 근거는 접힌 「원문 보기」 · 「근거 보기」에만 둔다.
  function 시모름말(s, 일부틀, 없음틀) {
    s = String(s || '');
    var m = /(\d+)\/12시\(([子丑寅卯辰巳午未申酉戌亥]+)시\)에서만/.exec(s);
    if (m) return 틀(일부틀, { 시들: m[2].split('').map(시말).join(' · ') });
    return /어느 시에서도/.test(s) ? 없음틀 : '';
  }
  // 옛 책 짜임이 없을 때 펼친 줄 — 서버 근거(lib/gwi-saju.js 정의 · 덧정의 판)가 어디서 멈췄는지를 짜임마다 읽어 원고 갈래(옛.항목.<id>.없음갈래) 한 줄을 고른다.
  //   판정은 서버 그대로 — 여기서는 근거 문자열의 고정 꼴만 본다. 못 고르면 그 짜임의 없음말. 근거 원문은 접힌 「원문 보기」에만.
  var 없음갈래표 = {
    G1: [['관죽음', /^살아 있는 관 천간 없음$/], ['나약함', /身旺 아님/], ['인없음', /살아 있는 인 천간 없음$/], ['칠것없음', /지킬 일이 없음/], ['못지킴', / ×$/]],
    G2: [['겁없음', /^살아 있는 비겁 천간 없음/], ['관죽음', /살아 있는 관 천간 없음$/], ['통관', /막힘\(통관/], ['제복', /막힘\(제복/], ['힘차이', /막힘\(힘차이\)/]],
    G3: [['인없음', /^살아 있는 인 천간 없음/], ['관죽음', /살아 있는 관 천간 없음$/], ['끊김', /쳐 약함\) ×/]],
    G4: [['재없음', /^살아 있는 재 천간 없음$/], ['관죽음', /살아 있는 관 천간 없음$/], ['재다침', /재를 쳐 약함/], ['관못닿음', / ×$/]],
    G5: [['관죽음', /^살아 있는 관 천간 없음$/], ['재기운없음', /재 천간 없음 · 지지 본기 없음$/]],
    G6: [['관있음', /無官 아님$/], ['국아님', /국 아님$/]],
    G7: [['드러남', /藏 아님$/], ['둘다아님', /^천간 관 · 재 없음/]],
    C1: [['관없음', /^천간에 관 없음$/], ['두배아님', /두 배 안 됨$/]],
    C2: [['관없음', /^천간에 관 없음$/], ['두배아님', /두 배 안 됨$/]],
    C3: [['관있음', /無官 아님$/], ['두배아님', /두 배 안 됨$/]],
    C4: [['인있음', /無印 아님$/], ['두배아님', /두 배 안 됨$/]],
    C5: [['관죽음', /^살아 있는 관 천간 없음$/], ['득령', /\(得令\)/], ['안다침', /관을 막힘 없이 치는 산 글자 없음$/]]
  };
  function 없음말(x, a) {
    var s = String(x.근거 || '');
    if (/^시를 모름/.test(s)) return 틀(글('옛.시모름없음'), { 근거: 시모름말(s, 글('옛.시모름일부'), 글('옛.시모름전부없음')) }).trim();
    var 표 = 없음갈래표[x.id] || [], 갈 = a.없음갈래 || {};
    for (var i = 0; i < 표.length; i++) if (표[i][1].test(s) && 갈[표[i][0]]) return 갈[표[i][0]];
    return a.없음말 || '';
  }
  var 출처말 = function (s) { return String(s || '').replace(/ · (docs|jamidusu)\/\S+/g, ''); };
  var 귀묶음 = '귀하다고 꼽은 짜임', 천묶음 = '벼슬에서 멀다고 본 짜임', 덧묶음 = '수에 넣지 않은 짜임';
  // 옛 책 짜임 한 칸 — 이름 · 있음말/없음말(원고)은 펼쳐 두고, 원문 · 뜻 · 근거(엔진 값) · 출처는 접는다. 이름 · 말은 원고(1층 말), 원문은 서버 그대로, 근거는 표시 낱말만 풀이한다.
  function 짜임칸(x, 묶음, 성) {
    var a = (C.옛 && C.옛.항목 && C.옛.항목[x.id]) || {};
    var 못잼 = x.걸림 === '못잼', 상태 = 못잼 ? '세지 않음' : x.걸림 ? '내 사주에 있음' : '내 사주에 없음';
    var 말 = 못잼 ? (a.못잼말 || '') : x.걸림 ? (a.걸림말 || '') : 없음말(x, a);
    return '<div class="card"><div class="k">' + esc(묶음 + ' · ' + 상태) + '</div><div class="y" style="font-size:var(--t4)">' + esc(a.이름 || x.이름) + '</div>'
      + (말 ? '<p>' + esc(말) + '</p>' : '')
      + '<details class="fold"><summary>원문 보기</summary><p class="q" lang="zh-Hant">' + esc(x.원문) + '</p>' + (a.뜻 ? '<p class="why">' + esc(a.뜻) + '</p>' : '')
      + '<p class="why"><small>' + esc(근거말(x.근거)) + '<br>' + esc(출처말(x.출처)) + (x.p == null ? '' : '<br>이 짜임이 있는 사람 — 같은 ' + esc(성) + ' 가운데 ' + esc(x.p) + '%') + '</small></p></details></div>';
  }
  // 굵은 빈도 줄 — 「n개 이상 p%」 + 「꼭 n개 q%」. 0개면 「q%가 나처럼 하나도 없어요」. 표본에 n개 이상이 없으면 드묾없음.
  function 빈도줄(T) {
    if (!T.n) return 틀(글('옛.빈도.없음빈도'), { q: T.q });
    var 이상 = T.p > 0 ? 틀(글('옛.빈도.이상'), { n: T.n, p: T.p }) : 틀(글('옛.빈도.드묾없음'), { n: T.n });
    return 이상 + (T.q == null ? '' : ' ' + 틀(글('옛.빈도.꼭'), { n: T.n, q: T.q }));
  }
  var 걸린 = function (x) { return x.걸림 === true; }, 안걸린 = function (x) { return x.걸림 !== true; };
  // 10-11 운에서 받는 해 — 해마다 「{해}년 — {글자뜻}({글자})」 + 가장 가까운 해를 앞세운 한 줄(작가 misc-copy-1010 「귀받는해」 → 원고 지금.관통.받는해목록). 판정 말 없음.
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
    var k = B.줄.search(/{글자(?:뜻)?}/), 앞틀 = k < 0 ? B.줄 : B.줄.slice(0, k), 글자틀 = k < 0 ? '' : B.줄.slice(k);
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
  // 관통이 없을 때 펼친 줄 — 서버 칸(시모름 · 관있음 · 산관있음)과 근거의 「합거」로 원고 갈래 한 줄을 고른다. 근거 원문은 접힌 「근거 보기」에만.
  function 관통없음말(t) {
    var s = String(t.근거 || ''), k;
    if (t.시모름) return 틀(글('지금.관통.없음갈래.시모름'), { 근거: 시모름말(s, 글('지금.관통.없음갈래.시모름일부'), 글('지금.관통.없음갈래.시모름전부없음')) }).trim() + ' ' + 글('지금.관통.없음');
    k = t.관있음 === false ? '관없음' : t.산관있음 === false ? (/합거/.test(s) ? '묶임' : '무근') : t.산관있음 === true ? '막힘' : '기본';
    return 글('지금.관통.없음갈래.' + k) + ' ' + 글('지금.관통.없음');
  }
  function 그리기() {
    var R = 결과; if (!R) return;
    var 옛 = R.옛, 귀 = 옛.귀, 천 = 옛.천, J = R.지금, 성 = 성별말(R.성별), 표본 = R.표본 ? R.표본[R.성별 === 'F' ? '여' : '남'] : null, h = '';
    h += '<p class="why" style="margin:0 2px var(--s2)"><small>' + esc(명식말(R.명식, R.성별)) + (옛.시모름 ? '<br>' + esc(글('입력.시모름안내')) : '') + '</small></p>';
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
    h += '<div class="duo"><div class="card"><div class="k">' + esc(글('지금.그릇넷.이름')) + '</div><div class="y">' + (g.걸림 ? '넷' : esc(단계글 ? 단계글 + '가지' : '가짓수 미확정') + '<small> · ' + (g.시모름 && g.단계 == null ? '시에 따라 다름' : '넷 아님') + '</small>') + '</div></div>'
      + '<div class="card"><div class="k">' + esc(글('지금.관통.이름')) + '</div><div class="y">' + (t.걸림 ? '있음' : '없음') + '</div></div></div>';
    h += '<div class="big"><p><b>' + esc(틀(글('지금.함께'), { k: [g.걸림, t.걸림].filter(function (v) { return v === true; }).length, p: J.함께p })) + '</b></p></div>';
    h += '<p class="why">' + esc(글('지금.머리')) + '</p>';
    h += '<div class="card"><div class="k">' + (g.걸림 ? '내 사주에 있음' : '내 사주에 없음') + '</div><div class="y" style="font-size:var(--t4)">' + esc(글('지금.그릇넷.이름')) + '</div>'
      + '<p>' + esc(g.걸림 ? 글('지금.그릇넷.걸림') : 틀(글(g.시모름 && g.단계 == null ? '지금.그릇넷.시따라' : '지금.그릇넷.없음'), { 단계: 단계글 })) + '</p>'
      + (!g.걸림 && g.단계 === 3 ? '<p>' + esc(글('지금.그릇넷.셋')) + '</p>' : '')
      + (g.시모름 && g.단계 != null ? '<p class="why">' + esc(글('지금.그릇넷.시같음')) + '</p>' : '')
      + '<p class="why"><b>' + esc(틀(글('지금.그릇넷.빈도'), { p: g.p })) + '</b></p>'
      + '<details class="fold"><summary>근거 보기</summary><p class="why"><small>' + esc(근거말(g.근거)) + '</small></p></details></div>';
    var 받 = t.받는해 || [], 일간 = String(R.명식 || '').split(' ')[2] ? String(R.명식).split(' ')[2].charAt(0) : '', 올해 = t.받는해범위 ? t.받는해범위[0] : new Date().getFullYear();
    h += '<div class="card"><div class="k">' + (t.걸림 ? '내 사주에 있음' : '내 사주에 없음') + '</div><div class="y" style="font-size:var(--t4)">' + esc(글('지금.관통.이름')) + '</div>'
      + '<p>' + esc(t.걸림 ? 글('지금.관통.걸림') : 관통없음말(t)) + '</p>'
      + (t.걸림 ? '' : 받.length ? 받는해칸(받, 일간, 올해) : '<p>' + esc(글('지금.관통.받는해없음')) + '</p>')
      + (t.시모름 ? '<p class="why">' + esc(글('지금.관통.시모름')) + '</p>' : '')
      + '<p class="why"><b>' + esc(틀(글('지금.관통.빈도'), { p: t.p })) + '</b></p>'
      + '<details class="fold"><summary>근거 보기</summary><p class="why"><small>' + esc(근거말(t.근거))
      + (t.받는해 || []).map(function (x) { return '<br>' + esc(근거말(x.해 + '년 ' + (x.간지 || '') + ' — ' + (x.글자 || []).join(' · '))); }).join('') + '</small></p></details></div>';
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
