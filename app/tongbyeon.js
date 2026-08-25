/* 책사 통변 엔진 v1 — 명리 구조 → 현실 시나리오(경쟁 가설)
 *
 * 설계 원칙
 *  1) 시나리오·가설·질문은 전부 이 파일의 규칙이 정한다. LLM은 서술만 한다.
 *  2) 가설은 항상 2개 이상 경쟁시킨다. 하나만 말하면 점집이 된다.
 *  3) 모든 가설에는 (현실신호 / 판별질문 / 실행과제 / 관측지표)가 붙는다.
 *     관측지표가 없는 가설은 검증이 불가능하므로 만들지 않는다.
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine, f = E.fmt;

  const GROUP = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성', 정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };
  const GROUP_MEAN = {
    비겁:'나와 같은 기운 — 자립·경쟁·동료',
    식상:'내가 내보내는 기운 — 표현·생산·재능',
    재성:'내가 다루는 기운 — 돈·실물·성과',
    관성:'나를 규율하는 기운 — 책임·직위·압박',
    인성:'나를 살리는 기운 — 배움·지원·문서',
  };

  // ───────── 도메인 판별 ─────────
  const DOMAINS = [
    { key:'career', label:'직업·사업', kw:['직업','사업','일','회사','이직','전직','퇴사','창업','승진','진급','자리','커리어','매장','가게','확장','장사','업무','상사','조직','프리랜서','팀'] },
    { key:'wealth', label:'재물·돈',   kw:['돈','재물','재테크','투자','수입','매출','자금','대출','빚','저축','부동산','주식','현금','정산','수익','손해','계약금'] },
    { key:'love',   label:'관계·인연', kw:['연애','결혼','인연','배우자','남자친구','여자친구','이혼','재혼','만남','소개팅','사람','관계','갈등','가족','부모','자식','친구'] },
    { key:'health', label:'건강·체력', kw:['건강','몸','체력','병','아프','수술','피로','스트레스','잠','불면','정신','우울'] },
    { key:'study',  label:'학업·시험', kw:['공부','시험','자격증','합격','학교','대학','유학','고시','면접','취업','자격'] },
    { key:'move',   label:'이동·거처', kw:['이사','이동','이주','집','거처','해외','지방','이전','사무실','매물','전세','매매'] },
  ];
  function detectDomain(q) {
    const t = String(q || '');
    let best = null, bestN = 0;
    for (const d of DOMAINS) {
      const n = d.kw.reduce((s, k) => s + (t.includes(k) ? 1 : 0), 0);
      if (n > bestN) { best = d; bestN = n; }
    }
    return best || DOMAINS[0];
  }

  // ───────── 시기 판별 ─────────
  const KO_STEM = E.STEMS_KO, KO_BRANCH = E.BRANCHES_KO;
  function detectTarget(q, result, today) {
    const t = String(q || '');
    // 1) 간지 대운 지목 (무신대운 / 戊申대운)
    for (const du of result.daeun.list) {
      const ko = KO_STEM[du.stem] + KO_BRANCH[du.branch];
      const han = f.stem(du.stem) + f.branch(du.branch);
      if (t.includes(ko) || t.includes(han)) return { level:'대운', du, label:`${ko}(${han}) 대운`, from:du.startYear, to:du.startYear + 9, age:`${du.startAge}~${du.endAge}세` };
    }
    // 2) 연도 지목
    const m = t.match(/(20\d{2})\s*년?/);
    if (m) {
      const y = +m[1];
      const du = result.daeun.list.find(d => y >= d.startYear && y <= d.startYear + 9);
      const tf = E.dateFortune(y, 6, 15);
      if (du && (t.includes('대운') || y > today.getFullYear() + 1)) {
        const ko = KO_STEM[du.stem] + KO_BRANCH[du.branch];
        return { level:'대운', du, label:`${ko}(${f.pillar(du)}) 대운`, from:du.startYear, to:du.startYear + 9, age:`${du.startAge}~${du.endAge}세`, askedYear:y };
      }
      return { level:'세운', year:y, pillar:tf.year, du, label:`${y}년`, from:y, to:y };
    }
    // 3) 상대 표현
    const cy = today.getFullYear();
    if (t.includes('내년')) { const tf = E.dateFortune(cy + 1, 6, 15); return { level:'세운', year:cy + 1, pillar:tf.year, du:E.currentDaeun(result, new Date(cy + 1, 5, 15)), label:`${cy + 1}년`, from:cy+1, to:cy+1 }; }
    if (t.includes('이번 달') || t.includes('이달')) { const tf = E.dateFortune(cy, today.getMonth() + 1, 15); return { level:'월운', pillar:tf.month, du:E.currentDaeun(result, today), label:`${today.getMonth() + 1}월`, from:cy, to:cy }; }
    // 4) 기본: 현재 대운
    const du = E.currentDaeun(result, today);
    if (du) { const ko = KO_STEM[du.stem] + KO_BRANCH[du.branch]; return { level:'대운', du, label:`지금 ${ko}(${f.pillar(du)}) 대운`, from:du.startYear, to:du.startYear + 9, age:`${du.startAge}~${du.endAge}세` }; }
    const tf = E.dateFortune(cy, 6, 15);
    return { level:'세운', year:cy, pillar:tf.year, du:null, label:`${cy}년`, from:cy, to:cy };
  }

  // ───────── 6D 시간 스택 ─────────
  const YUKHAP = { 0:1,1:0,2:11,11:2,3:10,10:3,4:9,9:4,5:8,8:5,6:7,7:6 };
  const SAMHAP = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]];
  function branchRel(a, b) {
    if (a === b) return '복음';
    if ((b - a + 12) % 12 === 6) return '충';
    if (YUKHAP[a] === b) return '육합';
    if (SAMHAP.some(g => g.includes(a) && g.includes(b))) return '삼합';
    return null;
  }
  function stack(result, target, today) {
    const a = result.analysis, ds = a.dayStem, p = result.pillars;
    const godOf = (stem) => E.TEN_GODS[E.tenGod(ds, stem)];
    const layers = [];
    layers.push({
      level:'원국', ganji:`${f.pillar(p.year)} ${f.pillar(p.month)} ${f.pillar(p.day)} ${p.hour ? f.pillar(p.hour) : '(시 모름)'}`,
      note:`${f.stem(ds)} 일간 · ${a.strength} · 월지 ${f.branch(p.month.branch)}${a.gotMonth ? ' 득령' : ' 실령'} · 없는 오행 ${a.missing.join('·') || '없음'}`,
    });
    const du = target.du;
    if (du) {
      const rels = [];
      ['year','month','day','hour'].forEach(k => { if (!p[k]) return; const r = branchRel(p[k].branch, du.branch); if (r) rels.push(`${{year:'연지',month:'월지',day:'일지',hour:'시지'}[k]}와 ${r}`); });
      layers.push({ level:'대운', ganji:f.pillar(du), note:`${godOf(du.stem)} / ${E.TEN_GODS[E.tenGod(ds, E.HIDDEN[du.branch][0])]} · ${du.startYear}~${du.startYear + 9} (${du.startAge}~${du.endAge}세)${rels.length ? ' · ' + rels.join(', ') : ''}` });
    }
    const yr = target.level === '세운' ? target.year : (target.askedYear || target.from || today.getFullYear());
    const tfy = E.dateFortune(yr, 6, 15);
    const relY = branchRel(p.day.branch, tfy.year.branch);
    layers.push({ level:'세운', ganji:f.pillar(tfy.year), note:`${godOf(tfy.year.stem)} · ${yr}년${relY ? ' · 일지와 ' + relY : ''}` });
    if (target.level === '월운') {
      const tfm = E.dateFortune(today.getFullYear(), today.getMonth() + 1, 15);
      layers.push({ level:'월운', ganji:f.pillar(tfm.month), note:`${godOf(tfm.month.stem)} · ${today.getMonth() + 1}월` });
    }
    return layers;
  }

  // ───────── 통변 규칙 ─────────
  const RULES = {};
  function R(domain, group, strength, def) { RULES[`${domain}|${group}|${strength}`] = def; }
  const H = (id, title, prior, basis, signs, action, metric) => ({ id, title, prior, basis, signs, action, metric });
  const Q = (id, q, effects) => ({ id, q, effects });

  /* ═══ 직업·사업 (완전) ═══ */
  R('career','관성','weak',{
    theme:'책임의 크기와 통제력의 크기',
    lead:'지금은 일의 크기보다 내가 통제할 수 있는 범위가 얼마나 커지는지를 먼저 보겠습니다.',
    H:[
      H('bottleneck','역할은 커지지만 운영 병목이 먼저 나타난다',.62,
        '책임을 지우는 기운(관성)이 들어오는데 일간이 이를 받칠 힘이 얇습니다. 할 일이 늘어나는 속도와 그것을 처리할 자원이 늘어나는 속도가 어긋나기 쉬운 구간입니다.',
        ['매출이나 고객은 늘지만 내가 처리할 일도 같이 늘어난다','중요한 결정은 내가 하는데 실행할 사람이 부족하다','새 기회는 생기지만 기존 업무가 발목을 잡는다','외형은 커지는데 현금흐름이나 정산 주기는 오히려 불편해진다'],
        '반드시 나를 거쳐야만 돌아가는 업무 세 가지를 적어보세요. 그중 하나를 이번 달 안에 넘기거나 자동화하세요.',
        '30일 동안 내가 없어도 처리된 업무의 비율'),
      H('expansion','권한과 자원이 함께 커지며 확장 국면으로 넘어간다',.38,
        '같은 기운이라도 결정권과 자원이 함께 들어오면 해석이 달라집니다. 일이 많아지는 것이 아니라 움직일 수 있는 판 자체가 커지는 경우입니다.',
        ['새 업무를 맡으면서 사람을 직접 배치할 수 있다','비용과 예산을 스스로 결정할 수 있다','사업의 방향까지 선택할 수 있게 된다'],
        '앞으로 6개월 안에 무엇을 얼마까지 키울지 숫자로 하나만 정해두세요.',
        '내가 단독으로 집행할 수 있는 예산의 규모'),
    ],
    Q:[
      Q('resp','지금보다 책임지는 영역이 실제로 늘고 있습니까?',{ bottleneck:{y:1.35,n:.45}, expansion:{y:1.30,n:.40} }),
      Q('auth','책임과 함께 결정권도 늘고 있습니까?',{ bottleneck:{y:.55,n:1.55}, expansion:{y:2.20,n:.40} }),
      Q('res','사람·자금·시간 중 하나라도 새로 통제할 수 있게 됐습니까?',{ bottleneck:{y:.60,n:1.45}, expansion:{y:2.00,n:.45} }),
    ],
  });
  R('career','관성','strong',{
    theme:'맡을 힘은 있다 — 자리를 잡을 것인가, 부딪힐 것인가',
    lead:'책임을 감당할 체력은 있는 구간입니다. 문제는 그 힘을 어디에 쓰느냐입니다.',
    H:[
      H('promote','공식적인 자리와 역할로 정리된다',.58,'일간이 관성을 감당할 만큼 단단합니다. 책임이 곧 직위·계약·공식 관계로 굳어지기 쉬운 구간입니다.',
        ['승진·재계약·정규 전환 같은 이야기가 나온다','공적인 자리에서 이름이 불린다','문서로 확정되는 일이 늘어난다'],
        '지금 맡은 역할을 문서로 확정 짓는 일을 하나 진행하세요. 계약서, 직무기술서, 합의 메일 무엇이든.',
        '내 역할이 문서로 명시되어 있는가 (예/아니오)'),
      H('friction','책임은 늘지만 조직·상대와 마찰이 커진다',.42,'힘이 있는 만큼 규율을 거스르기도 쉽습니다. 내 방식과 조직의 방식이 부딪히는 국면입니다.',
        ['윗사람이나 발주처와 방향이 자주 어긋난다','규칙·절차가 답답하게 느껴진다','내가 옳다고 생각한 방식이 제지당한다'],
        '충돌하는 사안 하나를 골라, 이기는 대신 기록으로 남기세요. 판단이 옳았는지는 나중에 문서가 증명합니다.',
        '한 달간 발생한 방향 충돌 횟수'),
    ],
    Q:[
      Q('title','직위·계약·역할이 문서로 정리되는 움직임이 있습니까?',{ promote:{y:2.10,n:.45}, friction:{y:.65,n:1.35} }),
      Q('conflict','최근 윗사람이나 거래처와 방향이 어긋나는 일이 잦습니까?',{ promote:{y:.60,n:1.40}, friction:{y:2.00,n:.50} }),
      Q('rule','규칙과 절차가 예전보다 답답하게 느껴집니까?',{ promote:{y:.75,n:1.25}, friction:{y:1.70,n:.60} }),
    ],
  });
  R('career','재성','weak',{
    theme:'일과 돈은 몰려오는데 내 체력이 따라가는가',
    lead:'기회의 양보다 그것을 감당할 내 체력과 집중을 먼저 보겠습니다.',
    H:[
      H('overload','기회는 늘지만 분산되어 체력이 먼저 바닥난다',.60,'다룰 대상(재성)이 커지는데 일간이 얇습니다. 벌인 일이 나를 소모시키는 구조가 되기 쉽습니다.',
        ['거래·제안·연락이 늘어난다','동시에 여러 건을 붙잡고 있다','바쁜데 남는 게 없다는 느낌이 든다','몸이 먼저 신호를 보낸다'],
        '지금 붙잡고 있는 일을 전부 적고, 수익 기준 하위 절반을 이번 달에 정리하세요.',
        '동시에 진행 중인 건수'),
      H('delegate','실무를 넘기고 관리·선별로 전환하며 자리를 잡는다',.40,'같은 구간이라도 직접 하기를 멈추고 고르는 역할로 옮기면 재성이 부담이 아니라 성과가 됩니다.',
        ['일을 맡길 사람이나 외주가 생겼다','내가 고르는 기준이 생겼다','거절해도 관계가 깨지지 않는다'],
        '이번 주에 들어온 제안 중 하나를 명시적으로 거절해보세요. 거절 기준을 한 줄로 정해두세요.',
        '내가 직접 실행하지 않고 넘긴 건수의 비율'),
    ],
    Q:[
      Q('inflow','제안·거래·연락이 예전보다 늘었습니까?',{ overload:{y:1.30,n:.50}, delegate:{y:1.15,n:.60} }),
      Q('hand','그 일을 맡길 사람이나 외주가 있습니까?',{ overload:{y:.55,n:1.50}, delegate:{y:2.10,n:.40} }),
      Q('tired','바쁜 것에 비해 남는 게 적다고 느낍니까?',{ overload:{y:1.80,n:.55}, delegate:{y:.55,n:1.45} }),
    ],
  });
  R('career','재성','strong',{
    theme:'확장의 적기인가, 과잉의 시작인가',
    lead:'벌일 힘이 있는 구간입니다. 그래서 오히려 어디서 멈출지를 함께 정해두어야 합니다.',
    H:[
      H('expand','실질적인 확장으로 이어진다',.58,'일간이 단단한데 다룰 대상이 커집니다. 벌인 만큼 거둘 수 있는 배치입니다.',
        ['새 거래처·상품·지점 이야기가 구체적으로 진행된다','투입 대비 회수가 눈에 보인다','사람을 늘려도 관리가 된다'],
        '확장안 하나를 골라 90일 안에 검증 가능한 최소 규모로 먼저 실행하세요.',
        '투입 대비 90일 회수율'),
      H('overreach','외형은 커지지만 현금이 막힌다',.42,'벌이는 힘이 강할수록 회수보다 지출이 앞서기 쉽습니다. 매출과 현금흐름을 분리해서 봐야 하는 구간입니다.',
        ['매출은 느는데 통장은 빠듯하다','입금보다 지출이 먼저 나간다','재고·인건비·광고비가 매출보다 빨리 는다'],
        '이번 달 순현금흐름(입금 − 실제 지출)을 한 줄로 계산해서 적어두세요. 매출이 아니라 잔액입니다.',
        '월 순현금흐름'),
    ],
    Q:[
      Q('cash','매출이 늘 때 통장 잔액도 같이 늘고 있습니까?',{ expand:{y:2.00,n:.45}, overreach:{y:.50,n:1.60} }),
      Q('cost','비용 증가율이 매출 증가율보다 높습니까?',{ expand:{y:.55,n:1.40}, overreach:{y:2.10,n:.50} }),
      Q('manage','사람을 늘렸을 때 관리가 감당됩니까?',{ expand:{y:1.60,n:.60}, overreach:{y:.65,n:1.30} }),
    ],
  });
  R('career','식상','weak',{
    theme:'낼 것은 많은데 낼 힘이 있는가',
    lead:'아이디어의 양보다 그것을 끝까지 밀고 갈 체력을 먼저 보겠습니다.',
    H:[
      H('drain','표현·기획은 살아나지만 실행에서 소모된다',.58,'내보내는 기운이 강한데 일간이 얇으면 쏟아낸 만큼 자신이 비워집니다.',
        ['하고 싶은 것은 많은데 마무리가 밀린다','시작한 일이 여러 개 열려 있다','말과 기획은 앞서고 결과는 늦다'],
        '열려 있는 일 중 하나만 골라 이번 달에 끝내고, 나머지는 명시적으로 보류 표시를 하세요.',
        '한 달간 완료한 건수 ÷ 시작한 건수'),
      H('pivot','표현·기획 쪽으로 역할을 옮겨 자리를 찾는다',.42,'실행을 남에게 넘기고 만들고 설계하는 자리로 옮기면 같은 기운이 강점이 됩니다.',
        ['내가 만든 것이 반응을 얻는다','실행은 다른 사람이 맡아준다','기획·콘텐츠·설계로 불려간다'],
        '내가 만든 것 하나를 이번 달에 외부에 공개하세요. 완성도보다 공개가 먼저입니다.',
        '외부에 공개한 결과물 수'),
    ],
    Q:[
      Q('finish','최근 시작한 일보다 끝낸 일이 많습니까?',{ drain:{y:.50,n:1.55}, pivot:{y:1.45,n:.65} }),
      Q('react','내가 만든 것에 외부 반응이 오고 있습니까?',{ drain:{y:.75,n:1.20}, pivot:{y:1.95,n:.50} }),
      Q('exec','실행을 맡아줄 사람이 있습니까?',{ drain:{y:.60,n:1.35}, pivot:{y:1.80,n:.55} }),
    ],
  });
  R('career','식상','strong',{
    theme:'판을 넓힐 것인가, 나갈 것인가',
    lead:'만들어 낼 힘이 충분한 구간입니다. 방향만 정하면 됩니다.',
    H:[
      H('newline','새 상품·서비스로 판을 넓힌다',.55,'일간이 단단한데 내보내는 기운이 강합니다. 새로 만드는 일에 힘이 실립니다.',
        ['새 상품·콘텐츠·라인 아이디어가 구체적이다','기존 고객이 새 요구를 준다','만들면 팔린다는 감각이 있다'],
        '새 라인 하나를 4주 안에 시험 가능한 최소 형태로 내놓으세요.',
        '신규 라인의 첫 매출 발생까지 걸린 일수'),
      H('breakout','기존 틀과 충돌하며 독립 압력이 커진다',.45,'내보내는 기운이 강하면 규율과 부딪힙니다. 조직 안이 답답해지는 국면입니다.',
        ['조직의 방식이 견디기 어렵다','내 이름으로 하고 싶다는 생각이 자주 든다','상사·발주처와 방향이 어긋난다'],
        '나가기 전에 지금 자리에서 6개월치 생활비와 첫 고객 한 명을 먼저 확보하세요.',
        '독립 시 확보된 고정 수입 개월 수'),
    ],
    Q:[
      Q('idea','새로 만들 것에 대한 구상이 구체적입니까?',{ newline:{y:1.80,n:.55}, breakout:{y:1.10,n:.85} }),
      Q('stuck','지금 조직·구조가 답답하게 느껴집니까?',{ newline:{y:.70,n:1.25}, breakout:{y:2.00,n:.50} }),
      Q('base','독립한다면 첫 고객이나 고정 수입이 준비돼 있습니까?',{ newline:{y:1.00,n:1.00}, breakout:{y:1.70,n:.55} }),
    ],
  });
  R('career','인성','weak',{
    theme:'기반을 쌓는 시기 — 다만 준비가 목적이 되지 않도록',
    lead:'지금은 성과보다 기반이 먼저 움직이는 구간으로 보입니다.',
    H:[
      H('build','배움·자격·지원으로 기반이 단단해진다',.60,'나를 살리는 기운이 들어오고 일간이 이를 필요로 합니다. 채워지는 구간입니다.',
        ['도와주는 사람이나 스승이 나타난다','자격·문서·학습 기회가 생긴다','쉬어도 죄책감이 덜하다'],
        '이번 달에 배움이나 자격 하나를 실제로 등록하세요. 알아보는 것 말고 등록입니다.',
        '완료한 학습·자격 항목 수'),
      H('stall','준비만 길어지고 실행이 계속 밀린다',.40,'같은 기운이라도 과하면 생각이 실행을 대체합니다. 준비가 목적이 되는 국면입니다.',
        ['자료 조사와 계획만 반복한다','시작할 조건이 아직 부족하다고 느낀다','남과 비교하며 미룬다'],
        '준비 중인 일 하나를 이번 주에 불완전한 상태로 시작하세요. 마감을 먼저 박으세요.',
        '착수까지 걸린 일수'),
    ],
    Q:[
      Q('help','도와주는 사람이나 배울 기회가 실제로 나타났습니까?',{ build:{y:1.85,n:.50}, stall:{y:.75,n:1.20} }),
      Q('start','준비 중인 일을 실제로 시작했습니까?',{ build:{y:1.35,n:.70}, stall:{y:.45,n:1.80} }),
      Q('delay','조건이 아직 부족하다고 느껴 미루고 있습니까?',{ build:{y:.65,n:1.30}, stall:{y:1.95,n:.50} }),
    ],
  });
  R('career','인성','strong',{
    theme:'생각이 깊어지는 시기 — 결정 지연을 경계',
    lead:'판단의 재료는 충분한 구간입니다. 남는 문제는 결정 속도입니다.',
    H:[
      H('depth','전문성·자격으로 격이 올라간다',.52,'쌓아온 것이 형태를 갖추는 구간입니다.',
        ['전문성으로 불려가는 자리가 생긴다','글·강의·자문 제안이 온다','내 기준이 남에게 인정된다'],
        '내가 아는 것을 외부에 공개하는 형태로 한 번 정리하세요. 글 한 편이든 강의 한 번이든.',
        '외부에 공개한 전문 콘텐츠 수'),
      H('paralysis','생각이 많아 결정이 계속 미뤄진다',.48,'인성이 과하면 실행보다 검토가 앞섭니다.',
        ['선택지를 계속 늘리고 있다','결정 시점을 자꾸 미룬다','더 알아보고 정하겠다는 말을 반복한다'],
        '가장 오래 미룬 결정 하나에 마감일을 정하세요. 오늘 날짜 + 14일.',
        '미룬 결정의 개수'),
    ],
    Q:[
      Q('offer','전문성으로 불려가는 제안이 들어옵니까?',{ depth:{y:1.90,n:.55}, paralysis:{y:.80,n:1.15} }),
      Q('decide','최근 한 달 안에 미뤘던 결정을 실제로 내렸습니까?',{ depth:{y:1.30,n:.75}, paralysis:{y:.45,n:1.85} }),
      Q('options','선택지를 계속 늘리고 있습니까?',{ depth:{y:.75,n:1.20}, paralysis:{y:1.85,n:.55} }),
    ],
  });
  R('career','비겁','weak',{
    theme:'혼자 버티는가, 같이 가는가',
    lead:'이 구간의 핵심은 내 편을 얼마나 확보하느냐입니다.',
    H:[
      H('ally','동료·협업으로 힘을 얻는다',.55,'같은 기운이 들어오고 일간이 이를 필요로 합니다. 사람이 힘이 되는 구간입니다.',
        ['같이 일하자는 제안이 온다','비슷한 처지의 사람과 연결된다','혼자 하던 일에 손이 붙는다'],
        '함께 일할 사람 한 명과 이번 달에 작은 건을 같이 해보세요. 계약 조건을 먼저 문서로.',
        '협업으로 진행한 건수'),
      H('split','경쟁·분산으로 내 몫이 줄어든다',.45,'같은 기운이 늘 협력으로만 오지는 않습니다. 나눠 갖는 국면이 되기도 합니다.',
        ['같은 시장에 비슷한 사람이 늘었다','수익을 나누는 구조가 생긴다','내 자리가 대체 가능해 보인다'],
        '내가 가진 것 중 남이 못 따라 하는 것 하나를 적고, 이번 달에 그것만 키우세요.',
        '나만 할 수 있는 업무의 비중'),
    ],
    Q:[
      Q('team','같이 일하자는 제안이나 연결이 생겼습니까?',{ ally:{y:1.95,n:.50}, split:{y:.85,n:1.15} }),
      Q('compete','같은 시장에 경쟁자가 눈에 띄게 늘었습니까?',{ ally:{y:.75,n:1.20}, split:{y:1.90,n:.55} }),
      Q('unique','내가 아니면 안 되는 일이 분명히 있습니까?',{ ally:{y:1.20,n:.85}, split:{y:.55,n:1.55} }),
    ],
  });
  R('career','비겁','strong',{
    theme:'독립 압력과 수익성 압력이 동시에 온다',
    lead:'힘이 겹치는 구간입니다. 벌이는 것보다 지키는 것을 함께 보겠습니다.',
    H:[
      H('independent','독립·분리 쪽으로 힘이 실린다',.52,'같은 기운이 겹쳐 내 것을 하려는 압력이 커집니다.',
        ['내 이름으로 하고 싶다는 생각이 강해진다','동업·소속 관계가 불편해진다','혼자 해도 되겠다는 자신이 생긴다'],
        '독립을 가정하고 첫 12개월 고정비와 최소 매출을 숫자로 적어보세요.',
        '독립 시 필요한 월 최소 매출'),
      H('margin','경쟁 심화로 수익성이 깎인다',.48,'비겁이 강하면 나눠 갖는 힘도 강해집니다. 가격과 마진이 먼저 흔들립니다.',
        ['단가를 깎아달라는 요구가 는다','비슷한 제안이 시장에 많아졌다','매출은 유지되는데 이익이 준다'],
        '주력 상품 하나의 원가와 실제 마진을 다시 계산하세요. 감이 아니라 숫자로.',
        '주력 상품의 실제 마진율'),
    ],
    Q:[
      Q('solo','내 이름으로 하고 싶다는 생각이 실제 준비로 이어지고 있습니까?',{ independent:{y:1.95,n:.50}, margin:{y:.90,n:1.10} }),
      Q('price','단가 인하 요구나 가격 경쟁이 늘었습니까?',{ independent:{y:.85,n:1.15}, margin:{y:2.00,n:.50} }),
      Q('profit','매출 대비 이익률이 작년보다 좋아졌습니까?',{ independent:{y:1.10,n:.90}, margin:{y:.45,n:1.75} }),
    ],
  });

  /* ═══ 재물·돈 ═══ */
  R('wealth','재성','*',{
    theme:'매출과 현금흐름을 분리해서 본다',
    lead:'돈은 들어오는 양이 아니라 남는 양으로 판단하겠습니다.',
    H:[
      H('inflow','실제 수입이 늘어난다',.5,'다룰 재물이 커지는 구간입니다.',['거래·수입원이 늘어난다','들어오는 금액의 단위가 커진다'],'수입원 하나를 새로 열거나 기존 단가를 한 번 올려보세요.','월 실입금액'),
      H('leak','들어오는 만큼 나가서 남지 않는다',.5,'재성이 커질 때 지출도 같이 커지는 것이 일반적입니다.',['입금은 느는데 잔액은 그대로다','지출이 먼저 나간다','고정비가 늘었다'],'이번 달 고정 지출을 전부 적고 하나를 해지하세요.','월 순현금흐름(입금 − 지출)'),
    ],
    Q:[
      Q('bal','최근 3개월 통장 잔액이 늘고 있습니까?',{ inflow:{y:1.80,n:.55}, leak:{y:.50,n:1.75} }),
      Q('fix','고정 지출이 작년보다 늘었습니까?',{ inflow:{y:.85,n:1.15}, leak:{y:1.80,n:.55} }),
      Q('src','수입원이 두 개 이상입니까?',{ inflow:{y:1.40,n:.75}, leak:{y:.80,n:1.20} }),
    ],
  });
  R('wealth','비겁','*',{
    theme:'나가는 돈을 먼저 본다',
    lead:'이 구간은 버는 쪽보다 새는 쪽을 먼저 점검하겠습니다.',
    H:[
      H('outflow','지출·분배로 돈이 나간다',.62,'나누어 쓰는 기운이 강해지는 구간입니다. 사람과 얽힌 돈이 특히 그렇습니다.',['빌려주거나 보태는 일이 생긴다','동업·정산 문제가 생긴다','충동 지출이 는다'],'이번 달에 남에게 나가는 돈의 상한선을 숫자로 정해두세요.','타인에게 나간 금액'),
      H('joint','함께 벌어 몫이 커진다',.38,'같은 기운이 협업으로 작동하면 혼자보다 크게 법니다.',['같이 하는 일에서 수익이 난다','분배 기준이 명확하다'],'공동 수익의 분배 기준을 문서로 확정하세요.','공동 사업의 내 몫 금액'),
    ],
    Q:[
      Q('lend','최근 남에게 돈이 나가는 일이 잦습니까?',{ outflow:{y:1.90,n:.50}, joint:{y:.80,n:1.20} }),
      Q('rule','공동 수익의 분배 기준이 문서로 있습니까?',{ outflow:{y:.60,n:1.35}, joint:{y:1.95,n:.50} }),
      Q('imp','계획에 없던 지출이 늘었습니까?',{ outflow:{y:1.70,n:.60}, joint:{y:.85,n:1.10} }),
    ],
  });
  R('wealth','식상','*',{
    theme:'만들어서 버는 구조로 갈 수 있는가',
    lead:'이 구간의 돈은 만들어 낸 것에서 나올 가능성이 높습니다.',
    H:[
      H('create','내가 만든 것이 수입이 된다',.55,'내보내는 기운이 재물로 이어지는 배치입니다.',['만든 것에 반응이 온다','판매·조회·문의가 는다'],'만든 것 하나에 가격을 붙여 이번 달에 팔아보세요.','내가 만든 것에서 나온 수입'),
      H('spend','만드는 데 쓰는 돈이 더 크다',.45,'생산에는 비용이 먼저 듭니다.',['장비·외주·광고비가 늘었다','아직 회수가 없다'],'제작에 들어간 총비용과 회수액을 나란히 적어보세요.','제작비 대비 회수율'),
    ],
    Q:[
      Q('sold','만든 것에서 실제 수입이 발생했습니까?',{ create:{y:2.00,n:.45}, spend:{y:.55,n:1.60} }),
      Q('cost','제작·홍보 비용이 늘었습니까?',{ create:{y:.90,n:1.10}, spend:{y:1.70,n:.60} }),
      Q('again','다시 사거나 문의하는 사람이 있습니까?',{ create:{y:1.75,n:.60}, spend:{y:.65,n:1.30} }),
    ],
  });
  R('wealth','관성','*',{
    theme:'책임이 돈을 만드는가, 돈을 묶는가',
    lead:'이 구간의 돈은 자리·계약과 함께 움직입니다.',
    H:[
      H('stable','안정적인 고정 수입이 자리 잡는다',.55,'관성이 재물과 만나면 정기적인 형태로 굳습니다.',['월급·계약금 등 정기 수입이 생긴다','수입 예측이 가능해진다'],'정기 수입의 금액과 날짜를 캘린더에 고정해두세요.','정기 수입이 전체 수입에서 차지하는 비율'),
      H('locked','의무·비용에 돈이 묶인다',.45,'책임에는 비용이 따라옵니다.',['세금·보험·대출 상환이 늘었다','내 돈인데 내 마음대로 못 쓴다'],'묶여 있는 돈의 총액과 해제 시점을 적어보세요.','자유롭게 쓸 수 있는 현금 비율'),
    ],
    Q:[
      Q('fixed','정기적으로 들어오는 수입이 있습니까?',{ stable:{y:1.85,n:.50}, locked:{y:.90,n:1.10} }),
      Q('oblig','세금·상환·보험 같은 의무 지출이 늘었습니까?',{ stable:{y:.85,n:1.15}, locked:{y:1.85,n:.55} }),
      Q('free','필요할 때 쓸 수 있는 현금이 충분합니까?',{ stable:{y:1.30,n:.80}, locked:{y:.50,n:1.60} }),
    ],
  });
  R('wealth','인성','*',{
    theme:'쌓는 시기인가, 묶이는 시기인가',
    lead:'이 구간은 버는 것보다 지키고 배우는 쪽에 힘이 실립니다.',
    H:[
      H('save','모으고 정리하는 데 유리하다',.55,'받는 기운이 강한 구간입니다.',['도움·지원·환급이 생긴다','저축·정리가 잘 된다'],'이번 달에 자동이체 저축 하나를 새로 걸어두세요.','월 저축액'),
      H('invest','배움·자산에 돈이 나간다',.45,'인성이 강하면 지출이 학습과 자산 쪽으로 향합니다.',['교육·자격·부동산에 돈이 들어간다','회수는 아직 멀다'],'지출한 학습·자산 비용의 회수 시점을 날짜로 적어두세요.','학습·자산 지출액과 예상 회수 시점'),
    ],
    Q:[
      Q('help','도움이나 지원을 실제로 받았습니까?',{ save:{y:1.80,n:.55}, invest:{y:.95,n:1.05} }),
      Q('edu','배움·자산에 큰돈을 쓰고 있습니까?',{ save:{y:.80,n:1.20}, invest:{y:1.85,n:.55} }),
      Q('grow','저축액이 늘고 있습니까?',{ save:{y:1.70,n:.55}, invest:{y:.70,n:1.25} }),
    ],
  });

  /* ═══ 관계·인연 ═══ */
  const loveH = (a, b) => ({ H:[a, b] });
  R('love','관성','*',{
    theme:'관계가 형태를 갖추는가, 부담이 되는가',
    lead:'이 구간의 관계는 책임과 형식 쪽으로 움직입니다.',
    H:[
      H('commit','관계가 공식적인 형태로 정리된다',.55,'관성은 관계를 틀에 넣습니다.',['만남이 정기적이 된다','가족·주변에 소개된다','약속의 단위가 길어진다'],'상대와 앞으로 6개월의 계획을 한 번 맞춰보세요.','서로 합의된 미래 계획의 유무'),
      H('burden','의무감이 커져 관계가 무거워진다',.45,'같은 기운이 부담으로 오면 관계가 일처럼 느껴집니다.',['만나는 일이 해야 할 일처럼 느껴진다','기대와 요구가 늘었다','거절하기 어렵다'],'상대에게 하기 어려웠던 말 하나를 이번 주에 꺼내보세요.','솔직하게 말하지 못한 것의 개수'),
    ],
    Q:[
      Q('plan','상대와 앞으로의 계획을 구체적으로 이야기합니까?',{ commit:{y:1.90,n:.50}, burden:{y:.80,n:1.20} }),
      Q('duty','만남이 의무처럼 느껴질 때가 있습니까?',{ commit:{y:.75,n:1.20}, burden:{y:1.90,n:.50} }),
      Q('say','하고 싶은 말을 편하게 합니까?',{ commit:{y:1.40,n:.70}, burden:{y:.55,n:1.55} }),
    ],
  });
  R('love','재성','*',{
    theme:'만남은 늘어나는데 깊이가 따라오는가',
    lead:'이 구간은 접점이 늘어나는 쪽으로 힘이 실립니다.',
    H:[
      H('meet','새로운 인연과 접점이 늘어난다',.55,'재성은 대상을 끌어옵니다.',['소개·모임·연락이 는다','선택지가 많아진다'],'이번 달에 새로 만난 사람 중 한 명에게 먼저 연락하세요.','새로 이어진 관계 수'),
      H('shallow','만남은 많지만 남는 관계가 없다',.45,'양이 늘면 깊이는 얕아지기 쉽습니다.',['만나도 이어지지 않는다','비슷한 만남이 반복된다'],'관계 하나를 골라 이번 달에 세 번 이상 만나보세요.','세 번 이상 만난 관계 수'),
    ],
    Q:[
      Q('new','최근 새로운 만남이 늘었습니까?',{ meet:{y:1.80,n:.55}, shallow:{y:1.20,n:.80} }),
      Q('keep','그중 계속 이어지는 관계가 있습니까?',{ meet:{y:1.50,n:.65}, shallow:{y:.45,n:1.80} }),
      Q('same','비슷한 패턴의 만남이 반복됩니까?',{ meet:{y:.85,n:1.10}, shallow:{y:1.75,n:.60} }),
    ],
  });
  R('love','식상','*',{
    theme:'표현이 살아나는 시기',
    lead:'이 구간의 관계는 내가 얼마나 표현하느냐로 갈립니다.',
    H:[
      H('open','표현이 늘어 관계가 가까워진다',.58,'내보내는 기운이 관계에서는 표현으로 작동합니다.',['먼저 연락하게 된다','속마음을 말하게 된다'],'가까운 사람에게 하고 싶었던 말을 이번 주에 전하세요.','먼저 연락한 횟수'),
      H('sharp','말이 앞서 마찰이 생긴다',.42,'표현이 강해지면 상대가 다칠 수 있습니다.',['말하고 후회하는 일이 는다','지적이 늘었다'],'지적하고 싶을 때 질문으로 바꿔 말해보세요.','후회한 말의 횟수'),
    ],
    Q:[
      Q('first','먼저 연락하거나 표현하는 일이 늘었습니까?',{ open:{y:1.75,n:.55}, sharp:{y:1.15,n:.85} }),
      Q('regret','말하고 후회하는 일이 잦습니까?',{ open:{y:.70,n:1.25}, sharp:{y:1.95,n:.50} }),
      Q('closer','상대와 전보다 가까워졌다고 느낍니까?',{ open:{y:1.70,n:.55}, sharp:{y:.60,n:1.40} }),
    ],
  });
  R('love','비겁','*',{
    theme:'내 편이 늘어나는가, 나뉘는가',
    lead:'이 구간은 사람이 많아지는 대신 몫이 나뉘기도 합니다.',
    H:[
      H('friend','동료·친구 관계가 넓어진다',.55,'같은 기운은 옆자리 사람을 부릅니다.',['모임·동료가 는다','비슷한 사람과 편하다'],'오래 못 본 사람 한 명에게 이번 주에 연락하세요.','새로 이어진 관계 수'),
      H('rival','경쟁·비교로 관계가 불편해진다',.45,'같은 자리를 두고 비교가 생깁니다.',['비교하게 된다','같은 것을 두고 겹친다'],'비교하게 되는 사람과의 관계에서 내 기준을 한 줄로 적어두세요.','비교로 인한 불편의 빈도'),
    ],
    Q:[
      Q('circle','사람들과의 접점이 늘었습니까?',{ friend:{y:1.75,n:.55}, rival:{y:1.05,n:.95} }),
      Q('compare','누군가와 자꾸 비교하게 됩니까?',{ friend:{y:.75,n:1.20}, rival:{y:1.90,n:.50} }),
      Q('easy','그 관계가 편안합니까?',{ friend:{y:1.60,n:.60}, rival:{y:.50,n:1.65} }),
    ],
  });
  R('love','인성','*',{
    theme:'기대는 시기 — 받는 것과 갇히는 것',
    lead:'이 구간은 돌봄과 의존이 함께 옵니다.',
    H:[
      H('care','돌봐주는 사람이 나타난다',.55,'나를 살리는 기운이 사람으로 옵니다.',['챙겨주는 사람이 생긴다','편안한 관계가 는다'],'도움을 준 사람에게 이번 주에 고맙다고 표현하세요.','도움을 받은 횟수'),
      H('depend','기대는 마음이 커져 관계가 좁아진다',.45,'받는 것이 길어지면 세계가 좁아집니다.',['혼자 있는 시간이 는다','새 만남이 줄었다'],'이번 달에 새로운 자리에 한 번 나가보세요.','새로 만난 사람 수'),
    ],
    Q:[
      Q('helped','최근 누군가에게 실질적인 도움을 받았습니까?',{ care:{y:1.85,n:.50}, depend:{y:1.10,n:.90} }),
      Q('narrow','새로 만나는 사람이 줄었습니까?',{ care:{y:.80,n:1.15}, depend:{y:1.85,n:.55} }),
      Q('out','바깥 활동이 유지되고 있습니까?',{ care:{y:1.25,n:.80}, depend:{y:.50,n:1.65} }),
    ],
  });

  /* ═══ 건강 · 학업 · 이동 (기본) ═══ */
  const simple = (domain, group, theme, lead, h1, h2, qs) => R(domain, group, '*', { theme, lead, H:[h1, h2], Q:qs });
  ['관성','재성','식상','인성','비겁'].forEach(gr => {
    simple('health', gr,
      '몸이 먼저 신호를 보내는 구간인가',
      '건강은 진단이 아니라 신호로만 읽겠습니다. 이상이 있으면 반드시 의료기관에서 확인하세요.',
      H('strain', gr === '인성' ? '쉬어야 하는데 계속 미룬다' : '부담이 몸으로 먼저 나타난다', .55,
        `${GROUP_MEAN[gr]}이 강해지는 구간입니다. 이런 때는 무리한 것이 몸으로 먼저 드러납니다.`,
        ['잠의 질이 떨어졌다','예전보다 회복이 느리다','같은 일에 더 지친다'],
        '이번 주에 수면 시간을 30분 늘리고, 미룬 검진 하나를 예약하세요.',
        '주간 평균 수면 시간'),
      H('steady','관리하면 무리 없이 넘어간다',.45,'같은 구간이라도 리듬을 지키면 문제로 커지지 않습니다.',['생활 리듬이 일정하다','운동이나 산책을 이어가고 있다'],'매일 같은 시간에 하는 행동 하나를 정해 2주간 지켜보세요.','2주간 리듬을 지킨 날수'),
      [ Q('sleep','최근 잠의 질이 떨어졌습니까?',{ strain:{y:1.85,n:.50}, steady:{y:.55,n:1.60} }),
        Q('rec','예전보다 회복이 느리다고 느낍니까?',{ strain:{y:1.75,n:.55}, steady:{y:.60,n:1.45} }),
        Q('rhythm','규칙적인 생활 리듬이 유지되고 있습니까?',{ strain:{y:.60,n:1.40}, steady:{y:1.85,n:.50} }) ]);
    simple('study', gr,
      '들어가는 시간이 결과로 바뀌고 있는가',
      '공부는 시간이 아니라 회수 가능한 결과로 보겠습니다.',
      H('progress', gr === '인성' ? '흡수가 잘 되는 구간이다' : '집중을 붙이면 결과가 따라온다', .5,
        `${GROUP_MEAN[gr]}이 작동하는 구간입니다.`,
        ['앉으면 집중이 붙는다','틀리던 유형이 줄었다'],
        '오늘부터 2주간 하루 한 세트씩 실전 문제를 풀고 정답률을 기록하세요.',
        '주간 정답률 변화'),
      H('scatter','시간은 쓰는데 성과가 흐릿하다',.5,'양이 결과로 이어지지 않는 구간일 수 있습니다.',['공부 시간은 긴데 점수는 그대로다','계획만 다시 세운다'],'과목 하나를 골라 한 주 동안 그것만 하세요.','과목별 실제 학습 시간과 점수 변화'),
      [ Q('score','최근 점수나 정답률이 올랐습니까?',{ progress:{y:1.90,n:.50}, scatter:{y:.50,n:1.70} }),
        Q('focus','앉으면 집중이 붙습니까?',{ progress:{y:1.60,n:.60}, scatter:{y:.65,n:1.35} }),
        Q('plan','계획을 다시 세우는 일이 잦습니까?',{ progress:{y:.75,n:1.20}, scatter:{y:1.75,n:.55} }) ]);
    simple('move', gr,
      '움직일 때인가, 자리를 지킬 때인가',
      '이동은 좋고 나쁨보다 준비가 되었는지로 보겠습니다.',
      H('go','옮기는 쪽이 흐름에 맞다',.5,`${GROUP_MEAN[gr]}이 변동을 부르는 구간입니다.`,['지금 자리가 좁게 느껴진다','기회가 다른 곳에 있다','조건이 구체적으로 나왔다'],'후보지 두 곳의 비용과 이동 시간을 숫자로 비교해 적으세요.','후보별 총비용과 통근·생활 시간'),
      H('stay','지금은 자리를 지키며 기반을 다질 때다',.5,'같은 구간이라도 준비가 없으면 이동은 비용만 남깁니다.',['옮길 곳이 아직 구체적이지 않다','비용 계산이 안 됐다','지금 자리에서 남은 일이 있다'],'이동을 미룬다면 지금 자리에서 3개월 안에 끝낼 일 하나를 정하세요.','이동 결정에 필요한 미확정 항목 수'),
      [ Q('cand','옮길 곳이 구체적으로 정해져 있습니까?',{ go:{y:1.95,n:.45}, stay:{y:.50,n:1.70} }),
        Q('cost','이동에 드는 총비용을 계산해 봤습니까?',{ go:{y:1.65,n:.55}, stay:{y:.65,n:1.35} }),
        Q('narrow','지금 자리가 좁게 느껴집니까?',{ go:{y:1.55,n:.65}, stay:{y:.70,n:1.30} }) ]);
  });

  // ───────── 규칙 조회 ─────────
  function lookup(domain, group, strong) {
    return RULES[`${domain}|${group}|${strong ? 'strong' : 'weak'}`]
        || RULES[`${domain}|${group}|*`]
        || RULES[`career|${group}|${strong ? 'strong' : 'weak'}`];
  }

  // ───────── 관계(합·충) 보정 ─────────
  function modifiers(result, target) {
    const p = result.pillars, out = [];
    if (!target.du) return out;
    const b = target.du.branch;
    const day = branchRel(p.day.branch, b), mon = branchRel(p.month.branch, b);
    if (day === '충') out.push({ text:'대운의 지지가 일지와 부딪힙니다(충). 생활의 기반·거처·가까운 관계에서 변동이 생기기 쉬운 구간입니다. 나쁘다는 뜻이 아니라 움직임이 커진다는 뜻입니다.', tilt:'change' });
    if (mon === '충') out.push({ text:'대운의 지지가 월지와 부딪힙니다(충). 일과 사회적 자리에서 자리 이동이나 방식 변경이 따라오기 쉽습니다.', tilt:'change' });
    if (day === '육합' || day === '삼합') out.push({ text:`대운의 지지가 일지와 ${day}을 이룹니다. 사람과 일이 붙고 협력이 수월해지는 방향입니다.`, tilt:'stable' });
    if (mon === '삼합') out.push({ text:'대운의 지지가 월지와 삼합을 이룹니다. 사회적 활동의 방향이 하나로 모이는 구간입니다.', tilt:'stable' });
    const elem = E.ELEM[E.STEM_ELEM[target.du.stem]];
    if (result.analysis.yongCandidates.includes(elem)) out.push({ text:`대운의 천간이 ${elem} 기운으로, 이 사주가 필요로 하는 쪽입니다. 같은 사건이라도 감당하기 수월한 구간입니다.`, tilt:'stable' });
    else if (result.analysis.missing.length && result.analysis.missing.includes(elem)) out.push({ text:`원국에 없던 ${elem} 기운이 대운으로 들어옵니다. 익숙하지 않은 영역이 열리는 구간이라 초반에 시행착오가 있을 수 있습니다.`, tilt:'change' });
    return out;
  }

  // ───────── 프레임 생성 ─────────
  function frame(result, question, today) {
    const domain = detectDomain(question);
    const target = detectTarget(question, result, today);
    const a = result.analysis, ds = a.dayStem;
    const src = target.level === '대운' && target.du ? target.du
              : target.level === '세운' ? target.pillar
              : target.pillar;
    const godStem = E.TEN_GODS[E.tenGod(ds, src.stem)];
    const godBranch = E.TEN_GODS[E.tenGod(ds, E.HIDDEN[src.branch][0])];
    const group = GROUP[godStem];
    const strong = a.strengthScore >= 0.5;
    const rule = lookup(domain.key, group, strong);
    const mods = modifiers(result, target);
    const hyps = rule.H.map(h => ({ ...h, p: h.prior }));
    // 보정: 충이 많으면 변화형 가설(두 번째)에 약간 가중
    const changeN = mods.filter(m => m.tilt === 'change').length;
    if (changeN) { hyps[1].p *= 1 + 0.12 * changeN; }
    const sum = hyps.reduce((s, h) => s + h.p, 0);
    hyps.forEach(h => h.p /= sum);
    hyps.sort((x, y) => y.p - x.p);
    return {
      question, domain, target, group, godStem, godBranch, strong,
      strength: a.strength, lead: rule.lead, theme: rule.theme,
      layers: stack(result, target, today), modifiers: mods,
      hypotheses: hyps, questions: rule.Q,
      answers: {},
      createdAt: today.toISOString().slice(0, 10),
    };
  }

  // ───────── Belief Revision ─────────
  const TEMPER = 0.6;   // 우도비 완화 지수
  const P_MIN = 0.15, P_MAX = 0.85;
  /** answers: { [questionId]: 'y'|'n'|'?' } → 사후확률 재계산 */
  function revise(fr) {
    const post = {};
    fr.hypotheses.forEach(h => { post[h.id] = h.prior; });
    const changeN = fr.modifiers.filter(m => m.tilt === 'change').length;
    if (changeN && fr.hypotheses.length > 1) {
      const secondId = fr.hypotheses.find(h => h.prior === Math.min(...fr.hypotheses.map(x => x.prior))).id;
      post[secondId] *= 1 + 0.12 * changeN;
    }
    for (const q of fr.questions) {
      const ans = fr.answers[q.id];
      if (!ans || ans === '?') continue;
      for (const hid of Object.keys(post)) {
        const e = q.effects[hid];
        if (!e) continue;
        // 완화(tempering): 질문 3개로 확신이 과해지지 않게 지수를 낮춘다
        post[hid] *= Math.pow(ans === 'y' ? e.y : e.n, TEMPER);
      }
    }
    let sum = Object.values(post).reduce((s, v) => s + v, 0) || 1;
    // 상한/하한: 어떤 답을 해도 100%나 0%로 가지 않는다. 2순위는 항상 살려 둔다.
    const ids = Object.keys(post);
    ids.forEach(k => { post[k] = Math.min(Math.max(post[k] / sum, P_MIN), P_MAX); });
    sum = Object.values(post).reduce((s, v) => s + v, 0) || 1;
    const ranked = fr.hypotheses.map(h => ({ ...h, p: post[h.id] / sum })).sort((x, y) => y.p - x.p);
    const answered = fr.questions.filter(q => fr.answers[q.id] && fr.answers[q.id] !== '?').length;
    // '모르겠어요'도 응답으로 친다 — 확률은 안 움직이지만 상담은 진행되어야 한다
    const responded = fr.questions.filter(q => !!fr.answers[q.id]).length;
    const priorTop = [...fr.hypotheses].sort((x, y) => y.prior - x.prior)[0];
    return { ranked, answered, responded, total: fr.questions.length, flipped: answered > 0 && ranked[0].id !== priorTop.id, priorTopId: priorTop.id };
  }


  // ───────── Decision Lab: 선택지 비교 ─────────
  // 가설의 성격. go = 나아가는 쪽에 힘이 실림 / fix = 먼저 풀어야 할 제약이 있음
  const KIND = {
    go:   ['expansion','expand','delegate','pivot','newline','breakout','promote','independent','depth','build','ally','joint','create','inflow','stable','commit','meet','open','friend','care','save','progress','go','steady'],
    fix:  ['bottleneck','overload','overreach','drain','stall','paralysis','split','margin','friction','leak','outflow','spend','locked','invest','burden','shallow','sharp','rival','depend','scatter','strain','stay'],
  };
  const kindOf = (id) => KIND.go.includes(id) ? 'go' : (KIND.fix.includes(id) ? 'fix' : 'unknown');

  /** 상담 결과(fr, rev)로 세 가지 선택지를 만들고 점수를 매긴다.
   *  점수는 확신도·미확인 항목·변동성·시기 전환으로만 계산한다(결정론적). */
  function decide(fr, rev, today) {
    const top = rev.ranked[0], second = rev.ranked[1];
    const unknown = fr.questions.filter(q => !fr.answers[q.id] || fr.answers[q.id] === '?').length;
    const volatility = fr.modifiers.filter(m => m.tilt === 'change').length;
    const topKind = kindOf(top.id);
    const conf = top.p;

    // 흐름 전환까지 남은 기간 (대운 경계 / 해 바뀜)
    let turning = null, turnYears = 99;
    if (fr.target.du) {
      const endYear = fr.target.du.startYear + 9;
      turnYears = endYear - today.getFullYear();
      if (turnYears >= 0 && turnYears <= 2) turning = `${endYear}년에 대운이 바뀝니다`;
    }

    const A = {
      key: 'now', label: '지금 실행한다',
      score: Math.round(conf * 100) - unknown * 16 - volatility * 9 + (topKind === 'go' ? 12 : -14),
      when: '1순위 판단이 나아가는 쪽이고, 확인되지 않은 항목이 적을 때',
      risk: topKind === 'fix'
        ? `지금 판단은 “${top.title}”입니다. 제약을 안은 채 규모를 키우면 그 제약이 함께 커집니다.`
        : '판단이 맞더라도 확인 안 된 항목이 남아 있으면 그만큼이 그대로 위험이 됩니다.',
      todo: topKind === 'go' ? top.action : `먼저 ${second ? second.title : '2순위 가설'}이 아닌지 한 번 더 확인하세요.`,
    };
    const B = {
      key: 'wait', label: `기다린다${turning ? ' (' + turning + ')' : ' (3~6개월)'}`,
      score: 50 + unknown * 13 + volatility * 11 + (turning ? 12 : 0) + (conf < 0.6 ? 10 : -6),
      when: '확인되지 않은 것이 많거나, 곧 흐름이 바뀔 때',
      risk: '기다리는 동안 기회가 지나갈 수 있습니다. 무엇을 확인하면 결정할지 기준을 정해두지 않으면 그냥 미루는 것이 됩니다.',
      todo: unknown > 0
        ? `아직 답하지 않은 ${unknown}가지를 확인하는 것이 먼저입니다. 확인되는 즉시 다시 판단하겠습니다.`
        : `${top.metric}을(를) 석 달 기록한 뒤 다시 보겠습니다.`,
    };
    const C = {
      key: 'prep', label: '선행 조건을 먼저 해결한다',
      score: 55 + (topKind === 'fix' ? 20 : -8) + unknown * 6 + (volatility ? 6 : 0),
      when: '지금 판단이 제약을 가리키고 있을 때. 제약을 풀면 나머지 선택지의 순위가 바뀝니다',
      risk: '준비 자체가 목적이 되면 시기를 놓칩니다. 마감일을 함께 정해두어야 합니다.',
      todo: topKind === 'fix' ? top.action : (second ? second.action : top.action),
      note: topKind === 'fix' ? null : (second ? `2순위 "${second.title}"에 대한 대비입니다.` : null),
    };

    const options = [A, B, C].map(o => ({ ...o, score: Math.max(5, Math.min(98, o.score)) }))
      .sort((x, y) => y.score - x.score);
    const lead = options[0].key === 'now'
      ? '지금 조건에서는 실행 쪽에 무게를 두겠습니다.'
      : options[0].key === 'wait'
        ? '지금은 결정을 확정하기보다 확인을 먼저 하겠습니다.'
        : '규모를 키우는 것보다 지금의 제약을 먼저 푸는 쪽을 먼저 검토하겠습니다.';
    return { options, lead, unknown, volatility, turning, topKind };
  }

  global.ChaeksaTongbyeon = { frame, revise, decide, kindOf, detectDomain, detectTarget, stack, DOMAINS, GROUP, GROUP_MEAN, RULES };
})(window);
