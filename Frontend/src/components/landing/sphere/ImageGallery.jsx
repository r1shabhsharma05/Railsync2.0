import { useEffect, useMemo, useRef, useState } from "react";
import {
  SPHERE,
  sphereLayout,
  spiralLayout,
  spiralReach,
} from "./layouts";
import { rotate, useGalleryMotion } from "./useGalleryMotion";
import "./gallery.css";

/**
 * How each arrangement is framed: `spread` is its radius as a multiple of the
 * sphere's, `camera` its viewing distance as a multiple of that radius.
 *
 * The sphere's 3.27 is measured (11.97 / 3.658) and gives the gentle,
 * almost-flat perspective the reference has. The helix wants the camera much
 * closer, and a tighter radius — at the sphere's radius it fills the width of
 * the screen and only a third of a turn is on screen at once, which reads as a
 * band of images rather than a thread. Narrow it and several turns fit, and it
 * reads as what it is.
 *
 * Spread is capped so the ball fits its hero column: at spread 1 the sphere
 * needs ~1070px across but the column is ~690px at desktop, so the surface
 * clipped the outer cards. These values keep every card inside the column
 * at 1366px without shrinking the cards (their text is sized for 112px).
 * Below that the column narrows but the spread did not, so cards clipped
 * under ~1240px — the fit scale below shrinks the spread to whatever the
 * measured surface actually fits, and never grows it past these values.
 */
const FRAME = {
  sphere: {
    vertical: { spread: 0.56, camera: SPHERE.cameraPerRadius },
    horizontal: { spread: 0.56, camera: SPHERE.cameraPerRadius },
  },
  spiral: {
    vertical: { spread: 0.48, camera: 1.95 },
    horizontal: { spread: 0.5, camera: 2.0 },
  },
};

/** Seen very slightly from above, so the arrangement reads as a solid rather
 * than a flat disc edge-on. */
const RESTING_PITCH = -11;

/** Arrow-key step, in degrees — the keyboard way to orbit the ball. */
const KEY_STEP = 6;

/**
 * Items arranged on a sphere or an endless helix — drag to orbit, wheel to
 * roll the ball or drive the screw.
 *
 * Ported logic-verbatim from website-to-code episode 002 (ImageGallery.tsx);
 * the only changes are the item content and the selection/keyboard additions
 * RailSync needs:
 * - `items` are `{ id, node }` cards instead of image URLs — the layout and
 *   motion maths are untouched, only what a billboard shows changed.
 * - `preloadImages` keeps the original's decode fix for any photo a card
 *   carries: Chrome defers decoding images whose transform changes every
 *   frame, so they are decoded up front.
 * - Clicking a card (a tap, not a drag) calls `onSelect(id)`; arrow keys
 *   orbit the ball, so the sphere works without dragging at all.
 * - A live region announces the selected card.
 *
 * There is no WebGL here. Both references billboard their images, meaning
 * every plane always faces the camera and never turns, and that is exactly
 * what a plain `translate3d` under a CSS `perspective` gives you for free.
 */
export function ImageGallery({
  items,
  mode = "sphere",
  axis = "vertical",
  imageHeight = 132,
  ratio = 0.75,
  depthFade = 0.18,
  preloadImages = [],
  onSelect,
  className,
  ...motionOptions
}) {
  const { surface, motion, dragging } = useGalleryMotion(mode, motionOptions);
  const itemEls = useRef([]);
  const stage = useRef(null);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const downAt = useRef(null);
  const n = items.length;

  const radius = imageHeight * SPHERE.radiusPerImageHeight;

  // Fit scale: how much of the tuned spread the measured surface fits.
  // The sphere is the widest arrangement (spread 0.56 beats the spiral's
  // 0.48/0.5, and the helix's half-height is under the sphere radius), so
  // fitting against it covers both modes. Read by the draw loop every frame
  // through a ref, so a resize never forces a re-render.
  const fitRef = useRef(1);
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const halfCardW = (imageHeight * ratio) / 2 + 8;
      const halfCardH = imageHeight / 2 + 8;
      const fitW = (w / 2 - halfCardW) / (radius * FRAME.sphere.vertical.spread);
      const fitH = (h / 2 - halfCardH) / (radius * FRAME.sphere.vertical.spread);
      fitRef.current = Math.max(0.2, Math.min(1, fitW, fitH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [surface, radius, imageHeight, ratio]);

  // The sphere is relaxed once and then never changes. Only the helix moves
  // under its own power, so only it is rebuilt per frame.
  const staticLayouts = useMemo(() => ({ sphere: sphereLayout(n) }), [n]);

  /**
   * Decode every photo before showing any of it.
   *
   * Left to itself the browser decodes lazily, and for images whose transform
   * changes every frame it will keep deferring the decode indefinitely — the
   * picture never appears. Awaiting decode() puts the bitmap in the cache up
   * front, which both fixes that and stops the gallery popping in image by
   * image.
   */
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    Promise.all(
      preloadImages.map((src) => {
        const img = new Image();
        img.src = src;
        return img.decode().catch(() => undefined);
      }),
    ).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [preloadImages]);

  useEffect(() => {
    let raf = 0;
    const reach = spiralReach(n);

    const layoutFor = (m, travel) =>
      m === "spiral" ? spiralLayout(n, travel, axis) : staticLayouts[m];

    const draw = () => {
      const s = motion.current;
      const from = layoutFor(s.from, s.travel);
      const to = layoutFor(s.mode, s.travel);
      // Ease the morph so arrangements settle rather than arrive.
      const t = s.morph >= 1 ? 1 : 1 - Math.pow(1 - s.morph, 3);
      const a = FRAME[s.from][axis];
      const b = FRAME[s.mode][axis];
      const spread =
        (a.spread + (b.spread - a.spread) * t) * fitRef.current;
      const cam = a.camera + (b.camera - a.camera) * t;
      if (stage.current) {
        stage.current.style.perspective = `${(radius * spread * cam).toFixed(0)}px`;
      }

      for (let i = 0; i < n; i++) {
        const el = itemEls.current[i];
        if (!el) continue;

        const a = from[i];
        const b = to[i];
        const unit = {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          z: a.z + (b.z - a.z) * t,
        };

        const p = rotate(
          {
            x: unit.x * radius * spread,
            y: unit.y * radius * spread,
            z: unit.z * radius * spread,
          },
          s.yaw,
          s.pitch + RESTING_PITCH,
          s.roll,
        );

        // Depth is carried by perspective scale and by the images covering
        // each other. Opacity only takes the very back edge off.
        const depth = (p.z / (radius * spread) + 1) / 2;
        let opacity = 1 - depthFade * (1 - depth);

        // Fade the ends of the helix so the wrap is never seen.
        if (t > 0.5 && s.mode === "spiral") {
          // Only bite once an image is already leaving the frame, so the
          // wrap is hidden without dimming anything you can actually see.
          const along = axis === "vertical" ? unit.y : unit.x;
          const edge = Math.abs(along) / reach;
          if (edge > 0.86) opacity *= Math.max(0, 1 - (edge - 0.86) / 0.14);
        }

        el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, ${p.z.toFixed(2)}px)`;
        el.style.opacity = opacity.toFixed(3);
        // Standing in for preserve-3d: nearer images paint over farther ones.
        el.style.zIndex = String(2000 + Math.round(p.z));
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [n, radius, depthFade, staticLayouts, motion, axis]);

  // Arrow keys orbit the ball — the no-drag way to move it.
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const onKey = (e) => {
      const m = motion.current;
      if (e.key === "ArrowLeft") { m.yaw -= KEY_STEP; e.preventDefault(); }
      else if (e.key === "ArrowRight") { m.yaw += KEY_STEP; e.preventDefault(); }
      else if (e.key === "ArrowUp") { m.pitch -= KEY_STEP; e.preventDefault(); }
      else if (e.key === "ArrowDown") { m.pitch += KEY_STEP; e.preventDefault(); }
      else return;
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [motion]);

  // Tap (not drag) on a card selects it. The surface captures the pointer
  // on pointerdown, so a card's own pointerup never fires — the tap is
  // detected here, on the surface, and hit-tested to the card under it.
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const down = (e) => {
      downAt.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    };
    const up = (e) => {
      const d = downAt.current;
      downAt.current = null;
      if (!d) return;
      const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
      if (moved >= 6 || Date.now() - d.t >= 400) return;
      const hit = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest?.(".ig-item");
      const id = hit?.getAttribute("data-item-id");
      if (id) select(id);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  }, [surface]);

  const select = (id) => {
    setSelectedId(id);
    if (onSelect) onSelect(id);
  };

  const selectedItem = items.find((it) => it.id === selectedId);

  return (
    <div
      ref={surface}
      className={["ig-surface", ready && "is-ready", dragging && "is-dragging", className]
        .filter(Boolean)
        .join(" ")}
      role="group"
      tabIndex={0}
      aria-label={`${n} cards arranged as a ${mode}. Drag to rotate, or use arrow keys.`}
    >
      <div className="ig-stage" ref={stage}>
        {items.map((item, i) => (
          <figure
            key={item.id}
            className="ig-item"
            data-item-id={item.id}
            ref={(el) => {
              itemEls.current[i] = el;
            }}
            style={{ width: imageHeight * ratio, height: imageHeight }}
          >
            {item.node}
          </figure>
        ))}
      </div>
      <div className="ig-live" aria-live="polite">
        {selectedItem ? selectedItem.announce : ""}
      </div>
    </div>
  );
}
