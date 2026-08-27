/* 책사 인물 관리 v1 — 나 + 주변 사람들의 사주를 함께 둔다.
 *
 * 왜: 사람들은 자기 사주만큼 가까운 사람의 사주를 궁금해한다.
 *     부모·자녀·연인·상사를 등록해두면 오늘 브리핑도, 궁합도, 상담도 그 사람 기준으로 볼 수 있다.
 *
 * 저장 형태 (localStorage 'chaeksa.people')
 *   [{ id, name, relation, isSelf, birth:{year,month,day,hour,minute,gender,...}, createdAt }]
 *
 * 기존 데이터(단일 프로필 chaeksa.profile, 궁합 상대 chaeksa.partners)는 처음 한 번 자동으로 옮긴다.
 */
(function (global) {
  'use strict';
  const KEY = 'chaeksa.people', ACT = 'chaeksa.activePerson';
  const OLD_PROFILE = 'chaeksa.profile', OLD_PARTNERS = 'chaeksa.partners';

  const RELATIONS = ['나', '가족', '부모', '자녀', '배우자', '연인', '친구', '동료', '상사', '기타'];

  const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const jset = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const newId = () => 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  /** 생년월일 등 계산에 쓰이는 값만 추린다 */
  function birthOf(o) {
    const b = {};
    // 새 필드를 여기 안 넣으면 조용히 버려진다. genderUnknown이 그렇게 한 번 사라졌다.
    ['year','month','day','hour','minute','gender','genderUnknown','solarCorrection','calendar','lunarInput','place','placeName','longitude','tzOffset']
      .forEach(k => { if (o[k] !== undefined) b[k] = o[k]; });
    return b;
  }

  function list() { return jget(KEY, []); }
  function save(arr) { jset(KEY, arr); }

  function activeId() {
    const l = list();
    if (!l.length) return null;
    const id = localStorage.getItem(ACT);
    return l.some(p => p.id === id) ? id : l[0].id;
  }
  function active() {
    const id = activeId();
    return id ? list().find(p => p.id === id) : null;
  }
  function setActive(id) { localStorage.setItem(ACT, id); }
  function get(id) { return list().find(p => p.id === id) || null; }
  function self() { return list().find(p => p.isSelf) || list()[0] || null; }
  function others() { const a = activeId(); return list().filter(p => p.id !== a); }

  function add(person) {
    const arr = list();
    const p = {
      id: newId(),
      name: (person.name || '').trim() || '이름 없음',
      relation: person.relation || (arr.length ? '친구' : '나'),
      isSelf: !arr.length ? true : !!person.isSelf,
      birth: birthOf(person.birth || person),
      createdAt: new Date().toISOString().slice(0, 10),
      _at: new Date().toISOString(),
    };
    if (p.isSelf) arr.forEach(x => { x.isSelf = false; });
    arr.push(p);
    save(arr);
    if (arr.length === 1) setActive(p.id);
    return p.id;
  }

  function update(id, patch) {
    const arr = list();
    const i = arr.findIndex(p => p.id === id);
    if (i < 0) return false;
    if (patch.name != null) arr[i].name = String(patch.name).trim() || arr[i].name;
    if (patch.relation != null) arr[i].relation = patch.relation;
    if (patch.birth) arr[i].birth = birthOf(patch.birth);
    if (patch.isSelf) { arr.forEach(x => { x.isSelf = false; }); arr[i].isSelf = true; }
    arr[i]._at = new Date().toISOString();
    save(arr);
    return true;
  }

  function remove(id) {
    const arr = list().filter(p => p.id !== id);
    save(arr);
    // 그 사람에게 딸린 기록도 함께 지운다
    Object.keys(localStorage)
      .filter(k => k.indexOf('.' + id) >= 0 || k === 'chaeksa.chat.' + id)
      .forEach(k => localStorage.removeItem(k));
    if (activeId() === id && arr.length) setActive(arr[0].id);
    return arr.length;
  }

  /** 엔진에 넘길 형태 — 기존 코드가 쓰던 모양(생년월일 + name)을 그대로 유지한다 */
  function toProfile(p) {
    if (!p) return null;
    return Object.assign({}, p.birth, { name: p.name, id: p.id, relation: p.relation, isSelf: p.isSelf });
  }

  /** 예전 단일 프로필 구조에서 옮겨오기 (한 번만) */
  function migrate() {
    if (list().length) return false;
    let moved = false;
    const old = jget(OLD_PROFILE, null);
    if (old && old.year) {
      add({ name: old.name || '나', relation: '나', isSelf: true, birth: old });
      moved = true;
    }
    const partners = jget(OLD_PARTNERS, []);
    partners.forEach(pt => {
      if (!pt || !pt.year) return;
      add({ name: pt.name || '이름 없음', relation: '친구', isSelf: false, birth: pt });
      moved = true;
    });
    if (moved) localStorage.removeItem(OLD_PARTNERS);
    return moved;
  }

  global.ChaeksaPeople = {
    RELATIONS, list, add, update, remove, get, self, others,
    active, activeId, setActive, toProfile, migrate, birthOf,
  };
})(window);
