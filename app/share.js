/* 책사 공유 카드 v2 — 원국을 이미지로 (canvas)
 * 카드는 항상 「밤의 궁」으로 그린다. 공유 카드는 남의 대화창에 놓이는 물건이라,
 * 흰 바탕은 그 창에 묻히고 남보라+금은 눈에 걸린다. 삽화 48장과도 같은 세계다.
 * (2026-08-30 공주님 원칙 · docs/21 — 잣대 4「캡처해서 보내고 싶은가」)
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine, f = E.fmt;
  const W = 1080, H = 1350;
  const C = {
    bg:'#161433', card:'#1c1a3c', ink:'#eeeaf7', ink2:'#b0a8cf', ink3:'#827aa4',
    acc:'#e6c98a', accSoft:'#2a2550', line:'#302c5c', line2:'#443f76', sealInk:'#1c1a3c',
    wood:'#7cc487', fire:'#ef95a4', earth:'#e6c98a', metal:'#ddd9ef', water:'#8cbcea',
  };
  const SERIF = '"Gowun Batang","Noto Serif KR",serif';
  const HAN = '"Noto Serif KR",serif';
  const SANS = '"Noto Sans KR",sans-serif';
  const elemColor = (name) => ({ 목:C.wood, 화:C.fire, 토:C.earth, 금:C.metal, 수:C.water }[name]);

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function center(ctx, text, cx, y, font, color) {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, cx, y);
  }

  async function draw(canvas, result, name) {
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const a = result.analysis, p = result.pillars;

    // 배경 + 상단 광
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, 380);
    g.addColorStop(0, 'rgba(230,201,138,.16)'); g.addColorStop(1, 'rgba(230,201,138,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 380);

    // 헤더 — 인장
    const sx = 72, sy = 74, ss = 96;
    const sg = ctx.createLinearGradient(sx, sy, sx + ss, sy + ss);
    sg.addColorStop(0, '#f0d79b'); sg.addColorStop(1, '#bb9445');
    ctx.fillStyle = sg; roundRect(ctx, sx, sy, ss, ss, 20); ctx.fill();
    center(ctx, '策', sx + ss / 2, sy + 70, `900 62px ${HAN}`, C.sealInk);
    ctx.textAlign = 'left';
    ctx.font = `900 46px ${HAN}`; ctx.fillStyle = C.ink; ctx.fillText('책사', sx + ss + 28, sy + 46);
    ctx.font = `400 24px ${SANS}`; ctx.fillStyle = C.ink3; ctx.fillText('나의 명리비서', sx + ss + 30, sy + 82);

    // 제목
    center(ctx, `${name}의 사주 원국`, W / 2, 268, `700 54px ${SERIF}`, C.ink);
    const born = `${result.input.year}. ${result.input.month}. ${result.input.day}` + (result.input.hour != null ? ` ${String(result.input.hour).padStart(2,'0')}:${String(result.input.minute||0).padStart(2,'0')}` : ' (시간 모름)');
    center(ctx, born, W / 2, 308, `400 26px ${SANS}`, C.ink3);

    // 네 기둥
    const pw = 216, gap = 20, x0 = (W - (pw * 4 + gap * 3)) / 2, y0 = 356, ph = 416;
    const order = [['hour','시주'],['day','일주'],['month','월주'],['year','연주']];
    order.forEach(([k, label], i) => {
      const x = x0 + i * (pw + gap), pl = p[k], on = k === 'day';
      ctx.fillStyle = on ? C.accSoft : C.card;
      roundRect(ctx, x, y0, pw, ph, 26); ctx.fill();
      ctx.strokeStyle = on ? C.acc : C.line; ctx.lineWidth = on ? 4 : 2; ctx.stroke();
      ctx.fillStyle = on ? C.acc : C.line2;
      roundRect(ctx, x + pw * 0.32, y0, pw * 0.36, 8, 4); ctx.fill();
      center(ctx, label, x + pw / 2, y0 + 52, `400 26px ${SANS}`, C.ink3);
      if (!pl) { center(ctx, '?', x + pw / 2, y0 + 200, `900 96px ${HAN}`, C.ink3); return; }
      const gd = a.gods[k];
      center(ctx, gd.stem ?? '나', x + pw / 2, y0 + 90, `400 26px ${SANS}`, on ? C.acc : C.ink2);
      center(ctx, f.stem(pl.stem), x + pw / 2, y0 + 186, `900 96px ${HAN}`, elemColor(f.stemElem(pl.stem)));
      center(ctx, `${f.stemKo(pl.stem)} · ${f.stemElem(pl.stem)}`, x + pw / 2, y0 + 218, `400 23px ${SANS}`, C.ink3);
      center(ctx, f.branch(pl.branch), x + pw / 2, y0 + 320, `900 96px ${HAN}`, elemColor(f.branchElem(pl.branch)));
      center(ctx, `${f.branchKo(pl.branch)} · ${f.branchElem(pl.branch)}`, x + pw / 2, y0 + 352, `400 23px ${SANS}`, C.ink3);
      center(ctx, gd.branch, x + pw / 2, y0 + 390, `400 24px ${SANS}`, C.ink2);
    });

    // 일간 한 줄
    const dm = global.ChaeksaBrief.dayMaster(a.dayStem);
    let by = 812;
    ctx.fillStyle = C.card; roundRect(ctx, 72, by, W - 144, 150, 24); ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.acc; roundRect(ctx, 72, by + 34, 5, 82, 3); ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = `700 36px ${SERIF}`; ctx.fillStyle = C.ink; ctx.fillText(dm.name, 116, by + 68);
    ctx.font = `400 28px ${SANS}`; ctx.fillStyle = C.ink2; ctx.fillText(dm.one, 116, by + 114);

    // 오행 분포
    by = 1000;
    ctx.font = `400 24px ${SANS}`; ctx.fillStyle = C.ink3; ctx.fillText('오행 분포', 76, by - 14);
    const max = Math.max(...a.elemCount, 1), bw = (W - 144 - 4 * 16) / 5;
    E.ELEM.forEach((e, i) => {
      const x = 72 + i * (bw + 16);
      ctx.fillStyle = C.line; roundRect(ctx, x, by + 46, bw, 12, 6); ctx.fill();
      if (a.elemCount[i] > 0) {
        const fw = Math.max(14, bw * (a.elemCount[i] / max));
        ctx.fillStyle = elemColor(e); roundRect(ctx, x, by + 46, fw, 12, 6); ctx.fill();
      }
      center(ctx, e, x + bw / 2, by + 32, `700 26px ${SANS}`, elemColor(e));
      center(ctx, String(a.elemCount[i]), x + bw / 2, by + 92, `400 24px ${SANS}`, C.ink3);
    });

    // 태그
    by = 1150;
    const tags = [a.strength, `${a.dominant} 기운이 강함`, a.missing.length ? `${a.missing.join('·')} 없음` : '오행 고루 갖춤'];
    ctx.font = `400 26px ${SANS}`;
    let tw = tags.map(t => ctx.measureText(t).width + 44);
    let tx = (W - (tw.reduce((s, v) => s + v, 0) + (tags.length - 1) * 14)) / 2;
    tags.forEach((t, i) => {
      ctx.fillStyle = i === 0 ? C.accSoft : C.card;
      roundRect(ctx, tx, by, tw[i], 58, 29); ctx.fill();
      ctx.strokeStyle = i === 0 ? C.acc : C.line2; ctx.lineWidth = 2; ctx.stroke();
      center(ctx, t, tx + tw[i] / 2, by + 38, `400 26px ${SANS}`, i === 0 ? C.acc : C.ink2);
      tx += tw[i] + 14;
    });

    // 푸터
    ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(72, 1258); ctx.lineTo(W - 72, 1258); ctx.stroke();
    ctx.textAlign = 'left';
    ctx.font = `700 30px ${SANS}`; ctx.fillStyle = C.acc; ctx.fillText('chaeksa.kr', 72, 1306);
    ctx.textAlign = 'right';
    ctx.font = `400 25px ${SANS}`; ctx.fillStyle = C.ink3; ctx.fillText('매일 아침, 나를 아는 비서의 한마디', W - 72, 1306);
    return canvas;
  }

  // ── 두 번째 카드 — 오늘의 한마디 ────────────────────────
  // 원국 카드는 「내가 어떤 사람인가」의 증거고, 이 카드는 「나에게 해 준 말」이다.
  // 남의 대화창에 놓였을 때 걸리는 쪽은 언제나 뒤쪽이다.

  /** 이미지 한 장. 없으면 null 로 돌려주고 카드는 얼굴 없이 그린다. */
  function 그림(src) {
    return new Promise((ok) => {
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = () => ok(null);
      im.src = src;
    });
  }

  /** 글줄을 폭에 맞춰 자른다. 넘치면 마지막 줄에 말줄임. */
  function 접기(ctx, text, maxW, maxLines) {
    const 낱 = String(text).split(' ');
    const 줄 = []; let cur = '';
    for (const w of 낱) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width <= maxW) { cur = t; continue; }
      if (cur) 줄.push(cur);
      cur = w;
      if (줄.length === maxLines) break;
    }
    if (cur && 줄.length < maxLines) 줄.push(cur);
    if (줄.length === maxLines) {
      let last = 줄[maxLines - 1];
      if (ctx.measureText(last).width > maxW || 낱.join(' ').length > 줄.join(' ').length) {
        while (last.length > 2 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
        줄[maxLines - 1] = last + '…';
      }
    }
    return 줄;
  }

  /**
   * 오늘의 한마디 카드.
   * @param {{초상:string, 이름:string, 직함:string, 말:string, 공주:string, 간지:string}} v
   */
  async function drawSay(canvas, v) {
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

    // 얼굴 — 정사각 원본을 폭에 맞춰 덮고 위쪽(눈높이)을 남긴다.
    const IH = 800;
    const im = v.초상 ? await 그림(v.초상) : null;
    if (im && im.width > im.height) {
      // 가로 컷(say-*.webp, 3:2) — 책사가 세로 가운데 띠에 있으니 높이에 맞춰 덮고 가운데를 남긴다
      const sc = IH / im.height, dw = im.width * sc;
      ctx.drawImage(im, -(dw - W) / 2, 0, dw, IH);
    } else if (im && im.width) {
      const sc = W / im.width;
      const dh = im.height * sc;
      // 32% 지점을 화면 중앙에 두는 CSS object-position 과 같은 눈높이
      ctx.drawImage(im, 0, Math.min(0, -(dh * 0.32 - IH / 2)), W, dh);
    } else {
      ctx.fillStyle = C.card; ctx.fillRect(0, 0, W, IH);
    }
    // 아래로 갈수록 밤으로 잠긴다 — 글자가 얼굴을 이기지 않게
    const g = ctx.createLinearGradient(0, IH - 420, 0, IH);
    g.addColorStop(0, 'rgba(22,20,51,0)'); g.addColorStop(1, C.bg);
    ctx.fillStyle = g; ctx.fillRect(0, IH - 420, W, 420);

    // 인장
    const ss = 84, sx = 72, sy = 68;
    const sg = ctx.createLinearGradient(sx, sy, sx + ss, sy + ss);
    sg.addColorStop(0, '#f0d79b'); sg.addColorStop(1, '#bb9445');
    ctx.fillStyle = sg; roundRect(ctx, sx, sy, ss, ss, 18); ctx.fill();
    center(ctx, '策', sx + ss / 2, sy + 61, `900 54px ${HAN}`, C.sealInk);

    // 이름과 직함
    center(ctx, v.직함 || '', W / 2, IH - 78, `400 28px ${SANS}`, C.ink3);
    center(ctx, v.이름 || '', W / 2, IH - 22, `700 62px ${SERIF}`, C.acc);

    // 아뢴 말 — 카드의 주인공이다
    ctx.font = `400 42px ${SERIF}`;
    const 줄 = 접기(ctx, v.말 || '', W - 168, 5);
    let y = IH + 96;
    줄.forEach(t => { center(ctx, t, W / 2, y, `400 42px ${SERIF}`, C.ink); y += 62; });

    // 누구에게 한 말인가
    y = Math.max(y + 26, 1200);
    ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2 - 60, y - 44); ctx.lineTo(W / 2 + 60, y - 44); ctx.stroke();
    center(ctx, (v.공주 || '') + (v.간지 ? ' · ' + v.간지 : ''), W / 2, y, `400 28px ${SANS}`, C.ink2);

    // 푸터
    ctx.textAlign = 'left';
    ctx.font = `700 30px ${SANS}`; ctx.fillStyle = C.acc; ctx.fillText('chaeksa.kr', 72, 1306);
    ctx.textAlign = 'right';
    ctx.font = `400 25px ${SANS}`; ctx.fillStyle = C.ink3;
    ctx.fillText('열 사람의 책사가 둘러앉습니다', W - 72, 1306);
    ctx.textAlign = 'left';
    return canvas;
  }

  function toBlob(canvas) {
    return new Promise((res) => canvas.toBlob(res, 'image/png'));
  }
  async function save(canvas, name, label) {
    const blob = await toBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `책사_${name}_${label || '원국'}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  async function share(canvas, name, label, text) {
    const blob = await toBlob(canvas);
    const file = new File([blob], `책사_${name}_${label || '원국'}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file],
        title: label ? '책사 · ' + label : '내 사주 원국',
        text: text || `${name}의 사주 원국 · chaeksa.kr` });
      return true;
    }
    await save(canvas, name, label);
    return false;
  }

  global.ChaeksaShare = { draw, drawSay, save, share, canShareFile: () => !!(navigator.canShare && navigator.share) };
})(window);
