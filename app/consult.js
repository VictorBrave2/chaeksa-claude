/* 책사 심층 상담 v1 — 가설 제시 → 판별 질문 → 판단 수정 → 실행 과제 → 기록
 * 구조는 tongbyeon.js가 정한다. 이 파일은 진행·저장·표시만 담당한다.
 */
(function (global) {
  'use strict';
  const T = () => global.ChaeksaTongbyeon;
  const AI = () => global.ChaeksaAI;
  const $ = (id) => document.getElementById(id);
  const CKEY = 'chaeksa.consults';
  let fr = null, current = null;   // fr: 현재 프레임, current: 저장 레코드

  const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]));
  const MD_B = /\*\*(.+?)\*\*/g, MD_H = /^#{1,3}\s*(.+)$/gm, MD_NL = /\n/g;
  const mdLite = (t) => esc(t).replace(MD_B, '<b>$1</b>').replace(MD_H, '<b>$1</b>').replace(MD_NL, '<br>');
  // 30일이 지나면 다시 확인할 때가 된 것으로 본다
  function isDue(c) {
    const last = (c.checkins && c.checkins.length) ? c.checkins[c.checkins.length - 1].date : c.createdAt;
    return (Date.now() - new Date(last + 'T00:00:00').getTime()) > 30 * 24 * 60 * 60 * 1000;
  }
  // 기록된 숫자에서 방향만 읽는다 (숫자로 못 읽으면 방향 없음)
  function trend(logs) {
    if (!logs || logs.length < 2) return null;
    const num = (v) => {
      const m = String(v).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
      if (!m) return null;
      let n = parseFloat(m[0]);
      if (/억/.test(v)) n *= 10000; else if (/만/.test(v)) n *= 1;
      return n;
    };
    const a = num(logs[0].value), b = num(logs[logs.length - 1].value);
    if (a === null || b === null) return null;
    if (b > a) return { dir: 'up', label: '↑ 오르는 중' };
    if (b < a) return { dir: 'down', label: '↓ 내려가는 중' };
    return { dir: 'flat', label: '→ 그대로' };
  }

  const pid = () => { var p = global.ChaeksaApp && global.ChaeksaApp.profile(); return p && p.id ? p.id : null; };
  const loadAll = () => { try { return JSON.parse(localStorage.getItem(CKEY)) || []; } catch (e) { return []; } };
  const load = () => { const me = pid(); const all = loadAll(); return me ? all.filter(c => !c.personId || c.personId === me) : all; };
  const save = (list) => { const me = pid(); const others = loadAll().filter(c => me && c.personId && c.personId !== me); localStorage.setItem(CKEY, JSON.stringify(others.concat(list).slice(0, 60))); };

  const EXAMPLES = [
    '2027년부터 시작되는 대운에서 제 직업과 사업은 어떻게 변할까요?',
    '지금 하는 일을 계속해야 할지, 사업을 키워야 할지 고민입니다.',
    '내년에 이직해도 괜찮을까요?',
    '올해 돈의 흐름은 어떤가요?',
    '지금 만나는 사람과의 관계를 어떻게 보면 좋을까요?',
  ];

  // ───────── 진입 화면 ─────────
  function renderHome() {
    const list = load();
    $('consultHome').innerHTML = `
      <p class="hint" style="margin:0 0 10px">사주 흐름 하나를 놓고 <b>가설을 세우고, 되묻고, 답에 따라 판단을 수정</b>합니다.
      한 번 보고 끝나는 풀이가 아니라 계속 이어지는 상담입니다.</p>
      <label>무엇이 궁금하신가요?</label>
      <textarea id="cq" rows="3" placeholder="예) 2027년부터 시작되는 대운에서 제 직업과 사업은 어떻게 변할까요?"></textarea>
      <div class="suggest" id="cEx">${EXAMPLES.map(e => `<button>${esc(e)}</button>`).join('')}</div>
      <button class="btn" id="btnConsult">상담 시작</button>`;
    $('cEx').querySelectorAll('button').forEach(b => b.onclick = () => { $('cq').value = b.textContent; });
    $('btnConsult').onclick = () => {
      const q = $('cq').value.trim();
      if (!q) { alert('궁금한 것을 한 줄이라도 적어주세요.'); return; }
      begin(q);
    };
    // 지난 상담
    if (!list.length) { $('consultPast').classList.add('hide'); return; }
    $('consultPast').classList.remove('hide');
    $('pastList').innerHTML = list.map((c, i) => {
      const due = isDue(c);
      const logs = c.logs || [];
      const tr = trend(logs);
      return `
      <div class="past ${due ? 'due' : ''}">
        <div class="past-h"><b>${esc(c.topTitle)}</b><span>${c.createdAt}</span></div>
        <p>${esc(c.question)}</p>
        <div class="past-m">${c.domainLabel} · ${esc(c.targetLabel)} · ${c.checkins.length ? `확인 ${c.checkins.length}회` : '확인 전'}${due ? ' · <b style="color:var(--accent)">확인할 때가 되었습니다</b>' : ''}</div>
        ${c.metric ? `<div class="metric-box">
          <div class="metric-h"><b>${esc(c.metric)}</b>${tr ? `<span class="tr ${tr.dir}">${tr.label}</span>` : ''}</div>
          ${logs.length ? `<div class="metric-logs">${logs.slice(-6).map(l => `<span><i>${l.date.slice(5)}</i>${esc(l.value)}</span>`).join('')}</div>` : '<p class="hint" style="margin:4px 0 0">아직 기록이 없습니다. 숫자를 적어두면 다음 판단이 정확해집니다.</p>'}
          <div class="metric-add"><input placeholder="예: -40만원 / 30% / 12건" data-i="${i}" class="mval"><button class="btn-ghost" data-i="${i}" data-a="log">기록</button></div>
        </div>` : ''}
        <div class="past-b"><button class="btn-ghost" data-i="${i}" data-a="open">다시 확인하기</button><button class="btn-ghost" data-i="${i}" data-a="del">지우기</button></div>
      </div>`;
    }).join('');
    $('pastList').querySelectorAll('button').forEach(b => b.onclick = () => {
      const list2 = load(), i = +b.dataset.i;
      if (b.dataset.a === 'del') {
        if (!confirm('이 상담 기록을 지웁니다. 계속할까요?')) return;
        list2.splice(i, 1); save(list2); renderHome(); global.ChaeksaApp.refreshConsultBadge(); return;
      }
      if (b.dataset.a === 'log') {
        const inp = $('pastList').querySelector(`.mval[data-i="${i}"]`);
        const v = inp.value.trim();
        if (!v) { inp.focus(); return; }
        list2[i].logs = list2[i].logs || [];
        const iso = new Date().toISOString();
        list2[i].logs.push({ date: iso.slice(0, 10), value: v });
        list2[i]._at = iso;
        save(list2); renderHome();
        if (global.ChaeksaCloud) global.ChaeksaCloud.pushSoon();
        return;
      }
      begin(list2[i].question, list2[i]);
    });
  }

  // ───────── 상담 시작 ─────────
  function begin(question, record) {
    const R = global.ChaeksaApp.result();
    fr = T().frame(R, question, new Date());
    current = record || null;
    if (record) fr.answers = {};   // 재확인은 새로 묻는다 (이전 답은 기록에 남아 있음)
    $('consultHome').classList.add('hide');
    $('consultPast').classList.add('hide');
    $('consultView').classList.remove('hide');
    render();
    $('consultView').scrollIntoView({ behavior:'smooth', block:'start' });
  }

  // 지난 확인과 달라진 답변 목록
  function answerDiff() {
    if (!current) return [];
    const prev = (current.checkins && current.checkins.length)
      ? current.checkins[current.checkins.length - 1].answers
      : (current.first && current.first.answers) || {};
    const label = { y:'예', n:'아니오', '?':'모르겠음' };
    const out = [];
    for (const q of fr.questions) {
      const a = fr.answers[q.id], b = prev[q.id];
      if (a && b && a !== b) out.push(`${q.q.replace(/\?$/, '')} (${label[b]} → ${label[a]})`);
    }
    return out;
  }

  function bar(p) { return `<i><b style="width:${Math.round(p * 100)}%"></b></i><span>${Math.round(p * 100)}%</span>`; }

  // ───────── 상담 화면 ─────────
  function render() {
    const rev = T().revise(fr);
    const top = rev.ranked[0], second = rev.ranked[1];
    const done = rev.responded === rev.total;   // 모르겠어요 포함
    const prevTop = current ? current.topId : null;
    const prevTitle = current ? current.topTitle : null;

    let html = `<div class="c-head">
        <button class="btn-ghost" id="cBack">← 상담 목록</button>
        <span class="c-tag">${fr.domain.label} · ${esc(fr.target.label)}</span>
      </div>
      <p class="c-q">${esc(fr.question)}</p>`;

    // 재확인 상담이면 지난 판단을 먼저 불러온다
    if (current) {
      html += `<div class="c-recall">
        <b>지난 상담 (${current.createdAt})</b>
        <p>그때는 <b>${esc(prevTitle)}</b>를 1순위로 보았습니다. 그 사이 조건이 달라졌는지 다시 확인하겠습니다.</p>
      </div>`;
    }

    html += `<p class="c-lead">${esc(fr.lead)}</p>`;

    // 구조
    html += `<div class="c-sec"><button class="c-toggle" id="cStruct">지금 보이는 구조 ▸</button>
      <div class="c-struct hide" id="cStructBody">
        ${fr.layers.map(l => `<div class="c-layer"><b>${l.level}</b><span class="gz">${l.ganji}</span><p>${esc(l.note)}</p></div>`).join('')}
        <p class="hint">들어오는 기운: <b>${fr.godStem}</b>(천간) / <b>${fr.godBranch}</b>(지지) — ${T().GROUP_MEAN[fr.group]}. 일간은 <b>${fr.strength}</b>.</p>
      </div></div>`;

    if (fr.modifiers.length) {
      html += `<div class="c-mods">${fr.modifiers.map(m => `<p>${esc(m.text)}</p>`).join('')}</div>`;
    }

    // 가설
    html += `<div class="c-sec"><h4>${done ? '확인 후 판단' : '지금 세운 가설'}<small>${esc(fr.theme)}</small></h4>`;
    rev.ranked.forEach((h, i) => {
      html += `<div class="hyp ${i === 0 ? 'top' : ''}">
        <div class="hyp-h"><span class="rank">${i + 1}순위</span><b>${esc(h.title)}</b></div>
        <div class="hyp-bar">${bar(h.p)}</div>
        <p class="hyp-basis">${esc(h.basis)}</p>
        <div class="hyp-signs"><b>이 경우 현실에서 이렇게 보입니다</b><ul>${h.signs.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      </div>`;
    });
    html += `</div>`;

    // 판별 질문
    html += `<div class="c-sec"><h4>제가 확인하고 싶은 것<small>답에 따라 순위가 바뀝니다</small></h4>
      <p class="hint" style="margin:0 0 12px">모르면 '모르겠어요'를 눌러주세요. 억지로 답하면 판단이 흐려집니다.</p>`;
    fr.questions.forEach((q, i) => {
      const a = fr.answers[q.id];
      html += `<div class="cq-row ${a ? 'answered' : ''}">
        <p><span class="cq-n">${i + 1}</span>${esc(q.q)}</p>
        <div class="cq-btns">
          <button data-q="${q.id}" data-v="y" class="${a === 'y' ? 'on' : ''}">예</button>
          <button data-q="${q.id}" data-v="n" class="${a === 'n' ? 'on' : ''}">아니오</button>
          <button data-q="${q.id}" data-v="?" class="${a === '?' ? 'on' : ''}">모르겠어요</button>
        </div></div>`;
    });
    html += `</div>`;

    // 판단 변화 — 재확인이면 '지난 상담의 판단'과, 첫 상담이면 '처음 세운 가설'과 비교한다
    if (rev.answered > 0) {
      const baseId = current ? current.topId : rev.priorTopId;
      const baseTitle = current ? current.topTitle : (fr.hypotheses.find(h => h.id === rev.priorTopId) || {}).title;
      const changed = top.id !== baseId;
      const diff = current ? answerDiff() : [];
      const diffHtml = diff.length
        ? `<p class="c-diff">지난번과 달라진 답: ${diff.map(d => `<b>${esc(d)}</b>`).join(', ')}</p>` : '';
      if (changed) {
        html += `<div class="c-flip"><b>판단을 수정합니다.</b>
          <p>${current ? `지난 상담(${current.createdAt})에서는` : '처음에는'} <b>${esc(baseTitle)}</b>를 1순위로 보았습니다.
          그런데 이번 답변에서 조건이 다르게 확인되어 <b>${esc(top.title)}</b>를 1순위로 올립니다.</p>${diffHtml}</div>`;
      } else if (done) {
        html += `<div class="c-hold"><b>${current ? '지난 판단을 유지합니다.' : '판단을 유지합니다.'}</b>
          <p>${current ? '그때와 조건이 크게 달라지지 않았습니다.' : '답변이 처음 세운 가설과 같은 방향입니다.'}
          확신의 정도는 ${Math.round(top.p * 100)}%로 조정했습니다.</p>${diffHtml}</div>`;
      }
    }

    // 실행
    if (done) {
      html += `<div class="c-sec"><h4>그래서 지금 할 일<small>확인되지 않은 것은 결론 내지 않습니다</small></h4>
        <div class="c-act"><b>실행 과제</b><p>${esc(top.action)}</p></div>
        <div class="c-metric"><b>다음에 함께 볼 지표</b><p>${esc(top.metric)}</p>
        <span class="hint">이 지표가 움직이면 판단을 다시 조정합니다.</span></div>
        <p class="hint">2순위(${esc(second.title)})는 버리지 않고 남겨둡니다. ${Math.round(second.p * 100)}% 가능성으로 계속 지켜보겠습니다.</p></div>`;

      // 선택지 비교
      const dec = T().decide(fr, rev, new Date());
      html += `<div class="c-sec"><h4>선택지를 놓고 비교하면<small>${esc(dec.lead)}</small></h4>
        <p class="hint" style="margin:0 0 12px">확인되지 않은 항목 ${dec.unknown}개, 변동 요인 ${dec.volatility}개${dec.turning ? ' · ' + esc(dec.turning) : ''} — 이 세 가지로 순위를 매겼습니다.</p>
        ${dec.options.map((o, i) => `
          <div class="opt ${i === 0 ? 'top' : ''}">
            <div class="opt-h"><span class="opt-k">${'ABC'[i]}</span><b>${esc(o.label)}</b><span class="opt-s">${o.score}</span></div>
            <p class="opt-when"><b>이럴 때 적합</b> ${esc(o.when)}</p>
            <p class="opt-risk"><b>위험</b> ${esc(o.risk)}</p>
            <p class="opt-todo"><b>택한다면</b> ${esc(o.todo)}${o.note ? ` <span style="color:var(--ink3)">${esc(o.note)}</span>` : ``}</p>
          </div>`).join('')}
        <p class="hint">점수는 확신도·미확인 항목·변동 요인·흐름 전환만으로 계산한 것입니다. 결정은 선생님이 하십니다.</p>
        <button class="btn" id="cSave">${current ? '이번 확인 기록하기' : '이 상담 저장하기'}</button></div>`;
      html += `<div class="c-sec" id="cNarr"></div>`;
    }

    $('consultView').innerHTML = html;

    // 이벤트
    $('cBack').onclick = () => { fr = null; current = null; $('consultView').classList.add('hide'); $('consultHome').classList.remove('hide'); renderHome(); window.scrollTo({ top:0 }); };
    $('cStruct').onclick = () => { const b = $('cStructBody'); const open = b.classList.toggle('hide'); $('cStruct').textContent = open ? '지금 보이는 구조 ▸' : '지금 보이는 구조 ▾'; };
    $('consultView').querySelectorAll('.cq-btns button').forEach(b => b.onclick = () => {
      fr.answers[b.dataset.q] = b.dataset.v; render();
    });
    if (done) {
      $('cSave').onclick = () => doSave(rev);
      narrate(rev);
    }
  }

  // ───────── 저장 ─────────
  function doSave(rev) {
    const list = load();
    const top = rev.ranked[0];
    const nowIso = new Date().toISOString();
    const entry = {
      date: nowIso.slice(0, 10),
      answers: { ...fr.answers },
      topId: top.id, topTitle: top.title, topP: Math.round(top.p * 100),
    };
    if (current) {
      const i = list.findIndex(c => c.id === current.id);
      if (i >= 0) {
        list[i].checkins.push(entry);
        list[i].topId = top.id; list[i].topTitle = top.title; list[i].topP = entry.topP;
        list[i]._at = nowIso;
        save(list);
      }
    } else {
      list.unshift({
        id: 'c' + Date.now(), question: fr.question, createdAt: entry.date,
        domainKey: fr.domain.key, domainLabel: fr.domain.label, targetLabel: fr.target.label,
        topId: top.id, topTitle: top.title, topP: entry.topP,
        action: top.action, metric: top.metric,
        checkins: [], logs: [], first: entry, _at: nowIso, personId: pid(),
      });
      save(list);
    }
    $('cSave').textContent = '저장했습니다';
    $('cSave').disabled = true;
    global.ChaeksaApp.refreshConsultBadge();
    if (global.ChaeksaCloud) global.ChaeksaCloud.pushSoon();
  }

  // ───────── LLM 서술 (구조를 벗어나지 않게) ─────────
  async function narrate(rev) {
    const box = $('cNarr');
    if (!AI() || !AI().ready()) { box.innerHTML = `<p class="hint">AI 비서를 연결하면 이 판단을 상담하듯 풀어서 이야기해 드립니다.</p>`; return; }
    box.innerHTML = `<h4>비서의 이야기</h4><div class="brief loading">비서가 정리하는 중…</div>`;
    try {
      const text = await AI().deepNarrate(global.ChaeksaApp.result(), new Date(), fr, rev, current, T().decide(fr, rev, new Date()));
      box.innerHTML = `<h4>비서의 이야기</h4><div class="brief">${mdLite(text)}</div>`;
    } catch (e) {
      box.innerHTML = `<p class="hint">서술을 가져오지 못했어요: ${esc(e.message)}</p>`;
    }
  }

  global.ChaeksaConsult = { renderHome, openCount: () => load().filter(isDue).length, total: () => load().length, list: load };
})(window);
