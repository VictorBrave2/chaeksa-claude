/* 엔진 정기점검 — 한 벌로 돌리는 회귀 검사.
 *
 * 이 파일은 app/ 밖에 둔다. 점검 도구가 라이브에 실려 나갈 이유가 없다.
 *
 * 실행:  cp tools/enginecheck.js app/_check.js
 *        (개발 서버 브라우저 콘솔)
 *        fetch('/_check.js').then(r=>r.text()).then(s=>console.log(eval(s)))
 *        rm app/_check.js
 *
 *        chaeksa.kr 콘솔에 이 파일 내용을 붙여넣어도 된다.
 *
 * 무엇을 재는가 (docs/13_검증앵커.md 와 짝):
 *   A 강약 극단 앵커 7        기둥 직접 지정 → NATAL_WEIGHT·siding·STRENGTH_LABEL 재현
 *   B 실전 앵커 4             발행물에 근거로 쓴 자리
 *   C 분포 가드               결정적 표본 600명, 평균·신약·중화 비율
 *   D 격국                    양인격 4조합 한정 · 건록양인 신약률 · 성격:파격 · 궁통보감 120칸
 *   E 절기 경계 24개          절입 ±1분에서 월주가 정확히 갈리는가, 연주는 입춘에서만
 *   F 일주 60갑자             3000일 연속 끊김 없는가
 *   G 진태양시                균시차가 천문값과 맞는가
 *   H 야자시                  23시 이후 익일 일주 · 시지 子
 *   I 대운                    양남음녀 순행 · 월주 다음 간지에서 시작 · 10년 간격
 *   J 지장간                  12지 표 무결성
 *
 * 주의: 검사가 '못 잰 것'을 통과로 처리하면 안 된다. 2026-08-27 점검에서
 *       대운 배열 키를 잘못 짚어(R.daeun 은 객체인데 .length 를 봤다) 네 항목이
 *       거짓 통과로 나왔다. 값을 못 읽으면 실패로 떨어뜨린다.
 */
(() => {
  const r1 = (() => {
const E = window.ChaeksaEngine, A = window.ChaeksaAstro, C = window.ChaeksaClassic;
const out = [], fail = [];
const ok = (sec, name, pass, note) => { out.push(`${pass?'O':'X'} [${sec}] ${name}${note?' — '+note:''}`); if(!pass) fail.push(`${sec}:${name}${note?' ('+note:''}${note?')':''}`); };

// ── 앵커 A·B: 기둥 직접 지정 → 강약 ──
// **엔진의 strengthOf 를 그대로 부른다.** 예전에는 여기서 공식을 베껴 갖고 있었고,
// 그래서 엔진에 십이운성과 천간 통근을 넣어도 앵커 점수가 안 움직였다.
// 검사가 제 사본을 재고 있었던 것이다. 공식을 두 벌 두면 반드시 어긋난다.
function scoreOf(P) {   // P = [[ys,yb],[ms,mb],[ds,db],[hs,hb]]
  const [Y,M,D,H] = P;
  const pillars = {
    year:  { stem: Y[0], branch: Y[1] },
    month: { stem: M[0], branch: M[1] },
    day:   { stem: D[0], branch: D[1] },
    hour:  { stem: H[0], branch: H[1] },
  };
  const r = E.strengthOf(pillars);
  return { s: r.strengthScore, label: r.strength };
}
const ANCHORS = [
 ['A1 극신강 갑묘월', [[9,3],[0,2],[0,0],[6,6]], '신강'],
 ['A2 극신강 병오월', [[2,6],[0,6],[2,6],[0,6]], '신강'],
 ['A3 신강 경신월',   [[4,8],[6,8],[6,4],[4,2]], '신강'],
 ['A4 극신약 갑유월', [[6,8],[1,9],[0,10],[7,7]],'신약'],
 ['A5 신약 경오월',   [[2,10],[0,6],[6,0],[2,0]],'신약'],
 ['A6 신약 임인월',   [[0,6],[2,2],[8,4],[6,10]],'신약'],
 ['A7 재다신약 경계', [[2,6],[6,0],[4,10],[8,0]],'신약'],
 ['B8 상담 부친',     [[1,1],[0,8],[4,10],[3,5]],'중화'],
 ['B9 상담 모친',     [[5,5],[3,1],[2,0],[9,5]],'신약'],
 ['B10 12월 권고',    [[2,6],[6,0],[5,5],[7,7]],'중화'],
 ['B11 11월 권고',    [[2,6],[5,11],[9,3],[6,8]],'중화'],
];
// A 는 명리 합의라 통과해야 한다. B 는 우리가 옛 공식으로 낸 출력이라
// 그것을 정답으로 놓고 새 공식을 심판하면 순환논법이다(docs/13 참조).
// 그래서 B 는 실패로 세지 않고 '달라짐'만 알린다 — 발행한 판단이 바뀌었다는 통지다.
let aPass=0, bPass=0, bMoved=[];
ANCHORS.forEach(([n,P,exp]) => {
  const r = scoreOf(P), pass = r.label === exp;
  if (n[0]==='A') { if (pass) aPass++; ok('A', n, pass, `${r.label} ${r.s} (기대 ${exp})`); return; }
  if (pass) bPass++; else bMoved.push(`${n}: ${exp} → ${r.label}(${r.s})`);
  out.push(`${pass?'O':'·'} [B] ${n} — ${r.label} ${r.s} (예전 ${exp})`);
});
if (bMoved.length) out.push(`  ※ B는 판정 대상이 아니다. 발행한 판단이 바뀐 자리: ${bMoved.join(' / ')}`);

// ── C: 분포 가드 (결정적 표본 600) ──
const samp = [];
for (let i=0;i<600;i++){
  const y=1955+(i*7919)%51, m=1+(i*104729)%12, d=1+(i*1299709)%28, hh=(i*15485863)%24;
  try { samp.push(E.calc({year:y,month:m,day:d,hour:hh,minute:30,gender:i%2?'F':'M',
    place:'KR:서울',longitude:126.98,tzOffset:null,solarCorrection:true}).analysis); } catch(e){}
}
const sc = samp.map(a=>a.strengthScore);
const avg = Math.round(sc.reduce((a,b)=>a+b,0)/sc.length*1000)/1000;
const pct = l => Math.round(samp.filter(a=>a.strength===l).length/samp.length*1000)/10;
ok('C','표본수', samp.length===600, samp.length+'명');
// 기대 중심은 방식에서 유도한다. 숫자를 박아두면 방식이 바뀔 때 검사가 거짓말한다.
//   천간은 오행 이분법 — 다섯 중 둘(비겁·인성)만 도움이라 무작위면 0.40
//   지지는 십이운성 눈금 — 열두 단계 값의 산술평균
// 자리 무게로 가중해 섞는다. 득령 가산이 위로 밀므로 실측은 기대보다 조금 높게 나온다.
// 천간은 이제 고정 무게가 없다 — 통근한 지지에서 힘을 얻는다.
// 그래서 기대 무게를 표본에서 직접 잰다. 숫자를 박아두면 방식이 바뀔 때 검사가 거짓말한다.
const _W = E.NATAL_WEIGHT;
const _지 = _W.yearBranch + _W.monthBranch + _W.dayBranch + _W.hourBranch;
const _운성 = Object.keys(E.UNSEONG_POWER).reduce((a,k)=>a+E.UNSEONG_POWER[k],0)/12;
let _간합 = 0, _간수 = 0;
for (let i = 0; i < 300; i++) {
  const y=1955+(i*7919)%51, m=1+(i*104729)%12, d=1+(i*1299709)%28, hh=(i*15485863)%24;
  let R; try { R = mk(y,m,d,hh,i%2?'F':'M'); } catch(e) { continue; }
  const p = R.pillars;
  const 터 = [[p.year.branch,_W.yearBranch],[p.month.branch,_W.monthBranch],
              [p.day.branch,_W.dayBranch],[p.hour.branch,_W.hourBranch]];
  ['year','month','hour'].forEach(k => {
    _간합 += Math.max.apply(null, 터.map(([b,w]) => w * E.power(p[k].stem, b)));
    _간수++;
  });
}
const _간평균 = _간수 ? _간합/_간수 : 0;
const _간 = _간평균 * 3;                       // 천간 세 자리의 기대 무게 합
// 천간은 오행 이분법(다섯 중 둘만 도움이라 0.40), 지지는 십이운성 눈금
const 기대중심 = Math.round((_간*0.40 + _지*_운성)/(_간+_지)*1000)/1000;
ok('C', `평균 = 구조적 중심 ${기대중심} ±0.03`, Math.abs(avg-기대중심)<=0.03,
   `평균 ${avg} (지지 방식의 기대값 ${Math.round(_운성*1000)/1000})`);
ok('C','신약 45~62%', pct('신약')>=45&&pct('신약')<=62, '신약 '+pct('신약')+'%');
ok('C','중화 15~25%', pct('중화')>=15&&pct('중화')<=25, '중화 '+pct('중화')+'%');
out.push(`  · 신강 ${pct('신강')}% · 중화 ${pct('중화')}% · 신약 ${pct('신약')}%`);

// ── E: 절기 경계 24개 (±1분에서 정확히 갈리는가) ──
function pillarAt(y,m,d,hh,mm){
  const R=E.calc({year:y,month:m,day:d,hour:hh,minute:mm,gender:'M',place:'KR:서울',
    longitude:126.98,tzOffset:null,solarCorrection:true});
  return {y:E.fmt.pillar(R.pillars.year), mo:E.fmt.pillar(R.pillars.month),
          mb:R.pillars.month.branch, yb:R.pillars.year.branch};
}
const terms = [].concat(E.fmt.termsOfYear(2026)||[], E.fmt.termsOfYear(2027)||[]);
let eBad=[], eN=0;
terms.forEach(t=>{
  const tot=t.hh*60+t.mm;
  if (tot<2) return;                       // 자정 근처는 날짜 계산이 얽혀 건너뛴다
  eN++;
  const before=pillarAt(t.y,t.m,t.d,Math.floor((tot-1)/60),(tot-1)%60);
  const after =pillarAt(t.y,t.m,t.d,Math.floor((tot+1)/60),(tot+1)%60);
  if (before.mo===after.mo) { eBad.push(`${t.name} ${t.y}/${t.m}/${t.d} ${t.hh}:${t.mm} 월주 안 바뀜(${before.mo})`); return; }
  if ((before.mb+1)%12 !== after.mb) eBad.push(`${t.name} 월지 건너뜀 ${before.mo}→${after.mo}`);
  const 입춘 = t.name==='입춘';
  if (입춘 && before.y===after.y) eBad.push('입춘인데 연주 안 바뀜');
  if (!입춘 && before.y!==after.y) eBad.push(`${t.name}인데 연주가 바뀜 ${before.y}→${after.y}`);
});
ok('E',`절기 경계 ${eN}개`, eBad.length===0, eBad.length? eBad.slice(0,3).join(' / ') : '전부 정확');

// ── F: 일주 60갑자 연속성 (3000일) ──
let fBad=null, prev=null;
for (let i=0;i<3000;i++){
  const dt=new Date(Date.UTC(2020,0,1+i));
  const R=E.calc({year:dt.getUTCFullYear(),month:dt.getUTCMonth()+1,day:dt.getUTCDate(),
    hour:12,minute:0,gender:'M',place:'KR:서울',longitude:126.98,tzOffset:null,solarCorrection:true});
  const idx=(R.pillars.day.stem%10)+10*0, s=R.pillars.day.stem, b=R.pillars.day.branch;
  const gz=(s*6 - b*5 + 60)%60;   // 간지 → 0~59
  if (prev!==null && gz!==(prev+1)%60) { fBad=`${dt.toISOString().slice(0,10)} 에서 끊김 (${prev}→${gz})`; break; }
  prev=gz;
}
ok('F','일주 60갑자 3000일 연속', !fBad, fBad||'끊김 없음');

// ── G: 진태양시 — 균시차가 천문값과 맞는가 ──
const eot = (y,m,d) => Math.round(A.equationOfTime(
  (Date.UTC(y,m-1,d,3,0,0)/86400000)+2440587.5)*10)/10;
const G=[['2/11 최소 약 -14분',eot(2027,2,11),-14.2,1.2],
         ['5/14 약 +3.7분',   eot(2027,5,14),  3.7,1.2],
         ['7/26 약 -6.5분',   eot(2027,7,26), -6.5,1.2],
         ['11/3 최대 약 +16분',eot(2027,11,3), 16.4,1.2]];
G.forEach(([n,got,exp,tol])=>ok('G',n, Math.abs(got-exp)<=tol, `계산 ${got}분`));

// ── H: 야자시 (23시 이후는 익일 일주) ──
const hOff=(d,hh)=>E.calc({year:2027,month:6,day:d,hour:hh,minute:30,gender:'M',
  place:'KR:서울',longitude:126.98,tzOffset:null,solarCorrection:false}).pillars;
const d10_22=hOff(10,22), d10_23=hOff(10,23), d11_12=hOff(11,12);
ok('H','23시반은 익일 일주', E.fmt.pillar(d10_23.day)===E.fmt.pillar(d11_12.day),
   `6/10 23:30 → ${E.fmt.pillar(d10_23.day)} · 6/11 정오 → ${E.fmt.pillar(d11_12.day)}`);
ok('H','22시반은 당일 일주', E.fmt.pillar(d10_22.day)!==E.fmt.pillar(d11_12.day),
   `6/10 22:30 → ${E.fmt.pillar(d10_22.day)}`);
ok('H','23시반 시지는 子', d10_23.hour.branch===0, '시지 '+E.BRANCHES[d10_23.hour.branch]);

// I(대운)와 D(격국)는 아래쪽 2부에서 제대로 잰다.
// 1부에 있던 대운 검사는 R.daeun 을 배열로 착각해 값을 못 읽고도 통과로 떨어졌다.
// 못 잰 것을 통과로 내보내는 검사는 없느니만 못하므로 지웠다.
ok('D','ChaeksaClassic 존재', !!C, C?Object.keys(C).join(','):'없음');

return out.join('\n') + `\n\n요약: A ${aPass}/7 · B ${bPass}/4 · 실패 ${fail.length}건`
  + (fail.length? '\n실패 목록:\n  '+fail.join('\n  ') : '');
})();
  const r2 = (() => {
const E = window.ChaeksaEngine, T = window.ChaeksaTypecard, C = window.ChaeksaClassic;
const out = [], fail = [];
const ok = (s,n,p,note)=>{ out.push(`${p?'O':'X'} [${s}] ${n}${note?' — '+note:''}`); if(!p) fail.push(`${s}:${n}`); };
const mk = (y,m,d,hh,g) => E.calc({year:y,month:m,day:d,hour:hh,minute:30,gender:g,
  place:'KR:서울',longitude:126.98,tzOffset:null,solarCorrection:true});

// ── I: 대운 순행·역행 (양남음녀 순행) ── R.daeun = {forward, list:[...]}
const cases = [[1984,'M',true],[1984,'F',false],[1985,'M',false],[1985,'F',true]];
cases.forEach(([y,g,exp])=>{
  const R = mk(y,6,15,12,g), D = R.daeun;
  if (!D || !D.list || !D.list.length) return ok('I',`${y} ${g}`,false,'대운 없음');
  const a=D.list[0], b=D.list[1];
  const 실제방향 = ((b.branch-a.branch+12)%12)===1;
  const 연간 = E.fmt.pillar(R.pillars.year);
  ok('I',`${y}년 ${g==='M'?'남':'여'} (${연간})`,
     D.forward===exp && 실제방향===exp,
     `forward=${D.forward} · 배열 ${실제방향?'순행':'역행'} · 기대 ${exp?'순행':'역행'}`);
});
// 대운 간지가 월주에서 이어지는가
{
  const R = mk(1984,6,15,12,'M'), D = R.daeun, m = R.pillars.month;
  const first = D.list[0];
  const 다음간 = (m.stem + (D.forward?1:-1)+10)%10, 다음지 = (m.branch + (D.forward?1:-1)+12)%12;
  ok('I','첫 대운이 월주 다음 간지', first.stem===다음간 && first.branch===다음지,
     `월주 ${E.fmt.pillar(m)} → 대운1 ${E.fmt.pillar(first)}`);
  ok('I','대운 10년 간격', D.list[1].startAge - D.list[0].startAge === 10,
     `${D.list[0].startAge}세 → ${D.list[1].startAge}세`);
}

// ── D: 격국 — 양인격은 甲卯·丙午·庚酉·壬子 넷뿐 ──
let 양인표본=[], 위반=[], n=0;
for (let i=0;i<1200;i++){
  const y=1950+(i*7919)%70, m=1+(i*104729)%12, d=1+(i*1299709)%28, hh=(i*15485863)%24;
  let R; try { R = mk(y,m,d,hh,i%2?'F':'M'); } catch(e){ continue; }
  n++;
  const J = T.gyeok(R);
  if (J.name==='양인'){
    const ds=R.pillars.day.stem, mb=R.pillars.month.branch;
    양인표본.push(E.STEMS[ds]+E.BRANCHES[mb]);
    const 허용 = (ds===0&&mb===3)||(ds===2&&mb===6)||(ds===6&&mb===9)||(ds===8&&mb===0);
    if (!허용) 위반.push(E.STEMS[ds]+'일간 '+E.BRANCHES[mb]+'월');
  }
}
const 종류 = [...new Set(양인표본)].sort();
ok('D',`양인격 조합 (표본 ${n})`, 위반.length===0,
   위반.length? '위반 '+위반.slice(0,4).join(',') : `${양인표본.length}건 · 조합 ${종류.join(' ')}`);

// 건록·양인격의 신약률을 전체와 견준다.
// 절대 상한(≤15%)은 옛 공식을 튜닝해 얻은 숫자였고 표본에 5%p 넘게 흔들렸다.
// 자평진전 '득시불왕'과도 충돌한다 — 월령을 얻었다고 반드시 왕한 것이 아니다.
// 방향만 본다: 월령을 얻은 집단이 전체보다 신약이 많으면 그건 진짜 뒤집힌 것이다.
let 록인=0, 록인신약=0, 전부=0, 전부신약=0;
for (let i=0;i<1200;i++){
  const y=1950+(i*7919)%70, m=1+(i*104729)%12, d=1+(i*1299709)%28, hh=(i*15485863)%24;
  let R; try { R = mk(y,m,d,hh,i%2?'F':'M'); } catch(e){ continue; }
  전부++; if (R.analysis.strength==='신약') 전부신약++;
  const J = T.gyeok(R);
  if (J.name==='양인'||J.name==='건록'){ 록인++; if (R.analysis.strength==='신약') 록인신약++; }
}
const 비율 = 록인? Math.round(록인신약/록인*1000)/10 : 0;
const 전체신약 = 전부? Math.round(전부신약/전부*1000)/10 : 0;
ok('D','건록·양인 신약 < 전체 신약', 비율 < 전체신약,
   `건록양인 ${비율}% (${록인신약}/${록인}) · 전체 ${전체신약}%`);

// 자평진전 성격/파격 비율 (12월 전수 근사)
let 성격=0, 파격=0;
for (let d=14; d<=24; d++) for (let hh=0; hh<24; hh+=2){
  let R; try { R = E.calc({year:2026,month:12,day:d,hour:hh,minute:30,gender:'M',
    place:'KR:서울',longitude:126.98,tzOffset:null,solarCorrection:true}); } catch(e){ continue; }
  (T.gyeok(R).ok ? 성격++ : 파격++);
}
ok('D','12월 전수 성격:파격 ≈ 66:66', Math.abs(성격-66)<=6 && Math.abs(파격-66)<=6,
   `${성격}:${파격}`);

// 궁통보감 표 무결성 — 월지12 × 일간10 = 120칸
{
  // TABLE 은 천간(甲~癸) 키 아래 월지(寅~丑) 키를 두는 객체다.
  // 처음엔 [월지][천간] 인덱스로 세다가 0칸이 나왔다 — 표가 아니라 검사가 틀렸다.
  const tb = C && C.TABLE;
  let 칸=0, 빈칸=[], need빔=0;
  if (tb) E.STEMS.forEach(st => {
    const row = tb[st];
    E.BRANCHES.forEach(br => {
      const v = row ? row[br] : undefined;
      if (v === undefined || v === null) { 빈칸.push(st+br); return; }
      칸++;
      if (!v.need && !v[0]) need빔++;
    });
  });
  ok('D','궁통보감 120칸', 칸===120 && need빔===0,
     칸+'칸'+(빈칸.length?' · 빈칸 '+빈칸.slice(0,4).join(','):'')+(need빔?` · 용신 없는 칸 ${need빔}`:''));
}

// ── 추가: 지장간·공망 표 무결성 ──
{
  let bad=[];
  for (let b=0;b<12;b++){ const h=E.HIDDEN[b]; if(!h||!h.length||h.some(x=>x<0||x>9)) bad.push(E.BRANCHES[b]); }
  ok('J','지장간 12지 전부 유효', bad.length===0, bad.length?bad.join(','):'12지 정상');
  const cnt = E.HIDDEN.map(h=>h.length);
  out.push('  · 지장간 개수 '+cnt.join(','));
}
return out.join('\n') + `\n\n실패 ${fail.length}건` + (fail.length? '\n  '+fail.join('\n  ') : '');
})();

// ── L: 오늘 정한 규칙이 실제로 그렇게 도는가 ──
// 형식이 아니라 **내용**을 본다. 「표가 안 깨졌다」는 검사가 아니다.
// 지장간이 172커밋을 버틴 것도, 검사가 제 사본만 재고 있던 것도 여기가 없어서였다.
// 규칙을 하나 정할 때마다 여기에 한 줄을 더한다. 근거는 docs/15_동결표.md 다.
const r3 = (() => {
const E = window.ChaeksaEngine, T = window.ChaeksaTypecard, CY = window.ChaeksaChaeyong;
const out = [], fail = [];
const ok = (tag, name, cond, detail) => {
  out.push((cond ? 'O' : 'X') + ' [' + tag + '] ' + name + (detail ? ' — ' + detail : ''));
  if (!cond) fail.push(name + (detail ? ' — ' + detail : ''));
};
const S = (ch) => E.STEMS.indexOf(ch), B = (ch) => E.BRANCHES.indexOf(ch);
const W = E.NATAL_WEIGHT;
const 기둥 = (y, m, d, h) => ({
  year:  { stem: S(y[0]), branch: B(y[1]) },
  month: { stem: S(m[0]), branch: B(m[1]) },
  day:   { stem: S(d[0]), branch: B(d[1]) },
  hour:  { stem: S(h[0]), branch: B(h[1]) },
});
const 자리of = (p) => {
  const a = [[p.year.branch, W.yearBranch], [p.month.branch, W.monthBranch], [p.day.branch, W.dayBranch]];
  if (p.hour) a.push([p.hour.branch, W.hourBranch]);
  return a;
};
const 서울 = { place: 'KR:서울', longitude: 126.98, tzOffset: null, solarCorrection: true };
const 사례 = E.calc(Object.assign({ year: 1992, month: 4, day: 21, hour: 0, minute: 20, gender: 'M' }, 서울));

// L1 십이운성 장생지 열 자리 (역행판)
{
  const 표 = [['甲','亥'],['乙','午'],['丙','寅'],['丁','酉'],['戊','寅'],
              ['己','酉'],['庚','巳'],['辛','子'],['壬','申'],['癸','卯']];
  const 틀린 = 표.filter(v => E.unseong(S(v[0]), B(v[1])) !== '장생').map(v => v.join(''));
  ok('L', 'L1 장생지 10개', 틀린.length === 0,
     틀린.length ? '틀림 ' + 틀린.join(' ') : '甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯');
}
// L2 양간 순행 · 음간 역행
{
  const a = E.unseong(S('甲'), B('子')), b = E.unseong(S('乙'), B('子'));
  ok('L', 'L2 양간 순행·음간 역행', a === '목욕' && b === '병', '甲子 ' + a + '(순행) · 乙子 ' + b + '(역행)');
}
// L3 묘는 두 칸 — 통근하면 묘고, 못 하면 0 (자평진전 득시불왕)
{
  const 고 = E.power(S('壬'), B('辰')), 맹 = E.power(S('丁'), B('丑'));
  const 둘다묘 = E.unseong(S('壬'), B('辰')) === '묘' && E.unseong(S('丁'), B('丑')) === '묘';
  ok('L', 'L3 묘 두 칸', 둘다묘 && 고 === E.UNSEONG_POWER.묘고 && 맹 === 0,
     '壬辰 묘고 ' + 고 + ' (辰중 癸) · 丁丑 묘 ' + 맹 + ' (丑에 화 없음)');
}
// L4 천간의 자리는 힘에 관여하지 않는다
{
  const p1 = 기둥('壬申','甲辰','丁卯','庚子'), p2 = 기둥('庚申','甲辰','丁卯','壬子');
  const a = E.stemPower(S('壬'), 자리of(p1)), b = E.stemPower(S('壬'), 자리of(p2));
  ok('L', 'L4 천간 자리 가중 없음', a === b,
     '연간 壬 ' + a.toFixed(2) + ' = 시간 壬 ' + b.toFixed(2) + ' (지지가 같으면 같다)');
}
// L5 지지 자리 무게
{
  ok('L', 'L5 지지 자리 무게', W.monthBranch === 2.0 && W.yearBranch === 1.0 && W.dayBranch === 1.0 && W.hourBranch === 1.5,
     '연' + W.yearBranch + ' 월' + W.monthBranch + ' 일' + W.dayBranch + ' 시' + W.hourBranch);
}
// L6 지장간 — 왕지(子卯酉)는 둘, 나머지는 셋 · 亥의 여기 무토
{
  const 둘 = [B('子'), B('卯'), B('酉')];
  const 맞 = E.HIDDEN.every((h, b) => h.length === (둘.indexOf(b) >= 0 ? 2 : 3));
  const 해 = E.HIDDEN[B('亥')].map(x => E.STEMS[x]).join('');
  ok('L', 'L6 지장간 — 왕지 2 나머지 3', 맞 && 해 === '壬甲戊', '子卯酉 2개 · 나머지 3개 · 亥 ' + 해);
}
// L7 합거 = 명령없음 (계수 없이 0)
{
  const p = 기둥('甲子','己巳','丁卯','庚子'), h = E.natalHap(p);
  const a = E.strengthOf(p).strengthScore;
  const b = E.strengthOf(기둥('甲子','乙巳','丁卯','庚子')).strengthScore;
  ok('L', 'L7 합거 = 명령없음', h.year === 'month' && h.month === 'year' && a !== b,
     '甲己 합거 → ' + a + ' · 합 없는 甲乙 → ' + b);
}
// L8 일간은 합거하지 않는다
{
  const h = E.natalHap(기둥('壬申','丙辰','丁卯','庚子'));
  ok('L', 'L8 일간은 합거 안 함', Object.keys(h).length === 0,
     '일간 丁 · 연간 壬 이 합이지만 합거 ' + Object.keys(h).length + '건');
}
// L9 격합은 안 본다 (월간-시간)
{
  const h = E.natalHap(기둥('壬申','甲辰','丁卯','己亥'));
  ok('L', 'L9 격합 안 봄', Object.keys(h).length === 0,
     '월간 甲 · 시간 己 가 합이지만 합거 ' + Object.keys(h).length + '건 — forks 가 갈림으로 표시');
}
// L10 삼합국 — 국이 명령의 단위
{
  const p = 기둥('壬申','甲辰','丁卯','庚子'), 자리 = 자리of(p);
  const 국 = E.samhapOf(자리), 힘 = E.stemPower(S('壬'), 자리);
  const 하나 = Math.max.apply(null, 자리.map(v => v[1] * E.power(S('壬'), v[0])));
  ok('L', 'L10 삼합국 — 국이 명령의 단위', 국.length === 1 && 힘 > 하나 + 0.001,
     '申子辰 수국 · 壬 국 ' + 힘.toFixed(2) + ' > 자리 하나 ' + 하나.toFixed(2));
}
// L11 국은 남의 뿌리를 뺏지 않는다
{
  const p = 기둥('壬申','甲辰','丁卯','庚子'), 자리 = 자리of(p);
  const 庚 = E.stemPower(S('庚'), 자리), 甲 = E.stemPower(S('甲'), 자리);
  const 기대 = W.yearBranch * E.power(S('庚'), B('申'));
  ok('L', 'L11 국이 남의 뿌리를 안 뺏는다', Math.abs(庚 - 기대) < 0.001 && 甲 > 1.0,
     '庚 ' + 庚.toFixed(2) + ' (申 건록 그대로) · 甲 ' + 甲.toFixed(2) + ' (辰 여기 그대로)');
}
// L12 국이 서도 오행 개수는 안 바뀐다 — 금이 수로 바뀌는 게 아니다
{
  const c = 사례.analysis.elemCount;
  ok('L', 'L12 국이 서도 오행 개수 불변', c[3] === 2 && c[4] === 2 && c[2] === 1,
     '목' + c[0] + ' 화' + c[1] + ' 토' + c[2] + ' 금' + c[3] + ' 수' + c[4] + ' — 申은 금, 辰은 토 그대로');
}
// L13 격은 국을 따른다 (자평진전)
{
  const J = T.gyeok(사례);
  ok('L', 'L13 격은 국을 따른다', J.name === '정관' && J.ok === 1,
     '월지 辰(정기 戊=상관)인데 수국이라 ' + J.name + ' ' + (J.ok ? '성격' : '파격'));
}
// L14 무근은 0 — 바닥이 없다. 원국 천간도 운의 천간도 같은 stemPower 를 쓴다
{
  const 맹 = E.stemPower(S('丁'), [[B('丑'), 1.0]]);         // 丑중 己癸辛 — 화가 없다
  const 장생 = E.stemPower(S('丁'), [[B('酉'), 1.0]]);        // 丁의 장생지
  ok('L', 'L14 무근은 0 (바닥 없음)', 맹 === 0 && 장생 > 0,
     '丁이 丑 뿐이면 ' + 맹 + ' · 酉 면 ' + 장생.toFixed(2) + ' — 이름만 오는 것은 힘을 못 쓴다');
}
// L15 촉발은 짧은 주기가 무겁다 (세력과 반대)
{
  const R = E.calc(Object.assign({ year: 1990, month: 6, day: 15, hour: 10, minute: 0, gender: 'M' }, 서울));
  const St = CY.stack(R, new Date(2026, 7, 28, 12));
  const ps = St.triggerParts || [];
  const 대 = ps.filter(v => v.name === '대운')[0], 시 = ps.filter(v => v.name === '시운')[0];
  ok('L', 'L15 촉발은 짧은 주기가 무겁다', !!(대 && 시) && 시.w > 대.w,
     대 && 시 ? '대운 ' + 대.w + ' < 시운 ' + 시.w : '층이 모자람');
}
// L16 운은 합을 풀지 않는다 — 壬 이 와도 원국 합거는 그대로
{
  const R = 사례;
  const 세운丁 = CY.stack(R, new Date(2027, 5, 15, 12));   // 세운 丁未 — 연간 壬 을 묶는다
  const 월운壬 = CY.stack(R, new Date(2027, 11, 15, 12));  // 월운 壬子 — 壬 이 하나 더 온다
  const 묶임 = (Sx) => (Sx.합거 || []).some(h => h.자리 === '연간');
  const 채움 = (Sx) => Sx.layers.some(l => l.빈자리채움 && l.빈자리채움.length);
  ok('L', 'L16 운은 합을 풀지 않는다', 묶임(세운丁) && 묶임(월운壬) && 채움(월운壬),
     '2027 세운 丁未 합거 유지 · 12월 월운 壬子 도 합거 유지 + 빈자리 채움');
}
// L17 갈림 — 판정이 필요한 자리를 엔진이 스스로 말한다
{
  let n = 0, 있 = 0; const 종 = {};
  for (let i = 0; i < 600; i++) {
    const y = 1960 + (i * 7919) % 60, m = 1 + (i * 104729) % 12,
          d = 1 + (i * 1299709) % 28, hh = (i * 15485863) % 24;
    let X; try { X = E.calc(Object.assign({ year: y, month: m, day: d, hour: hh, minute: 30, gender: i % 2 ? 'F' : 'M' }, 서울)); }
    catch (e) { continue; }
    n++; const g = E.forks(X.pillars);
    if (g.length) 있++;
    g.forEach(v => { 종[v.이름] = (종[v.이름] || 0) + 1; });
  }
  const 율 = 있 / n * 100;
  const 세종 = ['반합', '격합', '격지 충'].every(k => 종[k] > 0);
  ok('L', 'L17 갈림 — 세 종류가 다 잡히고 20~50%', 세종 && 율 >= 20 && 율 <= 50,
     있 + '/' + n + ' (' + 율.toFixed(1) + '%) · ' + Object.keys(종).map(k => k + ' ' + 종[k]).join(' · '));
}
// L18 지지의 충은 격 판정을 안 바꾼다 — 사실만 내고 판정은 사람이 한다
{
  const 있 = 기둥('丁卯','庚戌','壬辰','丁未');   // 월지 戌 ↔ 일지 辰 충
  const 없 = 기둥('丁卯','庚戌','壬寅','丁未');   // 같은 판에서 충만 없앤 것
  const rs = E.branchRels(있).성립.filter(r => r.종류 === '충' && r.격지);
  const a = T.gyeok({ pillars: 있, analysis: E.strengthOf(있) });
  const b = T.gyeok({ pillars: 없, analysis: E.strengthOf(없) });
  ok('L', 'L18 지지 충은 격 판정을 안 바꾼다', rs.length === 1 && a.name === b.name,
     '戌辰 격지 충이 있어도 ' + a.name + '격 · 충 없는 판(壬寅)도 ' + b.name + '격');
}
// L20 형충회합의 순서 — 삼합 > 육합 > 충 (사장님 예시가 앵커다)
//   「년지 유금 월지 묘목 일지 술토라서 묘술합으로 묘유충이 일어나지 않았으나
//     시지 오화가 있어서 오술삼합으로 묘유충이 성립된다」
{
  const z = a => E.resolveBranches(a.map(v => [B(v[0]), v[1]]));
  const 전 = z([['酉','연지'],['卯','월지'],['戌','일지']]);
  const 후 = z([['酉','연지'],['卯','월지'],['戌','일지'],['午','시지']]);
  const 충있 = r => r.성립.some(v => v.종류 === '충' && v.글자 === '酉卯');
  const 합있 = (r, g) => r.성립.some(v => v.글자 === g);
  ok('L', 'L20 합이 충을 막는다 (貪合忘冲)', 합있(전, '卯戌') && !충있(전),
     '酉卯戌 — 卯戌 육합이 서서 卯酉충이 보류된다');
  ok('L', 'L20 강한 합이 약한 합을 뺏는다 → 충이 살아난다', 합있(후, '午戌') && !합있(후, '卯戌') && 충있(후),
     '시지 午 추가 — 午戌 반합이 戌을 가져가 卯戌 육합이 깨지고 卯酉충 성립');
}
// L19 콘텐츠의 축은 흔들리지 않는다 — 궁통보감은 강약 재료에 안 흔들린다
// 발행한 자료의 순위가 하루 만에 틀어진 원인이 「축을 강약에 걸어놓은 것」이었다.
// 조후를 주축으로 올린 근거가 이 한 줄이다. 이 검사가 깨지면 콘텐츠가 다시 흔들린다.
{
  const C2 = window.ChaeksaClassic, P = E.UNSEONG_POWER, 원 = P.쇠;
  const 입력 = [], 조후 = [], 강약 = [];
  for (let i = 0; i < 300; i++) {
    const y = 1960 + (i * 7919) % 60, m = 1 + (i * 104729) % 12,
          d = 1 + (i * 1299709) % 28, hh = (i * 15485863) % 24;
    const inp = Object.assign({ year: y, month: m, day: d, hour: hh, minute: 30, gender: 'M' }, 서울);
    let X; try { X = E.calc(inp); } catch (e) { continue; }
    입력.push(inp); 조후.push(C2.gungtong(X).score); 강약.push(X.analysis.strengthScore);
  }
  P.쇠 = 0.45;
  let 조후바뀜 = 0, 강약바뀜 = 0;
  입력.forEach((inp, k) => {
    const X = E.calc(inp);
    if (C2.gungtong(X).score !== 조후[k]) 조후바뀜++;
    if (X.analysis.strengthScore !== 강약[k]) 강약바뀜++;
  });
  P.쇠 = 원;
  ok('L', 'L19 궁통보감은 강약 재료에 안 흔들린다', 조후바뀜 === 0 && 강약바뀜 > 0,
     '쇠 .62→.45 · 강약 ' + 강약바뀜 + '건 움직임 · 조후 ' + 조후바뀜 + '건');
}
return out.join('\n') + '\n\n실패 ' + fail.length + '건' + (fail.length ? '\n  ' + fail.join('\n  ') : '');
})();

  return r1 + '\n\n' + r2 + '\n\n' + r3;
})()
