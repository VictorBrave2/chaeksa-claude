/* 책사 공유 카드 v1 — 원국을 이미지로 (canvas)
 * 브랜드 일관성을 위해 카드는 항상 '아침 한지' 색으로 그린다.
 */
(function (global) {
  'use strict';
  const E = global.ChaeksaEngine, f = E.fmt;
  const W = 1080, H = 1350;
  const C = {
    bg:'#f7f2e8', card:'#fffdf8', ink:'#332c23', ink2:'#6b6154', ink3:'#a0937d',
    acc:'#b3562e', accSoft:'#f4e9de', line:'#e8dcc6', line2:'#dbcbad', sealInk:'#fdf6ec',
    wood:'#4f8f5c', fire:'#c4573b', earth:'#a8802f', metal:'#7a7870', water:'#3d7fae',
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
    g.addColorStop(0, 'rgba(212,165,116,.30)'); g.addColorStop(1, 'rgba(212,165,116,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 380);

    // 헤더 — 인장
    const sx = 72, sy = 74, ss = 96;
    const sg = ctx.createLinearGradient(sx, sy, sx + ss, sy + ss);
    sg.addColorStop(0, '#c4603a'); sg.addColorStop(1, '#9b4123');
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

  function toBlob(canvas) {
    return new Promise((res) => canvas.toBlob(res, 'image/png'));
  }
  async function save(canvas, name) {
    const blob = await toBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `책사_${name}_원국.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  async function share(canvas, name) {
    const blob = await toBlob(canvas);
    const file = new File([blob], `책사_${name}_원국.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: '내 사주 원국', text: `${name}의 사주 원국 · chaeksa.kr` });
      return true;
    }
    await save(canvas, name);
    return false;
  }

  global.ChaeksaShare = { draw, save, share, canShareFile: () => !!(navigator.canShare && navigator.share) };
})(window);
