// 연출 순서표 — 카드 이동 → 효과 → 원카드 → 다음 차례가 차례대로 돈다.
// 시즌 1은 효과마다 setTimeout 을 걸어 다음 수가 앞 효과를 지우거나(원카드 안내가 빠짐) 겹쳤다.
import gsap from 'gsap';
import { settings } from './settings.js';

export function createDirector() {
  let chain = Promise.resolve();
  let generation = 0;
  const live = new Set();

  const director = {
    // 순서대로 돌릴 일 하나를 줄 세운다
    run(task) {
      const myGeneration = generation;
      const next = chain.then(async () => {
        if (myGeneration !== generation) return undefined;
        return task();
      }).catch((error) => { console.error(error); });
      chain = next;
      return next;
    },
    // GSAP 타임라인을 만들고, 화면을 누르면 끝으로 건너뛸 수 있게 기억해 둔다
    timeline(options = {}) {
      const timeline = gsap.timeline({ ...options, onComplete: () => { live.delete(timeline); options.onComplete?.(); } });
      live.add(timeline);
      return timeline;
    },
    skip() {
      live.forEach((timeline) => timeline.progress(1));
    },
    busy() {
      return live.size > 0;
    },
    idle() {
      return chain;
    },
    reset() {
      generation += 1;
      live.forEach((timeline) => timeline.kill());
      live.clear();
      chain = Promise.resolve();
    },
  };
  return director;
}

export function applySpeed() {
  gsap.globalTimeline.timeScale(Number(settings.get().speed) || 1);
}
settings.subscribe(applySpeed);
