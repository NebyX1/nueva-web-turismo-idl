export type JourneyMode = 'day' | 'night';
export type CurtainStage = 'idle' | 'closing' | 'presenting' | 'opening';

export const CURTAIN_TIMINGS = { close: 650, hold: 900, open: 750 } as const;
export const REDUCED_CURTAIN_TIMINGS = { close: 120, hold: 180, open: 120 } as const;

export interface JourneyTransitionScheduler {
  setTimeout(callback: () => void, delay: number): unknown;
  clearTimeout(handle: unknown): void;
}

interface TransitionOptions {
  onStage(stage: CurtainStage, targetMode: JourneyMode): void;
  applyMode(mode: JourneyMode): void;
  onSettled?(): void;
  onError?(error: unknown): void;
  /** Injectable clock keeps lifecycle and interruption tests deterministic. */
  scheduler?: JourneyTransitionScheduler;
}

const browserScheduler: JourneyTransitionScheduler = {
  setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimeout: handle => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Change the scenery only while the curtain is fully closed. This controller
 * owns temporary transition state, never the user's persistent pause choice.
 */
export function createJourneyModeTransition(options: TransitionOptions) {
  const scheduler = options.scheduler ?? browserScheduler;
  const timers = new Set<unknown>();
  let busy = false, disposed = false, generation = 0;

  function clearTimers() {
    timers.forEach(handle => scheduler.clearTimeout(handle));
    timers.clear();
  }
  function current(run: number) { return !disposed && busy && generation === run; }
  function later(delay: number, run: number, callback: () => void) {
    let handle: unknown;
    handle = scheduler.setTimeout(() => {
      timers.delete(handle);
      if (current(run)) callback();
    }, delay);
    timers.add(handle);
  }
  function settle(mode: JourneyMode, error?: { value: unknown }) {
    clearTimers(); busy = false;
    const settledGeneration = ++generation;
    // A failing renderer must still reveal the page and release interaction.
    try { options.onStage('idle', mode); }
    finally {
      if (!disposed && !busy && generation === settledGeneration) options.onSettled?.();
      if (error) options.onError?.(error.value);
    }
  }
  function guarded(mode: JourneyMode, run: number, callback: () => void) {
    try { callback(); }
    catch (error) { if (current(run)) settle(mode, { value: error }); }
  }

  return {
    get busy() { return busy; },
    start(mode: JourneyMode, reducedMotion = false): boolean {
      // The ref-like guard is synchronous, including two clicks in one frame.
      if (disposed || busy) return false;
      busy = true;
      const run = ++generation, timing = reducedMotion ? REDUCED_CURTAIN_TIMINGS : CURTAIN_TIMINGS;
      guarded(mode, run, () => {
        options.onStage('closing', mode);
        if (!current(run)) return;
        later(timing.close, run, () => guarded(mode, run, () => {
          options.onStage('presenting', mode);
          if (!current(run)) return;
          options.applyMode(mode);
          if (!current(run)) return;
          later(timing.hold, run, () => guarded(mode, run, () => {
            options.onStage('opening', mode);
            if (current(run)) later(timing.open, run, () => settle(mode));
          }));
        }));
      });
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true; busy = false; generation++;
      clearTimers();
      // No stage callbacks here: the React owner may already be unmounted.
    },
  };
}
