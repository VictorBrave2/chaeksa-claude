/* 3초 결과 · 공유 카드 (09-26, docs/87). 숫자 · 순위 · 단계 없이 사장님 판정만:
 * 사이 = 두 방향 「채워짐」(내 언행 글자가 상대가 바라는 글자와 같거나 같은 기운 — 73조 문턱) → 으뜸 / 당신 / 그사람 / 맞춤.
 * 규칙(사장님 09-26): 내 언행이 상대가 바라는 것을 채우면 상대가 나를 더 매력적으로 느낀다 → 채워지는 쪽이 더 끌린다.
 * 문장은 ChaeksaSsomCardMal(작가). 그림은 canvas(1080×1350) → 저장 · 카톡 공유. 생년월일은 카드 · 주소에 안 싣는다. 받은 사람 링크 ?go=ssom&from=card-ssom */
(function (global) {
  const E = global.ChaeksaEngine, S = global.ChaeksaSsom, SC = global.ChaeksaSsomScore;
  const 언행말 = { 식신드러남: '챙기는 게 바로 보이는 사람', 식신숨음: '말없이 챙겨 놓는 사람', 상관드러남: '할 말이 먼저 나오는 사람', 상관숨음: '할 말을 속에 두는 사람', 없음: '겉으로는 티가 잘 안 나는 사람' };
  const 언행키 = (R) => { const 언 = (S.언행(R) || [])[0]; return 언 ? 언.십신 + (언.드러남 ? '드러남' : '숨음') : '없음'; };
  const 받침 = (t) => { const c = String(t).charCodeAt(String(t).length - 1) - 0xAC00; return c >= 0 && c < 11172 && (c % 28) !== 0; };
  const 채우기 = (틀, v) => String(틀 || '').replace(/\{([^}|]+)(?:\|([^}]+))?\}/g, (m, k, j) => { const x = v[k] == null ? '' : String(v[k]); if (!j) return x; const p = { 은: ['은', '는'], 이에요: ['이에요', '예요'], 을: ['을', '를'], 이: ['이', '가'] }[j]; return p ? x + (받침(x) ? p[0] : p[1]) : x; });

  function 재기(나R, 그R) {
    const u = SC.으뜸(나R, 그R);
    const 관 = (받R, 주R) => { const h = (E.HIDDEN[받R.pillars.day.branch] || [])[0], 본 = typeof h === 'number' ? h : h[0]; const 언 = (S.언행(주R) || [])[0]; const 주 = 언 ? E.STEMS.indexOf(언.글자) : 주R.pillars.day.stem; return SC.관계(본, 주); };
    // 채워짐 = 상대의 언행(식상 글자)이 내가 바라는 글자와 같거나 같은 기운. 식상이 없는 사람은 언행 글자가 없으니 못 채운다(73조와 같은 값이 되게)
    const 당신채움 = 언행키(그R) !== '없음' && /같은글자|같은기운/.test(관(나R, 그R)), 그채움 = 언행키(나R) !== '없음' && /같은글자|같은기운/.test(관(그R, 나R));
    const 사이 = 당신채움 && 그채움 ? '으뜸' : 당신채움 ? '당신' : 그채움 ? '그사람' : '맞춤';
    return { 사이, 당신채움, 그채움, 으뜸: !!u.기운,
      당신바람: (S.바라는사람 || {})[S.일지십신(나R)] || '', 그바람: (S.바라는사람 || {})[S.일지십신(그R)] || '',
      당신언행: 언행말[언행키(나R)], 그언행: 언행말[언행키(그R)] };
  }
  function 문장(r) {
    const M = global.ChaeksaSsomCardMal || {}; if (!M.사이) return null;
    return { 사이: M.사이[r.사이] || '',
      당신줄: 채우기(M.방향, { 받분: '당신', 주분: '그 사람', 바람: r.당신바람, 언행: r.그언행 }),
      그줄: 채우기(M.방향, { 받분: '그 사람', 주분: '당신', 바람: r.그바람, 언행: r.당신언행 }),
      단추: M.단추 || {}, 꼬리: M.꼬리 || '책사 · chaeksa.kr' };
  }
  // 화면 카드(html)
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function 카드(나R, 그R) {
    const r = 재기(나R, 그R), m = 문장(r); if (!m) return '';
    const 컷 = r.사이 === '으뜸' ? 'ss-then-now' : 'ss-give';
    return '<div class="card ss-card" id="ssCard"><img class="ss-card-cut" src="art/' + 컷 + '-s.webp" alt="">'
      + '<p class="ss-card-lead">' + esc(m.사이) + '</p><p class="ss-card-line">' + esc(m.당신줄) + '</p><p class="ss-card-line">' + esc(m.그줄) + '</p>'
      + '<div class="ss-card-btns"><button type="button" class="btn ghost small" id="ssCardShare">카톡으로 보내기</button><button type="button" class="btn ghost small" id="ssCardSave">이미지로 저장</button></div></div>';
  }
  // 그림 카드(canvas 1080×1350) — 컷 + 네 줄 + 꼬리
  const W = 1080, H = 1350, SERIF = '"Gowun Batang","Noto Serif KR",serif', SANS = '"Noto Sans KR",sans-serif';
  function wrap(ctx, text, x, y, maxW, lh) { const words = String(text).split(' '); let line = '', yy = y; for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t; } if (line) ctx.fillText(line, x, yy); return yy + lh; }
  async function 그리기(canvas, 나R, 그R) {
    const r = 재기(나R, 그R), m = 문장(r); if (!m) return null;
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#161433'; ctx.fillRect(0, 0, W, H);
    const 컷 = r.사이 === '으뜸' ? 'ss-then-now' : 'ss-give';
    await new Promise(res => { const im = new Image(); im.onload = () => { const ch = 700, s = Math.max(W / im.width, ch / im.height), w = im.width * s, h = im.height * s; ctx.drawImage(im, (W - w) / 2, -(h - ch) * 0.15, w, h); const g = ctx.createLinearGradient(0, ch - 260, 0, ch); g.addColorStop(0, 'rgba(22,20,51,0)'); g.addColorStop(1, '#161433'); ctx.fillStyle = g; ctx.fillRect(0, ch - 260, W, 260); res(); }; im.onerror = res; im.src = 'art/' + 컷 + '.webp'; });
    ctx.textAlign = 'center'; ctx.fillStyle = '#f7f3ff'; ctx.font = '700 58px ' + SERIF;
    let y = wrap(ctx, m.사이, W / 2, 760, 900, 76);
    ctx.font = '400 36px ' + SANS; ctx.fillStyle = '#d8d3ea';
    y = wrap(ctx, m.당신줄, W / 2, y + 40, 900, 54); y = wrap(ctx, m.그줄, W / 2, y + 16, 900, 54);
    ctx.font = '700 40px ' + SERIF; ctx.fillStyle = '#e6c98a'; ctx.fillText(m.단추.받은사람 || '내 것도 보기', W / 2, H - 150);
    ctx.font = '400 28px ' + SANS; ctx.fillStyle = '#9a95b8'; ctx.fillText(m.꼬리, W / 2, H - 70);
    return r;
  }
  function 붙이기(box, 나R, 그R, 이름) {
    const el = box.querySelector('#ssCard'); if (!el) return;
    const c = document.createElement('canvas');
    const go = async (mode) => { try { await 그리기(c, 나R, 그R); const SH = global.ChaeksaShare; if (!SH) return; if (mode === 'share') await SH.share(c, 이름 || '우리', '웹툰궁합', '우리 둘 사이 · chaeksa.kr/?go=ssom&from=card-ssom'); else await SH.save(c, 이름 || '우리', '웹툰궁합'); } catch (e) {} };
    const b1 = el.querySelector('#ssCardShare'), b2 = el.querySelector('#ssCardSave');
    if (b1) b1.onclick = () => go('share'); if (b2) b2.onclick = () => go('save');
    if (b1 && global.ChaeksaShare && !global.ChaeksaShare.canShareFile()) b1.textContent = '카톡으로 보내기(저장해서 보내요)';
  }
  global.ChaeksaSsomCard = { 재기, 문장, 카드, 그리기, 붙이기 };
})(window);
