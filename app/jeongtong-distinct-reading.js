/* 정통사주: 이미 확인한 조건으로 개인의 특징을 읽는다.
 * 분류·성립·누적 비율은 API 값 그대로. 같은 뜻의 대목은 함께 읽되 삭제하지 않는다. */
(function (root) {
  'use strict';
  const topics = { movement: '배움과 이동', wealth: '재물이 모이는 방식', talent: '재능과 판단력', character: '사람을 대하는 성품', relationship: '인연과 매력', career: '맡을 자리와 권한', honor: '이름과 명예', structure: '강점이 작동하는 이유', support: '나를 받치는 기운', season: '계절에 필요한 기운' };
  // 짧은 이름은 책사의 해석. 고전의 표현·조건·예외는 본문과 원문에 함께 둔다.
  const portraits = {
    'SM05-005': ['도움을 받아 올라서는 사람', '일찍 도움을 받고 벼슬이 쉽게 오른다고 했습니다.', '지관향', 6],
    'SM06B-087': ['지위에 재복을 더하는 사람', '높은 지위뿐 아니라 재물도 얻는다고 했습니다.', '록고봉재', 5],
    'SM06B-140': ['재물을 쌓아 가는 사람', '곡식과 비단이 넉넉하고, 집안에 재물이 쌓인다고 했습니다.', '일좌천재', 8],
    'SM06B-159': ['늦게 올라 이름을 남기는 사람', '늦게 출세해 높은 벼슬을 맡고 이름을 드러낸다고 했습니다. 부딪힘을 반기되 지나치게 짓눌리지 않아야 한다는 조건도 붙습니다.', '시묘격', 7],
    'SM06B-163': ['재물을 맡고 살림을 키우는 사람', '선비는 돈과 곡식을 맡고, 보통 사람은 넉넉하게 산다고 했습니다.', '고두재', 5],
    'SMM1-042': ['젊어서 길을 여는 사람', '젊어서 일이 순조롭고 벼슬을 구하기 쉬우며, 관리가 되면 청렴하고 이름이 드러난다고 했습니다.', '마극신', 5],
    'SMM1-075': ['배움과 이동으로 이름을 높이는 사람', '배움의 자리인 학당과 이동을 뜻하는 역마가 만나, 지위와 공이 천하의 으뜸이라고 했습니다.', '학당조역마', 10],
    'SMM1-045': ['움직일 때 큰 몫을 하는 사람', '잘 갖춰진 역마 하나가 백의 몫을 한다고 했습니다.', '역마 우일당백', 7],
    'YH-026': ['총명하고 결단이 빠른 사람', '총명하고 글에 뛰어나며, 일이 닥치면 결단을 내린다고 했습니다. 같은 구절에는 사람 죽이기를 좋아한다는 거친 경계도 있습니다.', '괴강', 9],
    'YH-024': ['어질고 자애로운 사람', '성품이 어질고 자애롭다고 했습니다.', '일덕', 6],
    'YH-079': ['이름을 널리 알리는 사람', '고향과 나라에 이름을 널리 알린다고 했습니다.', '살장관로', 4],
    'YH-M008': ['큰 권한을 맡는 사람', '장수의 권한을 쥐고 변방을 지킨다고 했습니다.', '화약봉수', 3]
  };
  // 격 이름 하나로 적용하지 않는다. 판정이 반환한 연결 근거가 있을 때만 선택한다.
  const mechanisms = [
    [/관이 재와 인을 함께 만나고 둘이 서로 걸리지 않는다/, '배운 것으로 맡은 일을 해냅니다.', '돈은 맡은 일을 뒷받침하고, 배움은 그 일을 해낼 힘이 됩니다. 돈과 배움이 서로 방해하지 않는 구성입니다.', '돈과 배움이 함께 받쳐 줍니다.', '관이 재와 인을 함께 만나고 둘이 서로 걸리지 않는다'],
    [/관이 인으로 돌아 나에게 온다/, '배움을 통해 책임을 감당합니다.', '맡은 일에서 오는 부담을 배움과 도움으로 받아 냅니다.', '배움이 책임을 감당할 힘이 됩니다.', '관이 인으로 돌아 나에게 온다'],
    [/살인상생|관과 인이 둘 다 온전하다/, '압박을 배움으로 받아 냅니다.', '거센 요구를 뜻하는 살이 배움과 도움을 뜻하는 인으로 이어집니다. 강한 요구를 받아 낼 길이 있는 구성입니다.', '배움과 도움이 압박을 받아 줍니다.', '살인상생 · 관인 연결'],
    [/식신이 재를 생하는데 일간이 강하다|식신이 재를 생한다/, '만든 것이 돈으로 이어집니다.', '꾸준히 만들어 내는 힘이 돈을 뜻하는 재성으로 이어집니다.', '꾸준히 내놓는 결과물이 재물의 출발점입니다.', '식신생재'],
    [/상관이 재를 생한다/, '재주를 돈으로 바꾸는 길이 있습니다.', '표현하고 새로 만들어 내는 재주가 재물로 이어지는 구성입니다.', '재주를 실제 결과물로 내놓는 쪽을 봅니다.', '상관생재'],
    [/상관이 왕하고 인에 뿌리가 있다/, '배움으로 재주를 다듬습니다.', '강하게 드러나는 재주를 배움이 붙잡아 줍니다.', '재주를 잡아 줄 배움이 함께 있습니다.', '상관패인'],
    [/식신이 살을 제|식신이 투출.*살/, '실력으로 거센 요구에 맞섭니다.', '만들어 내는 힘인 식신이 압박을 뜻하는 살을 누르는 구성입니다.', '압박을 누르는 것은 만들어 내는 실력입니다.', '식신제살'],
    [/관을 생해 그 관이 겁재를 제한다/, '맡은 책임으로 재물을 지킵니다.', '재물을 나눠 가져가는 힘을 책임과 규칙을 뜻하는 관이 막아 줍니다.', '재물을 지켜 주는 책임과 규칙이 있습니다.', '관으로 겁재를 막음'],
    [/인수가 투출해 상관을 제한다/, '배움이 맡은 자리를 지켜 줍니다.', '말과 재주가 맡은 책임을 해치려 할 때, 배움이 그 충돌을 막습니다.', '배움이 말과 행동을 다잡아 줍니다.', '인수제상관'],
    [/재가 관을 생해 관이 왕하다|관이 재의 생을 받는다/, '재물이 맡은 일을 뒷받침합니다.', '돈을 뜻하는 재성이 책임과 자리를 뜻하는 관을 키워 줍니다.', '맡은 일을 뒷받침할 재성이 있습니다.', '재생관'],
    [/일간과 인이 둘 다 왕해 식상으로 빼낸다/, '배운 것을 밖으로 펼칩니다.', '자신과 배움의 힘이 모두 강하고, 표현과 결과물을 통해 그 힘을 밖으로 내보냅니다.', '배운 것을 표현할 길이 함께 있습니다.', '인왕용식상'],
    [/재가 살을, 살이 인을 생해 일간에 이른다/, '돈과 책임을 배움으로 연결합니다.', '재물이 책임을 키우고, 배움이 그 책임을 받아 나를 돕는 구성입니다.', '돈에서 책임으로, 책임에서 배움으로 이어집니다.', '재살인 연결'],
    [/상관이 관을 친다/, '말과 재주가 맡은 자리와 부딪힙니다.', '자기 방식으로 표현하는 힘이 책임과 규칙을 뜻하는 관을 칩니다.', '표현과 책임 사이의 충돌을 살펴야 합니다.', '상관견관'],
    [/재는 가벼운데 비겁이 무겁다/, '재물을 혼자 지키기 어렵습니다.', '재물의 힘보다 같은 몫을 나누려는 힘이 큽니다.', '내 몫을 나누는 관계가 걸림돌입니다.', '재경비중'],
    [/인이 가벼운데 재를 만난다/, '돈을 좇다가 배움의 힘을 잃습니다.', '재물이 배움과 도움을 뜻하는 인을 누르는 구성입니다.', '돈과 배움이 부딪히는 지점을 살펴야 합니다.', '재극인'],
    [/식신이 편인을 만난다/, '생각이 하던 일을 가로막습니다.', '깊이 파고드는 편인이 꾸준히 만들어 내는 식신을 누르는 구성입니다.', '생각과 실행이 부딪히는 지점을 살펴야 합니다.', '효신탈식']
  ];
  const typeLines = { 정관: '맡은 책임과 기준을 중시합니다.', 편관: '거센 요구와 압박을 다루는 것이 중심입니다.', 정재: '꾸준히 벌고 지키는 일을 중시합니다.', 편재: '사람과 기회를 통해 돈벌이를 넓히는 쪽입니다.', 정인: '배우고 받아들이는 것이 중심입니다.', 편인: '자신만의 답을 깊이 파고듭니다.', 식신: '꾸준히 만들고 내놓는 것이 중심입니다.', 상관: '자기 생각과 재주를 드러내는 쪽입니다.', 건록: '자기 힘과 자기 몫을 중시합니다.', 양인: '경쟁 속에서 자기 힘을 드러내는 쪽입니다.' };
  const stems = {甲:'갑목',乙:'을목',丙:'병화',丁:'정화',戊:'무토',己:'기토',庚:'경금',辛:'신금',壬:'임수',癸:'계수'};
  const stemText = s => [...String(s || '')].filter(c=>stems[c]).map(c=>stems[c]+'('+c+')').join('·');
  function apply(m) {
    if (!m.filterStory?.filters) return m;
    const type = String(m.axes?.find(a=>a.id==='격')?.값 || '').replace(/격$/,'');
    const state = m.axes?.find(a=>a.id==='성패');
    const reasons = state?.근거 || [];
    const explanation = mechanisms.find(row=>reasons.some(s=>row[0].test(s)));
    const context = m.readingContext || {}, season = context.season;
    const filters = m.filterStory.filters.map(f=>{
      const out = {...f};
      if (f.key.startsWith('type:')) { out.title=typeLines[type] || f.title; out.line='타고난 사주의 '+type+'격을 풀이한 성향입니다. 강점이 작동하는 조건은 성패 근거와 함께 봅니다.'; }
      if (f.key.startsWith('state:') && explanation) { out.title=explanation[1]; out.line=explanation[2]; }
      if (f.key.startsWith('season:') && season) {
        const main=stemText(season.need), aux=stemText(season.aux);
        out.title=season.hasMain ? '필요한 '+main+' 기운을 갖췄습니다.' : '필요한 '+main+' 기운은 없고, '+aux+' 기운이 있습니다.';
        out.line=season.hasMain ? '태어난 계절에 먼저 필요한 기운을 사주에 갖췄습니다.' : '먼저 필요한 기운과 보조하는 기운은 다릅니다. 이 사주에는 보조하는 쪽이 있습니다.';
      }
      if (f.key.startsWith('form:') && context.twoElements?.length<=2) {
        out.title=context.twoElements.join('·')+' 기운이 사주의 흐름을 이끕니다.';
      }
      return out;
    });
    const byKey = new Map(filters.map(f=>[f.key,f]));
    const groups = (m.filterStory.groups || []).map(g=>{
      const members=g.keys.map(k=>byKey.get(k)).filter(Boolean);
      const preferred=members.filter(f=>portraits[f.key]).sort((a,b)=>portraits[b.key][3]-portraits[a.key][3])[0];
      const lead=preferred || members.find(f=>f.key.startsWith('state:')) || members[0];
      return {...g,topic:topics[g.id]||'고전이 붙인 이름',members,lead};
    }).filter(g=>g.lead);
    const signature=groups.find(g=>!['structure','support','season'].includes(g.id));
    const portrait=signature && portraits[signature.lead.key];
    const identity={...m.identity};
    if(portrait){identity.title=portrait[0];identity.line=explanation ? explanation[1] : typeLines[type] || identity.line;identity.name=portrait[2];identity.hanja=String(signature.lead.classical||'').split(/[（(]/)[0];identity.basis='《'+signature.lead.book+'》의 '+signature.lead.name+' 대목을 풀어 책사가 붙인 이름입니다. '+portrait[1];}
    else if(explanation){identity.title=explanation[1];identity.line=signature ? signature.lead.title : typeLines[type] || identity.line;}
    const condition=explanation ? {title:explanation[3],text:explanation[2],basis:reasons.join(' / ')} : {title:state?.값==='깨졌다'?'강점을 해치는 조건이 함께 있습니다.':'타고난 성향과 성립 조건을 함께 봅니다.',text:typeLines[type]||'판정에 나온 조건을 아래에서 살펴보세요.',basis:reasons.join(' / ')};
    let caution=null;
    if(season?.blocked) caution={title:season.기신 ? season.기신+' 기운의 걸림도 함께 있습니다.' : '계절에 필요한 기운만으로 끝나지 않습니다.',text:'필요한 글자를 갖췄어도 같은 책이 경계한 조건이 함께 잡혔습니다. 좋은 조건과 이 걸림을 함께 읽어야 합니다.',basis:season.reason||'조후의 별도 걸림 조건',source:'궁통보감',classical:true};
    if(state?.값==='깨졌다') caution={title:'타고난 강점이 그대로 힘을 쓰지는 못합니다.',text:explanation ? explanation[2] : '격을 이루는 조건이 깨진 것으로 판정됐습니다.',basis:reasons.join(' / '),source:'자평진전'};
    return {...m,identity,distinct:{signature:signature ? {name:portrait?.[2]||signature.lead.name,line:portrait?.[1]||signature.lead.title,book:signature.lead.book,key:signature.lead.key} : null,condition,caution},filterStory:{...m.filterStory,filters,readingGroups:groups}};
  }
  root.ChaeksaJeongtongDistinct={apply};
})(typeof window!=='undefined'?window:globalThis);
