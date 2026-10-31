(() => {
  // 동작만 보는 가상 자료. 서버를 부르지 않으며 실제 프로필을 읽지 않는다.
  const P = window.ChaeksaThreePieces;
  P.세점.이름 = '이번 달, 내 돈은 어떻게 될까?';
  P.세점.물음 = '질문 하나를 마음에 두고 카드를 펼쳐 보세요.';
  P.세점.창말 = '타로 · 이번 달 말일까지';
  P.세점.때.타로달 = '{때}';
  P.세점.다음카드 = '동작을 다시 보려면 위의 ‘다시 해보기’를 눌러 주세요.';
  P.세점.일어남.money.타로.길 = '이 카드는 동작을 보여 주기 위해 고정한 견본입니다.';
  P.세점.할일 = {};
  P.끝말 = '';
  const profile = { year: 2001, month: 1, day: 1, hour: 12, minute: 0, gender: 'M', place: '견본-' + Date.now(), longitude: 127 };
  const person = { id: 'motion-only', name: '견본', isSelf: true };
  const people = { migrate() {}, activeId: () => person.id, list: () => [person], toProfile: () => profile };
  const names = [ ['M00','바보','The Fool'],['M01','마법사','The Magician'],['M02','여사제','The High Priestess'],['C02','컵 2','Two of Cups'],['W01','완드 에이스','Ace of Wands'],['P01','펜타클 에이스','Ace of Pentacles'],['S01','소드 에이스','Ace of Swords'],['C10','컵 10','Ten of Cups'],['M17','별','The Star'],['M19','태양','The Sun'] ];
  const cards = names.map(([id, 이름, 이름en], i) => ({ id, 이름, 이름en, n: i+1, 놓임: i===5 ? '거꾸로' : '바로', 길흉: '길', 원문: '', 줄: '' }));
  const card = cards[9];
  const sample = { 물음: 'money', 카드: card, 다음카드: '2026-11-01', 셈: { 길: 1, 흉: 0 }, 같은달: false, 줄: [], 원문: {},
    점: { 타로: { 길흉: '길', 직접: false, 붙임: [], 때: { 달: '2026-10', 시작: '2026-10-31', 끝: '2026-10-31' } }, 사주: { 정함: '문없음', 길흉: '없음', 열쇠: [] }, 자미: { 정함: '첫달', 길흉: '없음', 길: [], 흉: [] } },
    펼침: { 나: { id: 'P14', 계급: 'King', 이름: '펜타클 킹(왕)', 이름en: 'King of Pentacles' }, 자리: cards, 끝: { 펼침: 1, 길흉: '길' }, 궁정끝: false }
  };
  window.ChaeksaThreeView.mount(document.getElementById('threeOut'), { people, track: null, clock: () => new Date(2026,9,31,12), 물음: 'money', 부름: () => new Promise(resolve => setTimeout(() => resolve({ok:true,j:sample}),450)) });
})();
