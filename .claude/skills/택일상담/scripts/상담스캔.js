/* 1:1 택일 상담 스캔 — chaeksa.kr 에서 javascript_tool 로 실행한다.
 *
 * 블로그용 scan.js 와 다른 점: 의뢰인의 조건을 받아 채점 기준을 바꾼다.
 * 같은 후보라도 무엇을 앞세우느냐에 따라 순위가 뒤집힌다. 그게 이 상담의 값어치다.
 *
 * 맨 아래 CONFIG 만 바꾸면 된다. 결과는 window.__상담 에 남는다.
 * 주의: Node 에서는 안 돈다. 엔진이 브라우저 전역에 있다.
 */
(() => {
const E = window.ChaeksaEngine;
if (!E) return { 오류: 'ChaeksaEngine 없음 — chaeksa.kr 이 열려 있는지 확인' };

const HAN_S = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const HAN_B = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const JIN   = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const EL    = ['목','화','토','금','수'];
const DOW   = ['일','월','화','수','목','금','토'];

const GRP = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성',
              정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };
const G = (ds, s) => E.TEN_GODS[E.tenGod(ds, s)];

const isChung = (a, b) => ((b - a + 12) % 12) === 6;
const YUKHAP  = {0:1,1:0,2:11,11:2,3:10,10:3,4:9,9:4,5:8,8:5,6:7,7:6};
const SAMHAP  = [[8,0,4],[11,3,7],[2,6,10],[5,9,1]];
const SAMNAME = {'8,0,4':'水국','11,3,7':'木국','2,6,10':'火국','5,9,1':'金국'};
const rel = (a, b) =>
    a === b ? '복음'
  : isChung(a, b) ? '충'
  : YUKHAP[a] === b ? '육합'
  : SAMHAP.some(g => g.includes(a) && g.includes(b)) ? '반합'
  : null;

/** '壬申' 같은 일주 문자를 인덱스로 바꾼다. 상담에서는 한자로 받는 게 자연스럽다. */
function parseGZ(s) {
  const st = HAN_S.indexOf(String(s).trim()[0]);
  const br = HAN_B.indexOf(String(s).trim()[1]);
  if (st < 0 || br < 0) throw new Error('일주를 읽지 못했습니다: ' + s + ' (예: 壬申)');
  return { stem: st, branch: br };
}

/** 우선순위별 가중치. 같은 후보라도 여기가 바뀌면 순위가 통째로 뒤집힌다.
 *  의뢰인이 무엇을 원하는지 듣기 전에는 '무난'으로 두고, 들으면 반드시 다시 돌린다. */
const PRESET = {
  무난: { 구족:13, 중화:90, 충:11, 통근:8, 유통:4, 조후:10, 재관:0, 대운:0 },
  재관: { 구족:8,  중화:50, 충:8,  통근:9, 유통:3, 조후:6,  재관:1, 대운:1 },
  건강: { 구족:15, 중화:100,충:14, 통근:9, 유통:6, 조후:12, 재관:0, 대운:0 },
  학업: { 구족:11, 중화:70, 충:10, 통근:7, 유통:6, 조후:8,  재관:0, 대운:0, 인식:1 },
  가족: { 구족:11, 중화:70, 충:10, 통근:7, 유통:4, 조후:8,  재관:0, 대운:0, 가족:1 },
};

function evaluate(R, CFG, W) {
  const p = R.pillars, a = R.analysis, ec = a.elemCount, ds = p.day.stem;
  const br = ['year','month','day','hour'].map(k => p[k].branch);
  const dB = p.day.branch, hB = p.hour.branch;

  // ── 원국 기본
  let chung = [], hap = [];
  const NM = ['연지','월지','일지','시지'];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const r = rel(br[i], br[j]);
    if (r === '충') chung.push(`${NM[i]}-${NM[j]}`);
    else if (r === '육합' || r === '반합') hap.push(`${NM[i]}-${NM[j]} ${r}`);
  }
  let flow = 0;
  for (let s = 0; s < 5; s++) {
    let n = 0; for (let i = 0; i < 5; i++) { if (ec[(s + i) % 5] > 0) n++; else break; }
    flow = Math.max(flow, n);
  }
  // 통근 — 일간이 지지에 뿌리를 내린 곳 수. 엔진에는 없어서 여기서 센다.
  const de = E.STEM_ELEM[ds];
  const root = br.filter(b => E.HIDDEN[b].some(h => E.STEM_ELEM[h] === de)).length;

  // ── 재관 세력과 감당력
  const cheon = ['year','month','hour'].map(k => G(ds, p[k].stem));
  const jiAll = [];
  ['year','month','day','hour'].forEach(k => E.HIDDEN[p[k].branch].forEach(h => jiAll.push(G(ds, h))));
  const cnt = (g, arr) => arr.filter(x => GRP[x] === g).length;
  const 재천 = cnt('재성', cheon), 관천 = cnt('관성', cheon);
  const 재총 = cnt('재성', jiAll) + 재천, 관총 = cnt('관성', jiAll) + 관천;
  const 인총 = cnt('인성', jiAll) + cnt('인성', cheon);
  const 식총 = cnt('식상', jiAll) + cnt('식상', cheon);
  // 재다신약 — 재관이 많은데 감당할 힘이 없으면 보여도 못 잡는다.
  // 이 판정이 없으면 "재관 4개"만 보고 최악의 자리를 최고로 고르게 된다.
  const 재다신약 = a.strengthScore < 0.38 && (재총 + 관총) >= 4;

  // ── 대운 십신 흐름 (사회에 나가는 15~65세 구간)
  const list = R.daeun.list || R.daeun;
  const 대운 = list.filter(x => x.startAge >= 15 && x.startAge <= 65).map(x => ({
    나이: `${x.startAge}~${x.endAge}`, gz: E.fmt.pillar(x),
    간: GRP[G(ds, x.stem)], 지: GRP[G(ds, E.HIDDEN[x.branch][0])],
  }));
  const 재관대운 = 대운.filter(x => ['재성','관성'].includes(x.간) || ['재성','관성'].includes(x.지));
  const 인식대운 = 대운.filter(x => ['인성','식상'].includes(x.간) || ['인성','식상'].includes(x.지));

  // ── 가족 다대일. 궁합 모듈은 1:1 밖에 못 해서 여기서 직접 본다.
  const 좋음 = [], 부딪힘 = [];
  (CFG.가족 || []).forEach(F => {
    const fb = parseGZ(F.일주).branch;
    [['일지', dB], ['시지', hB]].forEach(([nm, b]) => {
      const r = rel(fb, b);
      if (!r) return;
      const txt = `${F.이름}(${F.일주})—${nm} ${HAN_B[b]} ${r}`;
      (r === '충' ? 부딪힘 : 좋음).push(txt);
    });
  });
  // 가족 지지 + 아이 지지로 삼합이 완성되는가
  const famBr = (CFG.가족 || []).map(F => parseGZ(F.일주).branch);
  const 완성 = [];
  SAMHAP.forEach(g => {
    if (!g.every(x => [...famBr, dB, hB].includes(x))) return;
    const mine = g.filter(x => x === dB || x === hB);
    if (mine.length) 완성.push(`${SAMNAME[g.join(',')]} 완성(아이의 ${mine.map(x => HAN_B[x]).join('·')})`);
  });

  // ── 채점
  const mb = p.month.branch;
  const 겨울 = [11,0,1].includes(mb), 여름 = [5,6,7].includes(mb);
  let s = 100;
  s -= a.missing.length * W.구족;
  s -= Math.abs(a.strengthScore - 0.5) * W.중화;
  s -= chung.length * W.충;
  s += Math.min(W.통근 * 3, root * W.통근);
  s += (flow - 3) * W.유통;
  if (겨울) { if (ec[1] === 0) s -= W.조후; else if (ec[1] >= 2) s += W.조후 / 2; }
  if (여름) { if (ec[4] === 0) s -= W.조후; else if (ec[4] >= 2) s += W.조후 / 2; }
  if (a.gotMonth) s += 4;
  if (W.재관) {
    // "돈 잘 벌고 자리 좋다" 는 재관의 개수가 아니라 구조다.
    // 재가 넷이어도 신약하면 보이기만 하고 못 잡는다. 감당 → 용신 → 흐름 순으로 본다.
    const 재오행 = EL[(de + 2) % 5], 관오행 = EL[(de + 3) % 5];
    const 재용 = a.yongCandidates.includes(재오행), 관용 = a.yongCandidates.includes(관오행);
    const 식상생재 = 식총 > 0 && 재총 > 0, 재생관 = 재총 > 0 && 관총 > 0;
    const 관인상생 = 관총 > 0 && 인총 > 0;
    const 관살혼잡 = jiAll.concat(cheon).includes('정관') && jiAll.concat(cheon).includes('편관');
    // 감당력이 먼저다
    if (a.strengthScore >= 0.5) s += 26;
    else if (a.strengthScore >= 0.45) s += 18;
    else if (a.strengthScore >= 0.38) s += 6;
    else s -= 14;
    if (root === 0) s -= 10;
    // 재관이 용신이어야 약이 된다. 기신이면 많을수록 짐이다
    if (재용 && 재총 > 0) s += 14;
    if (관용 && 관총 > 0) s += 14;
    if (!재용 && 재총 >= 3) s -= 10;
    // 흐름 — 만든 것이 돈이 되고, 돈이 자리가 되는가
    if (식상생재) s += 14;
    if (재생관) s += 14;
    if (식상생재 && 재생관) s += 10;
    if (관인상생) s += 8;
    if (재천 > 0) s += 7; if (관천 > 0) s += 7;
    if (재다신약) s -= 30;
    if (관살혼잡) s -= 8;
    if (cnt('비겁', jiAll.concat(cheon)) >= 3 && 재총 > 0) s -= 14;
  }
  if (W.대운) {
    s += 재관대운.length * 4 * W.대운;
    if (대운.slice(0, 3).some(x => ['재성','관성'].includes(x.간))) s += 8 * W.대운;
  }
  if (W.인식) { s += Math.min(18, (인총 + 식총) * 4) * W.인식; s += 인식대운.length * 3 * W.인식; }
  if (W.가족) { s -= 부딪힘.length * 12 * W.가족; s += Math.min(18, 좋음.length * 5) * W.가족; }

  return { _s: Math.max(0, Math.round(s)),
    강약: a.strength, 강약값: a.strengthScore, 통근: root, 유통: flow,
    오행: ec.map((n, i) => EL[i] + n).join(' '), 없는: a.missing.join('·') || '없음',
    충: chung.join(', ') || '없음', 합: hap.join(', ') || '없음',
    재: 재총, 재천, 관: 관총, 관천, 재다신약,
    대운시작: list[0] ? list[0].startAge + '세' : '?',
    재관대운: 재관대운.map(x => `${x.나이}세 ${x.gz}`).join(', ') || '없음',
    가족어울림: 좋음.join(' / ') || '—', 가족부딪힘: 부딪힘.join(' / ') || '없음',
    삼합완성: 완성.join(', ') || '—' };
}

function run(CFG) {
  const lon = CFG.경도 || 126.98;
  const shift = Math.round((135 - lon) * 4);
  const W = Object.assign({}, PRESET.무난, PRESET[CFG.우선순위] || {});
  const [y1, m1, d1] = CFG.시작, [y2, m2, d2] = CFG.끝;
  const from = new Date(y1, m1 - 1, d1), to = new Date(y2, m2 - 1, d2);
  const w = m => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
  const rows = [];

  for (let t = from.getTime(); t <= to.getTime(); t += 86400000) {
    const dt = new Date(t);
    const Y = dt.getFullYear(), M = dt.getMonth() + 1, D = dt.getDate();
    for (let hh = 0; hh < 24; hh += 2) {
      let R;
      try {
        R = E.calc({ year: Y, month: M, day: D, hour: hh, minute: 30,
                     gender: CFG.성별 || 'M', place: CFG.지역 || 'KR:서울',
                     longitude: lon, tzOffset: null, solarCorrection: true });
      } catch (e) { continue; }
      const v = evaluate(R, CFG, W);
      const a = (hh + 23) % 24, b = (hh + 1) % 24;
      const cm = hh * 60 + 30 + shift;
      // 병원이 실제로 잡아주는가. 좋은 자리를 알려줘도 못 잡으면 소용없다.
      const cs = a * 60 + shift, ce = b * 60 + shift;
      const ov = (a1,b1,a2,b2) => Math.max(0, Math.min(b1,b2) - Math.max(a1,a2));
      const 정규 = ov(cs, ce, 9*60, 17*60), 연장 = ov(cs, ce, 7*60, 19*60);
      const dw = dt.getDay(), 주말 = dw === 0 || dw === 6;
      const 등급 = 주말 ? '주말' : 정규 >= 60 ? '정규' : 연장 >= 60 ? '연장' : '야간';
      const 안내 = { 주말:'주말이라 예약 수술은 어렵습니다',
                     정규:'대부분 병원의 정규 수술 시간',
                     연장:'이른 아침·저녁. 협의하면 가능한 곳이 있습니다',
                     야간:'밤·새벽. 시간을 맞춰주는 병원을 찾으셔야 합니다' }[등급];
      // 실제로 요청할 시각. 시진 창이 정규시간과 겹치는 구간만 남긴다.
      const 요청 = 정규 > 0 ? `${w(Math.max(cs,9*60))}~${w(Math.min(ce,17*60))}`
                 : 연장 > 0 ? `${w(Math.max(cs,7*60))}~${w(Math.min(ce,19*60))}` : '—';
      rows.push({
        날짜: `${M}/${D}(${DOW[dt.getDay()]})`, _m: M, _d: D, _hh: hh,
        시진: JIN[Math.floor(((hh + 1) % 24) / 2)],
        시계창: `${w(a * 60 + shift)}~${w(b * 60 + shift)}`,
        등급, 안내, 요청시각: 요청, 창길이: 정규 > 0 ? 정규 : 연장,
        주간: cm >= (CFG.주간시작 || 8.5) * 60 && cm <= (CFG.주간끝 || 17) * 60,
        원국: ['year','month','day','hour'].map(k => E.fmt.pillar(R.pillars[k])).join(' '),
        일간: E.fmt.stem(R.pillars.day.stem),
        ...v,
      });
    }
  }
  if (!rows.length) return { 오류: '계산된 후보가 없습니다' };

  const raw = rows.map(r => r._s), lo = Math.min(...raw), hi = Math.max(...raw);
  rows.forEach(r => r.점수 = hi === lo ? 50 : Math.round((r._s - lo) / (hi - lo) * 100));
  const by = rows.slice().sort((x, y) => y._s - x._s || x._m - y._m || x._d - y._d || x._hh - y._hh);
  by.forEach((r, i) => r.순위 = i + 1);

  const f = r => ({
    자리: `${r.순위}위 · ${r.날짜} ${r.시계창} ${r.시진}시 [${r.등급}]`,
    병원요청: r.요청시각 === '—' ? `— ${r.안내}` : `${r.요청시각} · ${r.안내}` + (r.창길이 < 60 ? ` ⚠ 창이 ${r.창길이}분뿐` : ''),
    원국: `${r.원국} · ${r.일간}일간 ${r.강약}(${r.강약값}) 통근${r.통근} 유통${r.유통}/5 · ${r.점수}점`,
    오행: `${r.오행} (없는 ${r.없는})`,
    재관: `재 ${r.재}${r.재천 ? `(천간 ${r.재천})` : ''} · 관 ${r.관}${r.관천 ? `(천간 ${r.관천})` : ''}` + (r.재다신약 ? ' ⚠ 재다신약 — 보여도 못 잡는다' : ''),
    대운: `${r.대운시작} 시작 · 재관 대운 ${r.재관대운}`,
    가족: r.가족어울림, 충돌: r.가족부딪힘, 삼합: r.삼합완성,
    원국충: r.충,
  });

  const 시각창 = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * 2 + 23) % 24, b = (i * 2 + 1) % 24;
    시각창.push(`${JIN[i]}시 (태양시 ${String(a).padStart(2,'0')}~${String(b).padStart(2,'0')}) → 시계 ${w(a*60+shift)}~${w(b*60+shift)}`);
  }
  const 공통충 = rows[0].충.split(', ').filter(c => c !== '없음' && rows.every(r => r.충.includes(c)));

  return {
    조건: `${CFG.시작.join('.')} ~ ${CFG.끝.join('.')} · ${CFG.지역 || 'KR:서울'} · ${CFG.성별 === 'F' ? '여아' : '남아'} · 우선순위 [${CFG.우선순위 || '무난'}]`,
    가족: (CFG.가족 || []).map(F => `${F.이름} ${F.일주}`).join(' · ') || '(안 받음)',
    후보수: rows.length,
    피할수없는충: 공통충.length ? 공통충 : '없음',
    보정폭: `${shift}분`,
    // 두 묶음으로 낸다. 사주로 좋은 것과 실제로 잡을 수 있는 것은 다르다.
    사주로_좋은_자리5: by.slice(0, 5).map(f),
    실제_잡을수있는_자리5: by.filter(r => r.등급 === '정규' || r.등급 === '연장').slice(0, 5).map(f),
    가족충없는3: by.filter(r => r.가족부딪힘 === '없음').slice(0, 3).map(f),
    최하위3: by.slice(-3).reverse().map(f),
    등급분포: ['정규','연장','야간','주말'].map(g => `${g} ${rows.filter(r => r.등급 === g).length}`).join(' · '),
    시각창,
    _rows: rows, _f: f,
  };
}

// ── 여기만 바꾸세요 ──────────────────────────────────────
// 결과는 window.__상담 에 남는다. 특정 날짜를 다시 보려면
// window.__상담._rows.filter(r => r._d === 21).map(window.__상담._f)
window.__상담 = run({
  시작: [2026, 12, 14],
  끝:   [2026, 12, 24],
  지역: 'KR:서울', 경도: 126.98,   // 부산 129.08 · 목포 126.39 · 대구 128.60
  성별: 'M',                        // 원국은 성별 무관. 대운 방향만 갈린다
  우선순위: '재관',                  // 무난 · 재관 · 건강 · 학업 · 가족
  가족: [
    { 이름: '부',   일주: '壬申' },
    { 이름: '모',   일주: '壬午' },
    { 이름: '누나', 일주: '壬戌' },
  ],
  주간시작: 8.5, 주간끝: 17,
});
return Object.assign({}, window.__상담, {
  _rows: `(${window.__상담._rows.length}개 — window.__상담._rows 참조)`, _f: '(포맷 함수)',
});
})()
