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

// ── 앵커 A·B: 기둥 직접 지정 → 강약 재현 ──
function scoreOf(P) {   // P = [[ys,yb],[ms,mb],[ds,db],[hs,hb]]
  const [Y,M,D,H] = P, ds = D[0], de = E.STEM_ELEM[ds], W = E.NATAL_WEIGHT;
  const got = E.BRANCH_ELEM[M[1]] === de || E.BRANCH_ELEM[M[1]] === (de+4)%5;
  const seats = [[E.STEM_ELEM[Y[0]],W.yearStem],[E.BRANCH_ELEM[Y[1]],W.yearBranch],
                 [E.STEM_ELEM[M[0]],W.monthStem],[E.BRANCH_ELEM[M[1]],W.monthBranch],
                 [E.BRANCH_ELEM[D[1]],W.dayBranch],
                 [E.STEM_ELEM[H[0]],W.hourStem],[E.BRANCH_ELEM[H[1]],W.hourBranch]];
  let sup=0, tot=0;
  for (const [el,w] of seats) { tot+=w; if (E.siding(de,el)>0) sup+=w; }
  if (got) { sup+=0.6; tot+=0.6; }
  const s = Math.round((sup/tot)*100)/100;
  return { s, label: E.STRENGTH_LABEL(s) };
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
let aPass=0, bPass=0;
ANCHORS.forEach(([n,P,exp]) => {
  const r = scoreOf(P), pass = r.label === exp;
  if (pass) { n[0]==='A' ? aPass++ : bPass++; }
  ok(n[0]==='A'?'A':'B', n, pass, `${r.label} ${r.s} (기대 ${exp})`);
});

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
ok('C','평균 0.37~0.43', avg>=0.37&&avg<=0.43, '평균 '+avg);
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

// 건록·양인격 중 신약 비율 (앵커 C: ≤15%)
let 록인=0, 록인신약=0;
for (let i=0;i<1200;i++){
  const y=1950+(i*7919)%70, m=1+(i*104729)%12, d=1+(i*1299709)%28, hh=(i*15485863)%24;
  let R; try { R = mk(y,m,d,hh,i%2?'F':'M'); } catch(e){ continue; }
  const J = T.gyeok(R);
  if (J.name==='양인'||J.name==='건록'){ 록인++; if (R.analysis.strength==='신약') 록인신약++; }
}
const 비율 = 록인? Math.round(록인신약/록인*1000)/10 : 0;
ok('D','건록·양인격 중 신약 ≤15%', 비율<=15, `${비율}% (${록인신약}/${록인})`);

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
  return r1 + '\n\n' + r2;
})()
