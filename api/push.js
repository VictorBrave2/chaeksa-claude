/* 책사 아침 푸시 발송 — Vercel 서버리스 함수 (Node 런타임)
 *
 * 매일 22:30 UTC(= 한국 07:30) Vercel Cron이 이 함수를 부른다 (vercel.json).
 * 구독 목록을 Supabase에서 받아(push_list, 비밀 필요) 각 기기에 '빈 푸시'를 보낸다.
 *
 * 왜 빈 푸시인가:
 *   본문을 실으려면 Web Push 암호화(ECDH+HKDF+AES-GCM)가 필요해서 코드가 세 배가 된다.
 *   빈 푸시는 서비스워커를 깨우기만 하고, 알림 문구는 기기(sw.js)가 만든다.
 *   개인화된 계산은 어차피 전부 기기에서 하므로 서버가 내용을 알 필요가 없다 —
 *   개인정보가 서버를 오가지 않는 것은 부수 효과가 아니라 설계다.
 *
 * VAPID 인증: JWT(ES256)를 crypto.subtle로 직접 서명한다. npm 의존성 0개.
 *
 * 환경변수:
 *   CRON_SECRET         schema-6 실행 결과로 나온 uuid. Vercel이 Cron 호출에
 *                       Authorization: Bearer <CRON_SECRET> 를 자동으로 붙여준다.
 *   VAPID_PRIVATE_KEY   JWK JSON의 base64url. config.js의 VAPID 공개키와 쌍이다.
 */
const SB_URL = 'https://dedgzremezveiwhosqjj.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZGd6cmVtZXp2ZWl3aG9zcWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODQyNzcsImV4cCI6MjEwMzE2MDI3N30.ek3yy6tZuYLydS6f1yiLrXIUGSJCeiNLPN5bExas-TA';
const VAPID_PUBLIC = 'BOnkk9JIqSpMRYLSm3MewtToERQ6BnFDJNiNYffkpe2u7ce_hHAqrg2bAM_5XhuOTQ9_R3PSWhVkth7WJ5gfuEg';
const CONTACT = 'mailto:b01099991263@gmail.com';

const clean = (v) => (v || '').replace(/[^!-~]/g, '');
const b64uToBuf = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const bufToB64u = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function rpc(name, args) {
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: SB_ANON, authorization: `Bearer ${SB_ANON}`, 'content-type': 'application/json' },
    body: JSON.stringify(args || {}),
  });
  if (!res.ok) throw new Error(`rpc ${name} HTTP ${res.status}`);
  return res.json();
}

/** VAPID JWT — aud(푸시 서비스 origin)별로 하나씩 만들어 재사용한다 */
async function vapidJwtFactory() {
  const jwk = JSON.parse(b64uToBuf(clean(process.env.VAPID_PRIVATE_KEY)).toString('utf8'));
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const cache = new Map();
  return async (aud) => {
    if (cache.has(aud)) return cache.get(aud);
    const enc = (o) => bufToB64u(Buffer.from(JSON.stringify(o)));
    const head = enc({ typ: 'JWT', alg: 'ES256' });
    const body = enc({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: CONTACT });
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, Buffer.from(`${head}.${body}`));
    const jwt = `${head}.${body}.${bufToB64u(sig)}`;
    cache.set(aud, jwt);
    return jwt;
  };
}

module.exports = async (req, res) => {
  const secret = clean(process.env.CRON_SECRET);
  const auth = (req.headers.authorization || '').replace('Bearer ', '').trim();

  // 진단 — 비밀 없이 부르면 설정 상태만 알려준다 (구독 목록은 안 준다)
  if (!auth || auth !== secret) {
    return res.status(auth ? 401 : 200).json({
      ok: !auth,
      hasCronSecret: !!secret,
      hasVapidKey: !!clean(process.env.VAPID_PRIVATE_KEY),
      hint: 'Cron이 Authorization: Bearer <CRON_SECRET>로 부른다. 수동 시험도 같은 헤더면 된다.',
    });
  }

  let listed;
  try { listed = await rpc('push_list', { p_secret: secret }); }
  catch (e) { return res.status(502).json({ ok: false, step: 'push_list', error: String(e.message) }); }
  if (!listed.ok) return res.status(403).json({ ok: false, step: 'push_list', error: 'secret mismatch — schema-6의 비밀과 CRON_SECRET이 다르다' });

  const subs = listed.subs || [];
  const jwtFor = await vapidJwtFactory();
  const dead = [], alive = [];
  let sent = 0;

  // 푸시 서비스별 동시 발송 (기기 수백 대까지는 이 정도로 충분하다)
  await Promise.all(subs.map(async ({ endpoint }) => {
    try {
      const aud = new URL(endpoint).origin;
      const jwt = await jwtFor(aud);
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: {
          TTL: '43200',                                   // 반나절 — 아침 알림이 저녁에 오면 소음이다
          Urgency: 'normal',
          Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC}`,
        },
      });
      if (r.status === 404 || r.status === 410) dead.push(endpoint);   // 구독 해지된 기기
      else if (r.ok) { alive.push(endpoint); sent++; }
    } catch (e) { /* 개별 실패는 다음 아침에 다시 */ }
  }));

  try { await rpc('push_mark', { p_secret: secret, p_dead: dead, p_alive: alive }); } catch (e) {}
  return res.status(200).json({ ok: true, total: subs.length, sent, pruned: dead.length });
};
