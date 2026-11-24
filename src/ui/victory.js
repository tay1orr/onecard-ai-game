// 승리 연출 — 맵 위 마지막 한 장 → 상대가 운다 → 내 캐릭터가 뛰어오르며 장면으로 → 승리 장면
// 11-24 선생님: 「그냥 맵에서 → 이기는 연출 → 장면 이렇게 들어가면 좋을 것 같은데」 · 「파괴하기엔 안 어울리고」 · 「상대 캐릭터가 우는 모습을 하나 만들어서」
//   · 「오브젝트 하나 떨구고 배경 보여 주고 글씨만 쓰는 게 다가 아니야 — 승리 연출 모션 전체 개편」 · 「너무 단조롭게 하지는 말고」
//  1막 탁자  이긴 카드가 쿵(잠깐 멈칫) — 상대 남은 패가 뒤집혀 드러나고, 탁자가 이긴 카드 쪽으로 살짝 다가온다
//  2막 상대  상대 캐릭터가 자리에서 앞으로 나와 운다(우는 GPT 그림 char-<이름>-cry 가 있으면 그 그림, 없으면 낯빛이 질리고 떤다) · 진 대사.
//            반응은 판마다 셋 가운데 하나(주저앉기 · 깜짝 놀라 패를 던지기 · 털썩 무너지기)
//  3막 전환  내 캐릭터가 자리에서 뛰어오른다(판마다 크게 뛰기 · 돌며 뛰기 · 콩콩 뛰기). 장면으로 넘어가는 방식은 아이템마다 —
//            pan 카메라가 탁자에서 위로 · petals 꽃바람이 카메라 앞을 쓸고 감 · flash 빛이 번짐 · confetti 색종이가 터짐(장면 그림이 없으면 맵이 그대로 무대)
//  4막 장면  내 캐릭터(기뻐하는 GPT 그림 char-<이름>-win 이 있으면 그 그림)가 한가운데, 배경은 살짝 흐려지며 초점이 캐릭터로. 아이템은 캐릭터에 붙는다(anchor —
//            head 왕관은 머리 · feet 꽃은 발밑 꽃밭 · beside 트로피 · 케이크는 옆 · behind 해 · 달 · 고래는 뒤 · sky 풍선은 하늘 · frame 꽃가지는 위 모서리)
//            운 상대는 구석에서 훌쩍이고 승리 띠가 내려온다. 분위기(ambient)는 꽃잎 · 색종이 대포 · 불꽃 · 비눗방울 · 반짝임 가운데 아이템이 고른 것
// 화면을 누르면 끝 장면으로 건너뛴다(director). 소리 · 한 번만 일어나는 연출은 그 시각을 지날 때만 울린다
import gsap from 'gsap';
import { h } from './dom.js';
import { cut, paint, photo, scene } from '../data/assets.js';
import { hasGptArt } from '../data/gpt-art.js';
import { cardBack, cardFace } from './cards.js';
import { play } from './sound.js';

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function victoryBackdrop(backdrop) {
  if (!backdrop) return null;
  if (backdrop.scene) return scene(backdrop.scene);
  if (backdrop.paint) return paint(backdrop.paint);
  if (backdrop.photo) return photo(backdrop.photo, 'wide');
  return null;
}

// GPT 표정 그림(우는 상대 · 기뻐하는 나)이 들어와 있으면 그 키
export const cryingArt = (portrait) => (portrait && hasGptArt(`${portrait}-cry`) ? `${portrait}-cry` : null);
export const cheeringArt = (portrait) => (portrait && hasGptArt(`${portrait}-win`) ? `${portrait}-win` : null);

// 꽃바람 · 날리는 꽃잎에 쓸 실물 — 아이템이 따로 정하지 않으면 꽃밭 꽃 + 꽃잎
const sweepOf = (look) => look.sweep || [...(look.anchor === 'feet' && look.hero ? [look.hero] : []), ...(look.sprites || []), ...(look.petals || [])].filter(Boolean);

// 판이 시작될 때 미리 받아 둔다 — 장면이 늦게 떠 빈 화면이 보이지 않게
export function preloadVictory(look, { rival = null, me = null } = {}) {
  const keys = [look?.hero, ...(look ? sweepOf(look) : []), cryingArt(rival), cheeringArt(me), 'gold-star'].filter(Boolean);
  [victoryBackdrop(look?.backdrop), ...keys.map((key) => cut(key)), ...(look?.fireworks || []).map((key) => scene(key))].filter(Boolean).forEach((url) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  });
}

export function playVictory(fx, { look, me = {}, rival = null, table = null, title = '승리', sub = '' }) {
  const { layer, director, shockwave, shake, reduced } = fx;
  const box = layer.getBoundingClientRect();
  const W = box.width;
  const H = box.height;
  const wide = W >= 760;
  const quick = reduced();
  const accent = look.accent || '#f2b544';
  // 낮은 무대(휴대폰 보관함 미리 보기 등)는 제목을 높이에 맞춰 줄인다 — 큰 화면 크기 그대로면 캐릭터 얼굴을 덮었다(11-24)
  const stage = h(`div.fx-victory${H < 420 ? '.is-low' : ''}`, { vars: { '--v-accent': accent, '--stage-w': `${Math.round(W)}px`, '--stage-h': `${Math.round(H)}px` } });
  layer.append(stage);
  const timeline = director.timeline();
  const loops = [];
  const seats = [];
  // 소리 · 한 번만 일어나는 연출은 그 시각을 지날 때만(화면을 눌러 건너뛰면 한꺼번에 울리지 않게)
  const at = (time, fn) => timeline.call(() => { if (timeline.time() - time < 0.3) fn(); }, null, time);
  // 계속 도는 움직임(숨쉬기 · 흔들림)은 건너뛰어도 시작한다
  const loop = (time, make) => timeline.call(() => { const tween = make(); if (tween) loops.push(tween); }, null, time);
  const rectOf = (el) => {
    if (!el?.isConnected) return null;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return null;
    return { x: rect.left - box.left, y: rect.top - box.top, w: rect.width, h: rect.height };
  };

  // ── 판마다 조금씩 다르게(단조롭지 않게)
  const side = Math.random() < 0.5 ? 1 : -1; // 운 상대가 서는 구석(1 오른쪽 · -1 왼쪽) — 옆 소품은 반대쪽
  const rivalAct = pick(['slump', 'shock', 'collapse']);
  const meAct = pick(['leap', 'spin', 'hop']);
  const transition = look.transition || (victoryBackdrop(look.backdrop) ? 'pan' : 'flash');

  // ── 자리(발끝 기준) — 무대 한가운데 · 2막 앞자리 · 4막 구석
  const spots = wide
    ? { center: { x: W * 0.5, feet: H * 0.96, size: Math.min(H * 0.64, 620) }, front: { x: W * 0.5, feet: H * 0.74, size: Math.min(H * 0.52, 500) }, corner: { x: W * (0.5 + side * 0.375), feet: H * 1.04, size: Math.min(H * 0.34, 330) } }
    : { center: { x: W * 0.5, feet: H * 0.8, size: Math.min(H * 0.46, W * 0.9) }, front: { x: W * 0.5, feet: H * 0.6, size: Math.min(H * 0.38, W * 0.78) }, corner: { x: W * (0.5 + side * 0.31), feet: H * 1.02, size: Math.min(H * 0.24, W * 0.46) } };
  const c = spots.center;

  // 캐릭터 한 명 — 발끝이 기준점(transform-origin 50% 100%)
  function figure(key, spot, className) {
    const img = h('img', { src: cut(key), alt: '', draggable: 'false', decoding: 'async' });
    const el = h(`div.v-figure.${className}`, {}, img);
    Object.assign(el.style, { left: `${spot.x - spot.size / 2}px`, top: `${spot.feet - spot.size}px`, width: `${spot.size}px`, height: `${spot.size}px` });
    gsap.set(el, { transformOrigin: '50% 100%', opacity: 0 });
    stage.append(el);
    return { el, img, spot };
  }
  // 그림이 실제로 그려진 높이(가로가 넓은 그림은 낮다) — 머리 위치를 잰다
  const drawnHeight = (fig) => {
    const ratio = fig.img.naturalWidth && fig.img.naturalHeight ? fig.img.naturalWidth / fig.img.naturalHeight : 0.92;
    return ratio <= 1 ? fig.spot.size : fig.spot.size / ratio;
  };
  // 자리 초상(작은 그림)에서 출발 — 발끝을 맞춰 같은 크기로 겹친 뒤 커진다
  const fromSeat = (seatEl, spot) => {
    const seat = rectOf(seatEl);
    if (!seat) return { x: 0, y: spot.size * 0.35, scale: 0.3 };
    return { x: seat.x + seat.w / 2 - spot.x, y: seat.y + seat.h - spot.feet, scale: Math.max(0.06, seat.h / spot.size) };
  };
  // 꽃잎 사진은 빨간 장미 꽃잎 — 장미가 아닌 아이템은 그 꽃 색으로 물들인다(petalTint)
  const tintOf = (key) => (key.startsWith('rose-petal') ? look.petalTint || null : null);
  // 소품(아이템 실물) — 감싼 상자 안에 그림, 반짝임은 같은 상자에 붙어 함께 움직인다
  function prop(key, size, point, layerName = 'is-front') {
    const img = h('img', { src: cut(key), alt: '', draggable: 'false', decoding: 'async' });
    const tint = tintOf(key);
    if (tint) img.style.filter = `${tint}${layerName === 'is-near' ? ' blur(4px)' : ''}`;
    const el = h(`div.v-prop.${layerName}`, {}, img);
    Object.assign(el.style, { width: `${size}px`, height: `${size}px`, left: `${point.x - size / 2}px`, top: `${point.y - size / 2}px` });
    gsap.set(el, { opacity: 0 });
    stage.append(el);
    return el;
  }
  function shine(el, time) {
    const glint = h('i.v-shine', { vars: { '--hero-mask': `url("${el.querySelector('img').src}")` } });
    el.append(glint);
    timeline.fromTo(glint, { backgroundPosition: '130% 0', opacity: 1 }, { backgroundPosition: '-30% 0', duration: 0.8, ease: 'power2.inOut' }, time);
    timeline.to(glint, { opacity: 0, duration: 0.2 }, time + 0.8);
  }
  // 반짝 — 별 몇 개가 톡 튀었다 사라진다(떼로 번지지 않게 셋 안팎)
  function twinkle(points, time, size) {
    points.forEach((point, index) => {
      const el = prop('gold-star', size * rand(0.7, 1.1), point, 'is-glint');
      timeline.fromTo(el, { scale: 0, rotation: rand(-40, 40), opacity: 1 }, { scale: 1, rotation: `+=${rand(40, 90)}`, duration: 0.32, ease: 'back.out(3)' }, time + index * 0.07);
      timeline.to(el, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in' }, time + 0.42 + index * 0.07);
    });
  }

  // 무대 층: 배경(맨 아래) → 어둠 → 빛살 → 뒤 소품 → 상대 → 나 → 앞 소품 → 띠 · 말풍선 → 가까운 꽃잎
  const bgUrl = victoryBackdrop(look.backdrop);
  const bg = bgUrl ? h('div.v-backdrop') : null;
  if (bg) bg.style.backgroundImage = `url("${bgUrl}")`;
  const veil = h('i.v-veil');
  const focus = h('i.v-focus');
  stage.append(...[bg, veil, focus].filter(Boolean));
  gsap.set([bg, veil, focus].filter(Boolean), { opacity: 0 });

  // ── 1막 — 탁자 위 마지막 한 장
  const parts = table?.root ? {
    top: table.root.querySelector('.game-top'),
    hint: table.root.querySelector('.table-hint'),
    wrap: table.root.querySelector('.table-wrap'),
    rivalZone: table.root.querySelector('.rival-zone'),
    meZone: table.root.querySelector('.me-zone'),
    world: table.root.querySelector('.scene'),
  } : null;
  const reveal = [];
  let t2 = 0;
  if (parts && !quick) {
    timeline.to([parts.top, parts.hint].filter(Boolean), { opacity: 0, duration: 0.25 }, 0);
    const pileRect = table.pile?.getBoundingClientRect();
    const pileAt = pileRect ? { x: pileRect.left + pileRect.width / 2, y: pileRect.top + pileRect.height / 2 } : { x: box.left + W / 2, y: box.top + H / 2 };
    const topCard = table.pile?.lastElementChild;
    if (topCard) timeline.to(topCard, { scale: 1.2, duration: 0.1, ease: 'power2.out', yoyo: true, repeat: 1 }, 0.04);
    at(0.06, () => {
      play('place', { volume: 1 });
      play('bong', { volume: 0.55 });
      shockwave(pileAt, accent, { size: 300, rings: 2 });
      shake(0.8);
      // 잠깐 멈칫(히트 스톱) — 마지막 한 장이 무겁게 떨어진 느낌
      timeline.timeScale(0.22);
      gsap.delayedCall(0.13, () => timeline.timeScale(1));
    });
    // 카메라 — 탁자가 이긴 카드 쪽으로 다가온다
    const wrapRect = parts.wrap?.getBoundingClientRect();
    if (parts.wrap && wrapRect?.width) {
      const origin = `${((pileAt.x - wrapRect.left) / wrapRect.width) * 100}% ${((pileAt.y - wrapRect.top) / wrapRect.height) * 100}%`;
      timeline.to(parts.wrap, { scale: 1.05, transformOrigin: origin, duration: 1.4, ease: 'power2.out' }, 0.08);
    }
    if (parts.world) timeline.to(parts.world, { scale: 1.05, duration: 1.8, ease: 'power2.out' }, 0.08);
    // 상대 남은 패 — 뒤집혀 드러난다(깜짝 놀라는 판은 2막에서 공중으로 던진다)
    const backs = [...(table.rivalHand?.querySelectorAll('.rival-card') || [])];
    backs.forEach((back, index) => {
      const rect = rectOf(back);
      if (!rect) return;
      const w = back.offsetWidth;
      const hh = back.offsetHeight;
      const card = table.cards?.[index] || null;
      const holder = h('div.flip-card.v-reveal', { vars: { '--cw': `${w}px` } }, cardBack(), card ? cardFace(card) : cardBack());
      Object.assign(holder.style, { left: `${rect.x + rect.w / 2 - w / 2}px`, top: `${rect.y + rect.h / 2 - hh / 2}px`, width: `${w}px`, height: `${hh}px` });
      stage.append(holder);
      const rotation = Number(gsap.getProperty(back, 'rotation')) || 180;
      gsap.set(holder, { rotation, transformPerspective: 800 });
      reveal.push(holder);
      timeline.set(back, { visibility: 'hidden' }, 0.01);
      const start = 0.3 + index * 0.06;
      if (card) timeline.to(holder, { rotationY: 180, rotation: rotation - 180 + rand(-8, 8), y: 8, duration: 0.42, ease: 'power2.inOut' }, start);
      if (rivalAct !== 'shock') timeline.to(holder, { y: `+=${rand(50, 90)}`, x: `+=${rand(-24, 24)}`, rotation: `+=${rand(-22, 22)}`, duration: 0.75, ease: 'power2.in' }, start + 0.48);
    });
    if (backs.length) at(0.32, () => play('slide', { volume: 0.5, rate: 1.25 }));
    t2 = 0.7;
  }

  // ── 2막 — 상대가 운다
  let rivalFig = null;
  let t3 = t2;
  if (rival) {
    const cry = cryingArt(rival.portrait);
    rivalFig = figure(cry || rival.portrait, spots.front, cry ? 'is-rival.is-crying' : 'is-rival.is-gloomy');
    if (!cry) rivalFig.el.append(h('i.v-gloom', { vars: { '--fig-mask': `url("${cut(rival.portrait)}")` } }));
    if (rival.el) { seats.push(rival.el); timeline.set(rival.el, { opacity: 0 }, quick ? 0 : t2); }
    const f = spots.front;
    const k = spots.corner;
    if (quick) {
      // 줄인 연출 — 구석에 조용히
      gsap.set(rivalFig.el, { x: k.x - f.x, y: k.feet - f.feet, scale: k.size / f.size });
      timeline.to(rivalFig.el, { opacity: 1, duration: 0.3 }, 0.1);
    } else {
      const seat = fromSeat(rival.el, f);
      timeline.fromTo(rivalFig.el, { x: seat.x, y: seat.y, scale: seat.scale, opacity: 1 }, { x: 0, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.35)', immediateRender: false }, t2);
      timeline.to(focus, { opacity: 1, duration: 0.5 }, t2);
      at(t2 + 0.02, () => play('swoop', { volume: 0.55 }));
      const body = rivalFig.img;
      gsap.set(body, { transformOrigin: '50% 100%' });
      if (rivalAct === 'shock') {
        // 깜짝 놀라 펄쩍 — 들고 있던 패를 공중에 던지고 털썩
        timeline.to(body, { y: -f.size * 0.12, scaleY: 1.08, scaleX: 0.94, duration: 0.16, ease: 'power2.out' }, t2 + 0.55);
        timeline.to(body, { y: 6, scaleY: 0.9, scaleX: 1.06, duration: 0.2, ease: 'power2.in' }, t2 + 0.71);
        timeline.to(body, { y: 4, scaleY: 1, scaleX: 1, rotation: 3, duration: 0.3, ease: 'power2.out' }, t2 + 0.91);
        reveal.forEach((holder, index) => {
          timeline.to(holder, { y: `-=${rand(70, 120)}`, x: `+=${rand(-60, 60)}`, rotation: `+=${rand(-70, 70)}`, duration: 0.24, ease: 'power2.out' }, t2 + 0.56 + index * 0.04);
          timeline.to(holder, { y: `+=${H * 0.55}`, rotation: `+=${rand(-160, 160)}`, duration: 1, ease: 'power2.in' }, t2 + 0.8 + index * 0.04);
        });
        at(t2 + 0.56, () => play('slide', { volume: 0.6, rate: 0.9 }));
      } else if (rivalAct === 'collapse') {
        // 털썩 무너지기 — 무릎이 꺾이듯 낮아진다
        timeline.to(body, { scaleY: 0.82, scaleX: 1.07, y: 0, rotation: -2, duration: 0.42, ease: 'power3.in' }, t2 + 0.58);
        timeline.to(body, { scaleY: 0.86, duration: 0.2, ease: 'power2.out' }, t2 + 1);
      } else {
        // 주저앉기 — 고개가 앞으로 떨어지고 어깨가 처진다
        timeline.to(body, { rotation: -5, y: 10, scaleY: 0.94, duration: 0.45, ease: 'power2.out' }, t2 + 0.55);
      }
      // 훌쩍훌쩍 — 계속 작게 떨린다(구석으로 가서도)
      loop(t2 + 0.9, () => gsap.to(body, { x: '+=2.6', duration: 0.07, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      at(t2 + 0.62, () => { play('pluck', { rate: 0.71, volume: 0.55 }); play('pluck', { rate: 0.6, volume: 0.5, delay: 0.16 }); });
      if (rival.line) {
        const bubble = h('div.v-bubble', {}, rival.line);
        stage.append(bubble);
        const headY = f.feet - drawnHeight(rivalFig);
        if (wide) gsap.set(bubble, { left: f.x + f.size * 0.3, top: headY + f.size * 0.04, transformOrigin: '0% 100%' });
        else gsap.set(bubble, { left: W / 2, top: Math.max(H * 0.06, headY - 14), xPercent: -50, yPercent: -100, transformOrigin: '50% 100%' });
        timeline.fromTo(bubble, { scale: 0.3, opacity: 0, rotation: -6 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.38, ease: 'back.out(2.2)' }, t2 + 0.66);
        timeline.to(bubble, { opacity: 0, y: -10, duration: 0.22 }, t2 + 1.52);
      }
      t3 = t2 + 1.5;
    }
  }

  // ── 3막 — 내 캐릭터가 뛰어오르며 장면으로
  const meKey = cheeringArt(me.portrait) || me.portrait || 'trophy';
  const meFig = figure(meKey, c, 'is-me');
  if (me.el) { seats.push(me.el); timeline.set(me.el, { opacity: 0 }, t3); }
  const cutAt = t3 + 0.12; // 장면이 바뀌기 시작하는 때
  let t4;
  if (quick) {
    timeline.fromTo(meFig.el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, t3);
    t4 = t3 + 0.3;
  } else {
    const seat = fromSeat(me.el, c);
    const hops = meAct === 'hop' ? 0.36 : 0;
    timeline.set(meFig.el, { x: seat.x, y: seat.y, scaleX: seat.scale, scaleY: seat.scale, opacity: 1 }, t3);
    // 콩콩 — 제자리에서 두 번 콩 뛰고 크게 뛴다
    if (hops) timeline.to(meFig.el, { y: seat.y - 26, duration: 0.09, ease: 'power2.out', yoyo: true, repeat: 3 }, t3);
    timeline.to(meFig.el, { scaleX: seat.scale * 1.14, scaleY: seat.scale * 0.82, duration: 0.12, ease: 'power2.out' }, t3 + hops);
    const peak = Math.min(seat.y, 0) - H * (meAct === 'leap' ? 0.3 : 0.22);
    timeline.to(meFig.el, { keyframes: { x: [seat.x, seat.x * 0.42, 0], y: [seat.y, peak, 0], ease: 'none' }, duration: 0.82, ease: 'power1.inOut' }, t3 + hops + 0.12);
    timeline.to(meFig.el, { scaleX: 0.93, scaleY: 1.09, duration: 0.42, ease: 'power2.out' }, t3 + hops + 0.12);
    if (meAct === 'spin') timeline.fromTo(meFig.el, { rotation: 0 }, { rotation: 360, duration: 0.7, ease: 'power2.inOut', immediateRender: false }, t3 + hops + 0.16);
    timeline.to(meFig.el, { scaleX: 1.1, scaleY: 0.88, duration: 0.1, ease: 'power2.in' }, t3 + hops + 0.86);
    timeline.to(meFig.el, { scaleX: 1, scaleY: 1, duration: 0.55, ease: 'elastic.out(1, 0.42)' }, t3 + hops + 0.96);
    at(t3 + hops + 0.12, () => play('whoosh', { volume: 0.55 }));
    t4 = t3 + hops + 0.96;
  }

  // 장면으로 넘어가기 — 아이템마다 방식이 다르다
  const world = parts ? [parts.wrap, parts.rivalZone, parts.meZone].filter(Boolean) : [];
  const petalKeys = look.petals || [];
  if (quick) {
    if (bg) timeline.to(bg, { opacity: 1, duration: 0.3 }, t3);
    timeline.to(veil, { opacity: 1, duration: 0.3 }, t3);
    if (world.length) timeline.to(world, { opacity: 0, duration: 0.25 }, t3);
  } else if (transition === 'pan') {
    // 카메라가 탁자에서 위로 — 탁자 · 맵과 장면 그림이 한 줄로 붙어 함께 내려간다(이음매는 어둡게 녹인다)
    const travel = H * 1.08;
    if (bg) {
      gsap.set(bg, { '--seam': 1 });
      timeline.fromTo(bg, { y: -travel, opacity: 1 }, { y: 0, duration: 1, ease: 'power3.inOut', immediateRender: false }, cutAt);
      timeline.to(bg, { '--seam': 0, duration: 0.45 }, cutAt + 0.75);
    }
    if (world.length) timeline.to([...world, parts?.world, ...reveal].filter(Boolean), { y: `+=${travel}`, duration: 1, ease: 'power3.inOut' }, cutAt);
    timeline.to(veil, { opacity: 1, duration: 0.6 }, cutAt + 0.4);
    // 카메라 앞을 스치는 큰 꽃잎 둘(가까운 것은 흐릿하게)
    petalKeys.slice(0, 2).forEach((key, index) => {
      const size = (wide ? W * 0.13 : W * 0.34) * rand(0.9, 1.15);
      const el = prop(key, size, { x: W * (index ? rand(0.62, 0.86) : rand(0.14, 0.38)), y: -size * 0.6 }, 'is-near');
      timeline.fromTo(el, { opacity: 1, rotation: rand(-50, 50) }, { y: H + size * 1.4, x: `+=${rand(-W * 0.12, W * 0.12)}`, rotation: `+=${rand(-140, 140)}`, duration: rand(0.85, 1.05), ease: 'power1.in', immediateRender: false }, cutAt + 0.1 + index * 0.12);
    });
  } else if (transition === 'petals') {
    // 꽃바람 — 꽃송이 · 꽃잎이 크기 · 높이 · 빠르기가 제각각으로 카메라 앞을 쓸고 지나가며 장면이 바뀐다(가까운 것은 크고 흐리고 빠르게)
    const keys = sweepOf(look);
    const count = wide ? 11 : 8;
    for (let index = 0; index < count; index += 1) {
      const near = index % 4 === 0;
      const key = keys[index % keys.length];
      const size = near ? (wide ? H * 0.3 : W * 0.5) : (wide ? H : W * 1.6) * rand(0.1, 0.18);
      const el = prop(key, size, { x: -size * 0.7, y: H * rand(-0.05, 1.02) }, near ? 'is-near' : 'is-mid');
      const travel = W + size * 1.6;
      const start = cutAt - 0.08 + rand(0, 0.36);
      timeline.set(el, { opacity: 1, rotation: rand(-90, 90) }, start);
      timeline.to(el, {
        keyframes: { x: [0, travel * 0.5, travel], y: [0, -H * rand(0.04, 0.16), -H * rand(0.1, 0.28)], ease: 'none' },
        rotation: `+=${rand(140, 320) * (index % 2 ? 1 : -1)}`, duration: near ? rand(0.6, 0.75) : rand(0.95, 1.3), ease: 'power1.inOut',
      }, start);
    }
    if (bg) timeline.to(bg, { opacity: 1, duration: 0.4 }, cutAt + 0.3);
    if (world.length) timeline.to([...world, ...reveal], { opacity: 0, duration: 0.3 }, cutAt + 0.25);
    timeline.to(veil, { opacity: 1, duration: 0.5 }, cutAt + 0.4);
    at(cutAt, () => play('whoosh', { volume: 0.4, rate: 0.85 }));
  } else {
    // flash 빛이 번짐 · confetti 색종이가 터짐 — 하얀 빛이 화면을 덮은 사이에 장면이 바뀐다
    const glare = h('i.v-glare');
    stage.append(glare);
    const meTop = c.feet - c.size * 0.55;
    const reach = Math.hypot(W, H) * 1.15;
    gsap.set(glare, { width: reach, height: reach, left: c.x - reach / 2, top: meTop - reach / 2, opacity: 0, scale: 0.05 });
    timeline.to(glare, { opacity: 1, scale: 1, duration: 0.38, ease: 'power2.in' }, cutAt + 0.18);
    if (bg) timeline.set(bg, { opacity: 1 }, cutAt + 0.56);
    if (world.length) timeline.set([...world, ...reveal], { opacity: 0 }, cutAt + 0.56);
    timeline.set(veil, { opacity: 1 }, cutAt + 0.56);
    timeline.to(glare, { opacity: 0, duration: 0.55, ease: 'power2.out' }, cutAt + 0.6);
    if (!bg && parts?.world) timeline.to(parts.world, { scale: 1.14, duration: 1.4, ease: 'power2.out' }, cutAt + 0.56);
    if (transition === 'confetti') {
      [[0.04, -62], [0.96, -118]].forEach(([ratio, angle], sideIndex) => {
        for (let index = 0; index < 2; index += 1) {
          const el = prop(index ? 'gift-box' : 'confetti', rand(110, 150), { x: W * ratio, y: H * 1.04 }, 'is-near-soft');
          const fire = cutAt + 0.05 + index * 0.16 + sideIndex * 0.06;
          timeline.set(el, { opacity: 1 }, fire);
          timeline.to(el, { physics2D: { velocity: rand(900, 1080), angle: angle + rand(-8, 8), gravity: 980 }, rotation: rand(-220, 220), duration: 1.9, ease: 'none' }, fire);
          timeline.to(el, { opacity: 0, duration: 0.35 }, cutAt + 1.6 + index * 0.1);
        }
      });
      at(cutAt + 0.05, () => play('chips', { volume: 0.6 }));
    }
    at(cutAt + 0.2, () => play('glass', { volume: 0.5, rate: 1.2 }));
  }
  if (!quick) timeline.to(focus, { opacity: 0, duration: 0.5 }, cutAt + 0.2);
  // 운 상대는 구석으로 — 무대 가장자리에서 훌쩍인다
  if (rivalFig && !quick) {
    const k = spots.corner;
    const f = spots.front;
    timeline.to(rivalFig.el, { x: k.x - f.x, y: k.feet - f.feet, scale: k.size / f.size, duration: 0.9, ease: 'power3.inOut' }, cutAt);
  }

  // ── 4막 — 승리 장면
  const headTop = () => c.feet - drawnHeight(meFig);
  // 뒤 빛(캐릭터를 배경에서 띄움) · 발밑 빛 · 뒤 빛살
  const aura = h('i.v-aura');
  const pool = h('i.v-pool');
  const rays = h('i.v-rays');
  stage.insertBefore(rays, rivalFig?.el || meFig.el);
  stage.insertBefore(aura, meFig.el);
  stage.insertBefore(pool, meFig.el);
  const auraPx = c.size * 1.3;
  gsap.set(aura, { left: c.x - auraPx / 2, top: c.feet - c.size * 0.52 - auraPx / 2, width: auraPx, height: auraPx, opacity: 0 });
  gsap.set(pool, { left: c.x - c.size * 0.6, top: c.feet - c.size * 0.1, width: c.size * 1.2, height: c.size * 0.2, opacity: 0 });
  const raysPx = c.size * 1.9;
  gsap.set(rays, { left: c.x - raysPx / 2, top: c.feet - c.size * 0.52 - raysPx / 2, width: raysPx, height: raysPx, opacity: 0 });
  timeline.fromTo(pool, { opacity: 0, scaleX: 0.3 }, { opacity: 1, scaleX: 1, duration: 0.45, ease: 'power2.out' }, t4 - 0.06);
  timeline.to(aura, { opacity: 1, duration: 0.8, ease: 'power2.out' }, t4 - 0.1);
  timeline.fromTo(rays, { opacity: 0, rotation: -24, scale: 0.6 }, { opacity: 0.85, rotation: 0, scale: 1, duration: 1, ease: 'power2.out' }, t4);
  loop(t4 + 1, () => gsap.to(rays, { rotation: '+=40', duration: 16, ease: 'none', repeat: -1 }));
  at(t4 - 0.06, () => { play('drop', { volume: 0.7 }); play('win'); });
  // 초점이 캐릭터로 — 배경(장면 그림 · 맵)이 살짝 흐려지고 어두워진다
  const backdropEl = bg || parts?.world || null;
  // 시작 값을 숫자로 줘야 한다 — 'none' 에서 시작하면 밝기가 0 에서 출발해 화면이 한순간 까매진다
  if (backdropEl && !quick) timeline.fromTo(backdropEl, { filter: 'blur(0px) brightness(1)' }, { filter: 'blur(3px) brightness(0.8)', duration: 0.9, ease: 'power2.inOut', immediateRender: false }, t4 + 0.2);
  if (bg && !quick) loop(t4 + 0.4, () => gsap.fromTo(bg, { scale: 1 }, { scale: 1.07, duration: 10, ease: 'none' }));
  if (!quick) {
    // 착지 반짝 — 발 양옆과 머리 위
    twinkle([{ x: c.x - c.size * 0.36, y: c.feet - c.size * 0.12 }, { x: c.x + c.size * 0.38, y: c.feet - c.size * 0.2 }, { x: c.x + c.size * 0.18, y: headTop() + c.size * 0.02 }], t4, c.size * 0.13);
    // 승리 띠가 박힐 때 한 번 더 깡충 — 그다음 숨 쉬듯 들썩
    timeline.to(meFig.el, { y: -c.size * 0.07, duration: 0.17, ease: 'power2.out', yoyo: true, repeat: 1 }, t4 + 0.9);
    timeline.to(meFig.el, { scaleY: 0.95, scaleX: 1.04, duration: 0.08, ease: 'power1.out', yoyo: true, repeat: 1 }, t4 + 1.24);
    loop(t4 + 1.45, () => gsap.to(meFig.img, { scaleY: 1.018, transformOrigin: '50% 100%', duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  }
  stageHero(t4 + 0.12);
  ambient(t4 + 0.35);
  // 승리 띠 — 색 띠가 쓸고 지나가며 펼쳐지고, 글자가 하나씩 떨어져 박힌다
  const word = look.word || title;
  const letters = [...word].map((char) => h('span.v-letter', {}, char === ' ' ? ' ' : char));
  const bar = h('i.v-title-bar');
  const wordEl = h('b.v-title-word', {}, bar, ...letters);
  const subEl = sub ? h('small.v-title-sub', {}, sub) : null;
  stage.append(h('div.v-title', {}, wordEl, subEl));
  timeline.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'power3.out' }, t4 + 0.28);
  timeline.fromTo(letters, { y: -60, opacity: 0, rotation: -14, scale: 1.3 }, { y: 0, opacity: 1, rotation: 0, scale: 1, duration: 0.42, ease: 'back.out(2.6)', stagger: 0.08 }, t4 + 0.4);
  if (subEl) timeline.fromTo(subEl, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36, ease: 'power3.out' }, t4 + 0.72);
  at(t4 + 0.42, () => play('stack', { volume: 0.6 }));
  timeline.to({}, { duration: 0.5 }, t4 + 1.4);

  // ── 아이템이 캐릭터에 붙는 자리
  function stageHero(time) {
    const anchor = look.anchor || 'beside';
    const key = look.hero;
    const size = c.size;
    const heroScale = look.heroSize || 1;
    if (anchor === 'head' && key) {
      // 왕관 — 빛 속에서 내려와 머리에 앉는다
      const px = size * 0.3 * heroScale;
      const el = prop(key, px, { x: c.x, y: headTop() + px * 0.22 }, 'is-front');
      timeline.fromTo(el, { y: -H * 0.42, rotation: -18, opacity: 0, filter: 'brightness(2.4) blur(5px)' }, { y: 0, rotation: -5, opacity: 1, filter: 'brightness(1) blur(0px)', duration: quick ? 0.3 : 0.95, ease: 'power3.out' }, time + 0.3);
      timeline.to(el, { y: 6, duration: 0.1, yoyo: true, repeat: 1, ease: 'sine.inOut' }, time + 1.25);
      timeline.to(meFig.el, { scaleY: 0.96, duration: 0.1, yoyo: true, repeat: 1, ease: 'sine.inOut' }, time + 1.25);
      at(time + 1.25, () => play('glass', { volume: 0.6 }));
      if (!quick) twinkle([{ x: c.x - px * 0.6, y: headTop() - px * 0.1 }, { x: c.x + px * 0.62, y: headTop() + px * 0.05 }], time + 1.25, size * 0.1);
      shine(el, time + 1.3);
    } else if (anchor === 'feet' && key) {
      // 발밑 꽃밭 — 뒤 둘 · 앞 셋이 차례로 돋아 활짝 핀다(앞은 화면 아래로 조금 잘려 땅에서 자란 것처럼)
      const blooms = [key, ...(look.sprites || [])];
      const layout = [[-0.46, 0.02, 0.44, 'is-back'], [0.46, 0.03, 0.42, 'is-back'], [-0.26, 0.1, 0.36, 'is-front'], [0.28, 0.11, 0.36, 'is-front'], [0.02, 0.14, 0.3, 'is-front']];
      layout.forEach(([dx, dy, scale, layerName], index) => {
        const px = size * scale * (index < 2 ? heroScale : 1);
        const el = prop(blooms[index % blooms.length], px, { x: c.x + dx * size, y: c.feet + dy * size - px * 0.4 }, layerName);
        gsap.set(el, { transformOrigin: '50% 92%' });
        const lean = dx < -0.1 ? -1 : dx > 0.1 ? 1 : 0;
        timeline.fromTo(el, { scale: 0, rotation: lean * 30, opacity: 0 }, { scale: 1, rotation: lean * 8, opacity: 1, duration: quick ? 0.3 : 0.75, ease: 'back.out(1.7)' }, time + 0.12 + index * 0.09);
        loop(time + 1.1, () => gsap.to(el, { rotation: `+=${lean ? -lean * 4 : 3}`, duration: rand(2, 2.7), ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      });
      at(time + 0.15, () => play('pluck', { rate: 1.26, volume: 0.45 }));
      at(time + 0.4, () => play('pluck', { rate: 1.5, volume: 0.4 }));
    } else if (anchor === 'beside' && key) {
      // 옆 — 위에서 떨어져 쿵 앉는다(운 상대 반대쪽)
      const px = size * 0.46 * heroScale;
      // 화면 안에 — 휴대폰에서는 큰 캐릭터 옆이라 소품이 가장자리 밖으로 잘렸다(11-24)
      const x = Math.min(W - px * 0.52, Math.max(px * 0.52, c.x - side * size * (wide ? 0.52 : 0.38)));
      const el = prop(key, px, { x, y: c.feet - px * 0.47 }, 'is-front');
      gsap.set(el, { transformOrigin: '50% 100%' });
      const ground = h('i.v-shadow');
      stage.insertBefore(ground, el);
      gsap.set(ground, { left: x - px * 0.42, top: c.feet - px * 0.08, width: px * 0.84, height: px * 0.16, opacity: 0 });
      timeline.fromTo(el, { y: -H * 0.55, rotation: side * -14, opacity: 1 }, { y: 0, rotation: side * -4, duration: quick ? 0.3 : 0.55, ease: 'power3.in', immediateRender: false }, time + 0.25);
      timeline.to(ground, { opacity: 1, duration: 0.4 }, time + 0.45);
      timeline.to(el, { scaleY: 0.86, scaleX: 1.1, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' }, time + 0.8);
      at(time + 0.8, () => play('drop', { volume: 0.85 }));
      if (!quick) twinkle([{ x: x - px * 0.45, y: c.feet - px * 0.2 }, { x: x + px * 0.42, y: c.feet - px * 0.55 }], time + 0.82, size * 0.1);
      shine(el, time + 1.05);
    } else if (anchor === 'behind' && key) {
      // 뒤 — 지평선에서 떠올라 캐릭터 뒤를 받친다(해 · 달 · 별은 머리 뒤 후광처럼, 고래는 더 높이 — lift)
      const px = size * 0.98 * heroScale;
      const y = headTop() + size * 0.06 - (look.lift || 0) * size;
      const el = prop(key, px, { x: c.x, y }, 'is-behind');
      const halo = h('i.v-glow');
      stage.insertBefore(halo, el);
      const haloPx = px * 1.7;
      gsap.set(halo, { width: haloPx, height: haloPx, left: c.x - haloPx / 2, top: y - haloPx / 2, opacity: 0 });
      timeline.fromTo(el, { y: size * 0.55, opacity: 0, scale: 0.86 }, { y: 0, opacity: 1, scale: 1, duration: quick ? 0.3 : 1.3, ease: 'power2.out' }, time);
      timeline.to(halo, { opacity: 1, duration: 1, ease: 'power2.out' }, time + 0.3);
      loop(time + 1.3, () => gsap.to(el, { y: -8, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    } else if (anchor === 'sky') {
      // 하늘 — 풍선이 캐릭터 뒤에서 하나씩 떠올라 하늘로
      const keys = [key, ...(look.sprites || [])].filter(Boolean);
      for (let index = 0; index < 4; index += 1) {
        const px = size * rand(0.3, 0.4);
        const x = c.x + size * [-0.55, 0.5, -0.2, 0.25][index] + rand(-20, 20);
        const el = prop(keys[index % keys.length], px, { x, y: c.feet - size * rand(0.3, 0.55) }, index % 2 ? 'is-back' : 'is-behind');
        timeline.fromTo(el, { y: size * 0.2, opacity: 0, scale: 0.4 }, { y: -H * rand(0.45, 0.62), opacity: 1, scale: 1, rotation: rand(-12, 12), duration: rand(2.6, 3.2), ease: 'power1.out' }, time + index * 0.22);
        loop(time + 1, () => gsap.to(el, { x: `+=${rand(-14, 14)}`, duration: rand(1.4, 1.9), ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      }
      at(time + 0.1, () => play('pluck', { rate: 1.6, volume: 0.4 }));
    } else if (anchor === 'frame' && key) {
      // 위 모서리 — 꽃가지 둘이 양쪽 위에서 드리운다
      const px = Math.min(W * (wide ? 0.42 : 0.72), H * 0.62) * heroScale;
      [-1, 1].forEach((dir, index) => {
        const el = prop(key, px, { x: dir < 0 ? px * 0.34 : W - px * 0.34, y: px * 0.18 }, 'is-near-soft');
        gsap.set(el, { scaleX: dir < 0 ? 1 : -1, transformOrigin: '50% 0%' });
        timeline.fromTo(el, { x: dir * px * 0.5, y: -px * 0.45, rotation: 14, opacity: 0 }, { x: 0, y: 0, rotation: -4, opacity: 1, duration: quick ? 0.3 : 1, ease: 'power3.out' }, time + index * 0.12);
        loop(time + 1.2, () => gsap.to(el, { rotation: '+=3', duration: rand(2.2, 2.8), ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      });
    }
  }

  // ── 분위기 — 아이템이 고른 하나(작은 것이 떼로 번지지 않게 크게 몇 개만)
  function ambient(time) {
    if (quick) return;
    const kind = look.ambient;
    if (kind === 'petals') {
      const keys = petalKeys.length ? petalKeys : ['rose-petal-1', 'rose-petal-2'];
      for (let index = 0; index < 5; index += 1) {
        const near = index % 3 === 0;
        const px = (near ? c.size * 0.2 : c.size * 0.11) * rand(0.85, 1.15);
        const el = prop(keys[index % keys.length], px, { x: W * rand(0.06, 0.94), y: -px }, near ? 'is-near' : 'is-back');
        const start = time + index * 0.42;
        timeline.fromTo(el, { opacity: 0.95, rotation: rand(-60, 60) }, { y: H + px * 2, x: `+=${rand(-W * 0.12, W * 0.12)}`, rotation: `+=${rand(-200, 200)}`, duration: rand(4.2, 5.4), ease: 'none', immediateRender: false }, start);
      }
    } else if (kind === 'cannons') {
      const keys = look.sprites?.length ? look.sprites : ['confetti'];
      [[0.05, -64], [0.95, -116]].forEach(([ratio, angle], sideIndex) => {
        for (let index = 0; index < 2; index += 1) {
          const el = prop(keys[(index + sideIndex) % keys.length], rand(100, 140), { x: W * ratio, y: H * 1.03 }, 'is-near-soft');
          const fire = time + 0.1 + index * 0.22 + sideIndex * 0.08;
          timeline.set(el, { opacity: 1 }, fire);
          timeline.to(el, { physics2D: { velocity: rand(860, 1020), angle: angle + rand(-8, 8), gravity: 980 }, rotation: rand(-200, 200), duration: 2.1, ease: 'none' }, fire);
          timeline.to(el, { opacity: 0, duration: 0.4 }, time + 1.9 + index * 0.1);
        }
      });
      at(time + 0.1, () => play('chips', { volume: 0.55 }));
    } else if (kind === 'fireworks') {
      (look.fireworks || ['fireworks-1', 'fireworks-2']).forEach((key, index) => {
        const px = Math.min(560, W * (wide ? 0.4 : 0.8));
        const el = h('img.v-firework', { src: scene(key), alt: '' });
        const x = W * (index % 2 ? rand(0.68, 0.86) : rand(0.14, 0.32));
        const y = H * rand(0.12, 0.3);
        Object.assign(el.style, { width: `${px}px`, height: `${px * 0.6}px`, left: `${x - px / 2}px`, top: `${y - px * 0.3}px` });
        stage.insertBefore(el, rays);
        gsap.set(el, { opacity: 0 });
        const start = time + index * 0.5;
        timeline.fromTo(el, { scale: 0.3, opacity: 0 }, { scale: 1.12, opacity: 1, duration: 0.6, ease: 'power3.out' }, start);
        timeline.to(el, { opacity: 0, scale: 1.25, duration: 0.9, ease: 'power1.in' }, start + 0.8);
        at(start, () => play('pluck', { rate: rand(1.4, 2), volume: 0.4 }));
      });
    } else if (kind === 'bubbles') {
      for (let index = 0; index < 4; index += 1) {
        const px = c.size * rand(0.12, 0.2);
        const el = prop('soap-bubble', px, { x: W * rand(0.12, 0.88), y: H + px }, index % 2 ? 'is-near-soft' : 'is-back');
        timeline.fromTo(el, { opacity: 0.9 }, { y: -H * rand(0.7, 1), x: `+=${rand(-60, 60)}`, duration: rand(3.6, 4.6), ease: 'sine.out', immediateRender: false }, time + index * 0.35);
      }
    } else if (kind === 'sparkles') {
      for (let round = 0; round < 3; round += 1) {
        twinkle([{ x: c.x + c.size * rand(-0.7, -0.35), y: c.feet - c.size * rand(0.3, 0.9) }, { x: c.x + c.size * rand(0.35, 0.7), y: c.feet - c.size * rand(0.3, 0.9) }], time + round * 0.7, c.size * 0.11);
      }
    }
  }

  const finish = () => {
    loops.forEach((tween) => tween.kill());
    gsap.killTweensOf(stage.querySelectorAll('*'));
    stage.remove();
    seats.forEach((el) => gsap.set(el, { opacity: 1 }));
  };
  return { timeline, scene: stage, finish };
}
