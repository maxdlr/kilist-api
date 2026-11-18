import { NEWS_LOOP_MS } from "../helpers";
import dispatchDueNews from "./dispatchDueNews";

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

const tick = async () => {
  if (running) return;
  running = true;
  try {
    await dispatchDueNews();
  } catch (error) {
    console.error("News loop failed", (error as Error)?.message ?? error);
  } finally {
    running = false;
  }
};

const startNewsLoop = () => {
  if (timer) return;
  timer = setInterval(tick, NEWS_LOOP_MS);
  timer.unref?.();
  tick();
};

export default startNewsLoop;
