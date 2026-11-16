import { useCallback, useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Owns every moving number in the gallery, on one rAF loop.
 *
 * Drag always orbits. What the wheel does depends on the arrangement: on the
 * sphere it rolls the whole ball around the view axis, on the helix it drives
 * you along the thread like a screw. That is the only place the two modes
 * differ — everything else is the same motion.
 *
 * Values are exposed through a ref rather than state: the gallery writes
 * transforms straight to the DOM each frame, so re-rendering 30 React
 * components 60 times a second would be pure waste.
 *
 * Ported logic-verbatim from website-to-code episode 002 (useGalleryMotion.ts).
 */
export function useGalleryMotion(
  mode,
  {
    dragSpeed = 0.32,
    wheelSpin = 0.0122,
    wheelTravel = 0.9,
    idleSpin = 3.2,
    friction = 0.94,
  } = {},
) {
  const surface = useRef(null);
  const motion = useRef({
    yaw: 0,
    pitch: 0,
    roll: 0,
    travel: 0,
    morph: 1,
    from: mode,
    mode,
    dragging: false,
  });

  const vel = useRef({ yaw: 0, pitch: 0, roll: 0, travel: 0 });
  const drag = useRef(null);
  const lastTouch = useRef(0);
  const [dragging, setDragging] = useState(false);
  const reduced = useRef(prefersReducedMotion());

  // Start a morph whenever the requested arrangement changes.
  useEffect(() => {
    const m = motion.current;
    if (m.mode === mode) return;
    m.from = m.mode;
    m.mode = mode;
    m.morph = 0;
  }, [mode]);

  const step = useCallback(
    (dt) => {
      const m = motion.current;
      const v = vel.current;
      const f = Math.pow(friction, dt / (1000 / 60));

      if (!m.dragging) {
        m.yaw += v.yaw;
        m.pitch += v.pitch;
        m.roll += v.roll;
        m.travel += v.travel;
        v.yaw *= f;
        v.pitch *= f;
        v.roll *= f;
        v.travel *= f;

        const idle = Date.now() - lastTouch.current > 1600;
        if (idle && !reduced.current) m.yaw += (idleSpin * dt) / 1000;
      }

      // Keep the ball from tipping past its poles.
      m.pitch = Math.max(-72, Math.min(72, m.pitch));

      if (m.morph < 1) {
        m.morph = Math.min(1, m.morph + dt / 900);
      }
    },
    [friction, idleSpin],
  );

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      step(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [step]);

  // Pointer drag — orbit, with the release momentum carried over.
  useEffect(() => {
    const el = surface.current;
    if (!el) return;

    const down = (e) => {
      if (!e.isPrimary) return;
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      motion.current.dragging = true;
      vel.current.yaw = 0;
      vel.current.pitch = 0;
      lastTouch.current = Date.now();
      setDragging(true);
      el.setPointerCapture(e.pointerId);
    };

    const move = (e) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      const dx = (e.clientX - d.x) * dragSpeed;
      const dy = (e.clientY - d.y) * dragSpeed;
      d.x = e.clientX;
      d.y = e.clientY;
      motion.current.yaw += dx;
      motion.current.pitch += dy;
      // Remember the last movement so releasing lets it coast.
      vel.current.yaw = dx;
      vel.current.pitch = dy;
      lastTouch.current = Date.now();
    };

    const up = (e) => {
      if (!drag.current || e.pointerId !== drag.current.id) return;
      drag.current = null;
      motion.current.dragging = false;
      lastTouch.current = Date.now();
      setDragging(false);
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [dragSpeed]);

  // Wheel — meaning depends on the arrangement.
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const d = e.deltaY;
      lastTouch.current = Date.now();
      if (motion.current.mode === "spiral") {
        const t = (d / 100) * wheelTravel;
        motion.current.travel += t;
        vel.current.travel = t * 0.35;
      } else {
        const r = d * wheelSpin;
        motion.current.roll += r;
        vel.current.roll = r * 0.35;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [wheelSpin, wheelTravel]);

  return { surface, motion, dragging };
}

/** Rotates a point by yaw (Y), pitch (X) and roll (Z), in that order. */
export function rotate(p, yawDeg, pitchDeg, rollDeg) {
  const R = Math.PI / 180;
  const cy = Math.cos(yawDeg * R), sy = Math.sin(yawDeg * R);
  const cp = Math.cos(pitchDeg * R), sp = Math.sin(pitchDeg * R);
  const cr = Math.cos(rollDeg * R), sr = Math.sin(rollDeg * R);

  // yaw about Y
  let x = p.x * cy + p.z * sy;
  let z = -p.x * sy + p.z * cy;
  let y = p.y;
  // pitch about X
  const y2 = y * cp - z * sp;
  z = y * sp + z * cp;
  y = y2;
  // roll about Z (the view axis) — this is what the wheel drives
  const x2 = x * cr - y * sr;
  y = x * sr + y * cr;
  x = x2;

  return { x, y, z };
}
