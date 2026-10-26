/* Former independent honor view, now an optional evidence section in Jeongtong.
 * Existing /api/gwi predicates only. No new judgments, scores or combined percentages. */
(function (global) {
  'use strict';
  const API = 'https://chaeksa-behavior-core.vercel.app/api/gwi';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const clean = s => String(s || '').replace(/\s*·\s*docs\/\S+/g, '').replace(/법전\s*\d+조\s*/g, '');
  const status = x => x === true ? '해당' : x === false ? '해당하지 않음' : x === '일부' ? '태어난 시에 따라 달라짐' : '판정하지 못함';
  function item(x) {
    const original = global.GWI_COPY?.옛?.항목?.[x.id] || {};
    const copy = global.ChaeksaJeongtongModelReading?.readEvidence(original, x.id) || original;
    return '<article class="jtp-evidence-item"><div class="jtp-evidence-head"><h4>' + esc(copy.이름 || x.이름) + '</h4><span>' + esc(status(x.걸림)) + '</span></div>'
      + (copy.뜻 ? '<p>' + esc(copy.뜻) + '</p>' : '')
      + '<details><summary>내 사주 조건과 고전 원문</summary><p><b>내 사주에서 확인한 조건</b><br>' + esc(clean(x.근거)) + '</p><blockquote lang="zh">' + esc(x.원문) + '</blockquote><p>' + esc(clean(x.출처)) + '</p></details></article>';
  }
  function html(data) {
    const positive = data.옛?.귀?.항목 || [], caution = data.옛?.천?.항목 || [], unmeasurable = data.옛?.덧 || [];
    const hit = positive.filter(x => x.걸림 === true), other = positive.filter(x => x.걸림 !== true);
    const presentCaution = caution.filter(x => x.걸림 === true);
    let h = '<p class="jtp-evidence-note">《적천수》가 벼슬에 오른다고 본 조건을 내 사주와 대조했습니다. 이 조건은 위에서 계산한 누적 비율에 더하지 않습니다. 여기서 돈·책임·배움은 실제 재산이나 학력의 양이 아닌, 사주 글자가 맡은 역할을 말합니다.</p>'
      + (hit.length ? hit.map(item).join('') : '<p>이 대목의 조건 중 완전히 해당하는 것은 없습니다. 정통사주의 다른 좋은 조건과 함께 읽어 주세요.</p>');
    if (presentCaution.length) h += '<section class="jtp-evidence-caution"><h3>같은 책이 벼슬에서 멀다고 본 조건</h3>' + presentCaution.map(item).join('') + '</section>';
    h += '<details><summary>그 밖의 조건도 대조해 보기</summary>' + other.concat(caution.filter(x => x.걸림 !== true), unmeasurable).map(item).join('') + '</details>';
    const now = data.지금 || {}, structure = now.그릇넷, connected = now.관통;
    if (structure || connected) {
      h += '<details><summary>사주 글자가 서로 이어지는지 더 살펴보기</summary><p class="jtp-evidence-note">같은 사주에서 재물·책임·표현·배움의 글자가 힘을 쓰고 서로 이어지는지 계산한 결과입니다. 고전이 붙인 이름과 구분해서 봅니다.</p>';
      if (structure) h += '<article class="jtp-evidence-item"><h4>재물·책임·표현·배움이 함께 작용하는지</h4><p>' + esc(status(structure.걸림)) + '</p><p class="jtp-evidence-raw">' + esc(clean(structure.근거)) + '</p></article>';
      if (connected) {
        h += '<article class="jtp-evidence-item"><h4>책임의 글자가 나에게 이어지는지</h4><p>' + esc(status(connected.걸림)) + '</p><p class="jtp-evidence-raw">' + esc(clean(connected.근거)) + '</p>';
        const years = connected.받는해 || [];
        if (years.length) h += '<details><summary>앞으로 이 연결이 생기는 해</summary><p>' + years.map(x => esc(x.해 + '년 · ' + x.간지)).join('<br>') + '</p></details>';
        h += '</article>';
      }
      h += '</details>';
    }
    return h;
  }
  function attach(root, input) {
    if (!root || root.querySelector('.jtp-more-evidence')) return;
    const section = document.createElement('section'); section.className = 'jtp-more-evidence';
    section.innerHTML = '<h2>근거를 더 살펴보고 싶다면</h2><details class="jtp-honor-evidence"><summary>귀함을 말한 고전의 다른 조건</summary><div class="jtp-honor-body"></div></details>'
      + '<a class="jtp-brain-link" href="brain.html">배우고 생각하는 힘을 집중해서 보기 <span aria-hidden="true">→</span></a>';
    root.insertBefore(section, root.querySelector('.jtp-legacy'));
    const fold = section.querySelector('.jtp-honor-evidence'), body = section.querySelector('.jtp-honor-body');
    let loaded = false, loading = false;
    async function read() {
      if (loaded || loading) return;
      loading = true; body.innerHTML = '<p role="status">고전의 조건을 대조하고 있습니다.</p>';
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 30000);
      const birth = {year:input.year,month:input.month,day:input.day,hour:input.hour == null ? null : input.hour,minute:input.minute || 0,gender:input.gender === 'F' ? 'F':'M',place:input.place,longitude:input.longitude};
      try {
        const response = await fetch(API, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(birth),signal:controller.signal});
        const data = await response.json(); if (!response.ok || !Array.isArray(data.옛?.귀?.항목)) throw Error('unavailable');
        if (!section.isConnected) return;
        body.innerHTML = html(data); loaded = true;
      } catch (_) {
        if (!section.isConnected) return;
        body.innerHTML = '<p role="status">추가 근거를 불러오지 못했습니다.</p><button type="button" class="jtp-evidence-retry">다시 불러오기</button>';
        body.querySelector('button').onclick = read;
      } finally { clearTimeout(timer); loading = false; }
    }
    fold.addEventListener('toggle', () => { if (fold.open) read(); });
  }
  global.ChaeksaJeongtongEvidence = { attach };
})(window);
