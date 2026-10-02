/* 책사 공유 — 그림 카드 저장 · 보내기 · 카카오 링크 · 링크만 보내기
 * 카드를 그리는 쪽은 따로 있다: 웹툰궁합 · 정통사주 카드(ssom-card.js) · 연애 결과 카드(love.js) · 인생 곡선(app.js + typecard.js share).
 * 10-02 개편 2묶음 「공유 카드 넓히기」 — 부르는 단추가 없던 원국 카드(draw)와 오늘의 한마디 카드(drawSay, 걷은 「열 사람의 책사」 문구)를 걷었다.
 *   원국 카드를 부르던 #btnShare · #shareCanvas, 한마디 카드를 부르던 홈 장면(#homeScene)은 화면에 없었다. 그래서 이 파일은 이제 엔진을 쓰지 않는다.
 *   링크 하나만 보내는 길(shareLink)을 더했다 — 출산택일 시뮬레이터 「이 날 가족에게 보내기」가 쓴다(그림 없이 주소 하나).
 */
(function (global) {
  'use strict';

  function toBlob(canvas) {
    return new Promise((res) => canvas.toBlob(res, 'image/png'));
  }
  async function save(canvas, name, label) {
    const blob = await toBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `책사_${name}_${label || '카드'}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  // 카톡은 파일이 붙은 공유에서 글 · 링크를 버리고 그림만 받는다(09-26 사장님 폰 실측). 그래서 링크(url)는 공유 전에 클립보드에도 넣어 둔다 — 붙여 넣으면 같이 간다.
  // 카카오 링크 공유(09-26) — 그림 + 한 줄 + 단추가 카톡 대화창에 한 장으로 간다. 그림은 https 정적 jpg(art/kakao/, 800×1000), 글만 개인화(카카오 한도 200자).
  let kakaoLoading = null;
  function kakaoReady() {
    const key = global.CHAEKSA_KAKAO_JS_KEY; if (!key) return Promise.resolve(false);
    if (global.Kakao && global.Kakao.isInitialized && global.Kakao.isInitialized()) return Promise.resolve(true);
    if (!kakaoLoading) kakaoLoading = new Promise(res => { const s = document.createElement('script'); s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'; s.crossOrigin = 'anonymous'; s.onload = () => { try { global.Kakao.init(key); res(true); } catch (e) { res(false); } }; s.onerror = () => res(false); document.head.appendChild(s); });
    return kakaoLoading;
  }
  // o = { title, text, image(https), url, button }
  async function kakaoShare(o) {
    if (!(await kakaoReady())) return false;
    try {
      global.Kakao.Share.sendDefault({ objectType: 'feed', content: { title: o.title, description: (o.text || '').slice(0, 200), imageUrl: o.image, imageWidth: 800, imageHeight: 1000, link: { mobileWebUrl: o.url, webUrl: o.url } }, buttons: [{ title: o.button || '내 것도 보기', link: { mobileWebUrl: o.url, webUrl: o.url } }] });
      return true;
    } catch (e) { return false; }
  }
  async function copyLink(url) { try { if (url && navigator.clipboard) { await navigator.clipboard.writeText(url); return true; } } catch (e) {} return false; }
  async function share(canvas, name, label, text, url) {
    const blob = await toBlob(canvas);
    const file = new File([blob], `책사_${name}_${label || '카드'}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await copyLink(url);
      const data = { files: [file], title: label ? '책사 · ' + label : '책사', text: (text || '책사') + (url ? ' ' + url : '') };
      if (url) data.url = url;
      try { await navigator.share(data); } catch (e) { if (e && e.name === 'AbortError') return true; delete data.url; await navigator.share(data); }
      return true;
    }
    await save(canvas, name, label);
    return false;
  }
  /** 링크 하나 보내기(10-02) — 카카오 링크(키와 그림이 있으면) → 폰 공유 창 → 주소 복사 차례로 해 본다.
   *  o = { title, text, image(https, 없으면 카카오는 건너뜀), url, button }
   *  반환: 'kakao' | 'shared' | 'aborted'(공유 창을 닫음) | 'copied' | ''(셋 다 못 함 — 부른 쪽이 주소를 글로 보여 준다) */
  async function shareLink(o) {
    if (o.image && await kakaoShare(o)) return 'kakao';
    if (navigator.share) {
      try { await navigator.share({ title: o.title, text: o.text, url: o.url }); return 'shared'; }
      catch (e) { if (e && e.name === 'AbortError') return 'aborted'; }
    }
    if (await copyLink(o.url)) return 'copied';
    return '';
  }

  global.ChaeksaShare = { save, share, shareLink, copyLink, kakaoShare, kakaoReady, canShareFile: () => !!(navigator.canShare && navigator.share) };
})(window);
