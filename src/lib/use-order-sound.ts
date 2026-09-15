import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "shellsea_admin_sound_enabled";

/** Synthesizes a short, elegant two-note "bell/ding" via the Web Audio API —
 * no audio file needed, works the same everywhere. */
function playBellSound() {
  if (typeof window === "undefined") return;
  const AudioContextCtor =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const ctx = new AudioContextCtor();
  const now = ctx.currentTime;

  const playNote = (frequency: number, start: number, duration: number, gain: number) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + start);
    gainNode.gain.setValueAtTime(0, now + start);
    gainNode.gain.linearRampToValueAtTime(gain, now + start + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(now + start);
    oscillator.stop(now + start + duration + 0.05);
  };

  playNote(987.77, 0, 0.55, 0.22); // B5
  playNote(1318.51, 0.09, 0.65, 0.18); // E6

  window.setTimeout(() => void ctx.close(), 900);
}

/** Admin's "new order" sound alert, with an on/off toggle persisted to
 * localStorage (defaults to on). */
export function useOrderSound() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setEnabled(stored === "1");
    } catch {
      // localStorage unavailable — keep the default.
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
    playBellSound();
  }, []);

  const playIfEnabled = useCallback(() => {
    if (enabled) playBellSound();
  }, [enabled]);

  const seenIds = useRef<Set<string> | null>(null);

  /** Call on every poll with the current list of pending/paid order ids.
   * Plays the alert only for ids that weren't present on the previous call
   * (the very first call just primes the baseline — no sound on page load). */
  const notifyIfNewOrders = useCallback(
    (currentIds: readonly string[]) => {
      const current = new Set(currentIds);
      if (seenIds.current) {
        const hasNew = currentIds.some((id) => !seenIds.current?.has(id));
        if (hasNew) playIfEnabled();
      }
      seenIds.current = current;
    },
    [playIfEnabled],
  );

  return { enabled, toggle, notifyIfNewOrders };
}
