import React, { useEffect, useRef } from 'react';

/**
 * Sakura Sunset Railway — the hero's world, used as given (the scene code
 * is ported verbatim from "Sakura Sunset Railway V1", a single-file 3D
 * particle scene: sunset sky, blossom avenue, a train that rolls in,
 * passes by and dissolves, petals falling in 3D — custom perspective
 * projection and z-buffer into a 2D canvas pixel buffer).
 *
 * Landing adaptations only: the scene fills the hero instead of a 5:4
 * window, the frame loop pauses while the hero is off screen or the tab
 * is hidden (a background that runs forever is a battery tax), and the
 * "Assembling the sunset…" pill is rendered by the hero and faded from
 * here, exactly as the original fades it. The scene's own quality
 * governor, mobile caps and prefers-reduced-motion path are untouched.
 */
export default function SakuraScene({ hintRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const hint = hintRef?.current;
    let raf = 0;
    let running = false;
    let disposed = false;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = matchMedia('(pointer:coarse)').matches || innerWidth < 700;
    const rnd = Math.random, TAU = Math.PI*2, D2R = Math.PI/180, clamp = (v,a,b) => v < a ? a : v > b ? b : v;
    const css = getComputedStyle(document.documentElement), tok = n => css.getPropertyValue(n).trim();
    const G = {sun:tok('--sun'),sun0:tok('--sun0'),lamp:tok('--lamp'),lamp0:tok('--lamp0'),sig:tok('--signal'),sig0:tok('--signal0'),base:tok('--base'),ut:tok('--under-top'),uh:tok('--under-hor'),ul:tok('--under-low')};
    const hx3 = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16));
    const sc = small ? .5 : 1;                         // density scale for phones

    /* ---------- helpers ---------- */
    const mix = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
    const col = (r,g,b,j=.15) => { const m = 1 + (rnd()-.5)*2*j; return 0xFF000000 | ((clamp(b*m,0,255)|0)<<16) | ((clamp(g*m,0,255)|0)<<8) | (clamp(r*m,0,255)|0); };
    const colA = (c,j) => col(c[0],c[1],c[2],j);
    const zi = (a,b) => 1/(1/a - rnd()*(1/a-1/b));      // uniform in inverse depth: even coverage on screen
    const gauss = () => (rnd()+rnd()+rnd()-1.5)/1.5;
    const nrm = v => { const l = Math.hypot(v[0],v[1],v[2]); return [v[0]/l,v[1]/l,v[2]/l]; };

    /* ---------- scene particles (static) ---------- */
    const MAXP = 420000, X=new Float32Array(MAXP), Y=new Float32Array(MAXP), Z=new Float32Array(MAXP), R=new Float32Array(MAXP), PH=new Float32Array(MAXP), C=new Uint32Array(MAXP), FL=new Uint8Array(MAXP);
    let n = 0;
    const add = (x,y,z,r,c,fl=0) => { if (n < MAXP) { X[n]=x; Y[n]=y; Z[n]=z; R[n]=r; C[n]=c; PH[n]=rnd(); FL[n]=fl; n++; } };
    /* train particles live in train space and are moved every frame */
    const MAXT = 48000, TX=new Float32Array(MAXT), TY=new Float32Array(MAXT), TZ=new Float32Array(MAXT), TR=new Float32Array(MAXT), TC=new Uint32Array(MAXT), TP=new Float32Array(MAXT);
    let nt = 0;
    const tadd = (x,y,z,r,c) => { if (nt < MAXT) { TX[nt]=x; TY[nt]=y; TZ[nt]=z; TR[nt]=r; TC[nt]=c; TP[nt]=rnd(); nt++; } };

    /* sky: dome of particles, gradient + clouds + sun */
    const SUN = nrm([-.18,.23,1]), ST = small ? .5 : .26, SR = 450*ST*D2R*.44;
    const GR = [[0,[255,176,98]],[.12,[255,150,120]],[.3,[236,148,182]],[.6,[178,140,206]],[1,[112,112,192]]];
    const grad = t => { for (let i = 1; i < GR.length; i++) if (t <= GR[i][0]) return mix(GR[i-1][1], GR[i][1], (t-GR[i-1][0])/(GR[i][0]-GR[i-1][0])); return GR[4][1]; };
    for (let el = 0; el < 40; el += ST) for (let az = -46; az < 46; az += ST) {
      const a = (az + rnd()*ST)*D2R, e = (el + rnd()*ST)*D2R, ce = Math.cos(e), d = [Math.sin(a)*ce, Math.sin(e), Math.cos(a)*ce];
      const ang = Math.acos(clamp(d[0]*SUN[0]+d[1]*SUN[1]+d[2]*SUN[2], -1, 1));
      let c = mix(grad(el/45), [255,228,170], Math.exp(-ang*ang/.06)*.8);
      const cl = Math.sin(az*.11+1.3)*Math.cos(el*.26) + .55*Math.sin(az*.29-el*.17+2) + .3*Math.sin(az*.7+el*.5), cm = clamp((cl-.3)*2.2, 0, 1)*clamp((34-el)/10, 0, 1)*clamp((el-1)/3, 0, 1);   // soft cloud field
      if (cm > 0) c = mix(c, mix([150,76,128],[255,192,142],clamp(cl*.7 + ang*.6 + .2, 0, 1)), cm*.92);
      if (ang < .04) c = [255,250,225];
      add(d[0]*450, d[1]*450, d[2]*450, SR, colA(c,.05), ang < .04 ? 1 : 0);
    }
    for (let az = -30; az < 50; az += ST) { const top = 1 + 1.7*Math.sin(az*.09+.5) + .8*Math.sin(az*.33);   // distant hills
      for (let el = -1; el < top; el += ST) { const a = az*D2R, e = (el+rnd()*ST)*D2R;
        add(Math.sin(a)*420*Math.cos(e), Math.sin(e)*420, Math.cos(a)*420*Math.cos(e), SR*.9, colA(mix([58,64,98],[150,105,140],clamp(el/(top+1),0,1)),.1)); } }

    /* ground: ballast between the tracks, grass bank right, bushes left */
    const TXC = -3.4, CAM_X = .25;
    for (let i = 0, N = Math.round(48000*sc); i < N; i++) {
      const z = zi(1.8,260), half = Math.min(18, .72*z+2), x = clamp(CAM_X + (rnd()*2-1)*half, -17, 19);
      const c = x > -5.6 && x < 2.3 ? (rnd() < .04 ? col(236,138,172,.1) : rnd() < .06 ? col(110,100,150,.2) : col(122,106,116,.26))
              : x >= 2.3 ? (rnd() < .08 ? col(240,150,182,.1) : col(66,104,50,.25)) : (rnd() < .15 ? col(80,90,170,.2) : col(40,78,50,.25));
      add(x, 0, z, z*.0016+.006, c);
    }
    /* rails glow copper toward the sun; sleepers; fallen petals */
    for (const rx of [TXC-.55, TXC+.55, CAM_X-.55, CAM_X+.55]) for (let i = 0; i < Math.round(3400*sc); i++) {
      const z = zi(1.8,260), w = clamp(z/140,0,1), c = mix([72,48,40],[255,170,95], w*w + (rnd() < .03 ? .5 : 0));
      add(rx + (rnd()-.5)*.07, .17 + rnd()*.03, z, .03 + z*.0013, colA(c,.12));
    }
    for (const tc of [TXC, CAM_X]) for (let z = 1.6; z < 90; z += .65) for (let i = 0, m = (z < 25 ? 50 : 16)*sc; i < m; i++)
      add(tc + (rnd()-.5)*2.6, .1, z + (rnd()-.5)*.2, .045 + z*.0012, col(52,40,48,.2));
    for (let i = 0; i < Math.round(1100*sc); i++) { const z = zi(1.8,70); add(-5 + rnd()*9.5, .06, z, .02 + z*.0006, col(245,150,185,.12)); }

    /* cherry blossom canopy helper: shells of pink blobs */
    function canopy(cx, cy, cz, rx, ry, rz, nb, total, rr, pal, fl) {
      const np = Math.max(8, total/nb|0);
      for (let b = 0; b < nb; b++) {
        const bx = cx + gauss()*rx, by = cy + gauss()*ry*.7, bz = cz + gauss()*rz, br = 1 + rnd()*1.3;
        for (let i = 0; i < np; i++) { const u = gauss(), v = gauss(), w = gauss(), l = Math.hypot(u,v,w) || 1, k = br*(.85 + .15*rnd());
          const y = by + v/l*k*.8; add(bx + u/l*k, y, bz + w/l*k, rr, colA(pal((y-cy)/ry), .12), rnd() < .04 ? fl : 0); } }
    }
    const pink = h => rnd() < .14 ? [140,48,105] : mix([255,214,232],[222,96,160], clamp(.5-h*.5,0,1));
    const leaf = h => rnd() < .12 ? [190,190,70] : mix([30,72,42],[130,160,56], clamp(.45+h*.5,0,1));
    function trunk(x0, z0, hgt, lean, rr) {
      for (let i = 0, N = Math.round(1100*sc); i < N; i++) { const t = rnd(), a = rnd()*TAU, rad = .5*(1-.5*t);
        add(x0 + lean*t*t + Math.cos(a)*rad, hgt*t, z0 + Math.sin(a)*rad, rr, Math.sin(a) < 0 ? col(150,98,86,.18) : col(70,48,60,.18)); }
      for (let b = 0; b < 4; b++) { const t0 = .5 + rnd()*.2, sx = x0 + lean*t0*t0, sy = hgt*t0, dx = lean < 0 ? -1 : 1, dz = rnd()*2-1;
        for (let i = 0, N = Math.round(220*sc); i < N; i++) { const s = rnd(); add(sx + dx*2.4*s*(.7+rnd()*.1), sy + 1.0*s - .4*s*s, z0 + dz*1.4*s, rr, col(96,64,70,.2)); } }
    }
    for (let k = 0; k < 13; k++) { const z0 = 7 + k*9.5, x0 = 5.2 + rnd(), rr = .035 + .0011*z0;      // right: blossom avenue arching over the tracks
      trunk(x0, z0, 4.3, -1.9, rr*.8);
      canopy(x0-2.1, 4.9, z0, 3.6, 1.5, 3.6, 14, clamp(165/((2*rr)**2)*sc, 300, 8000), rr, pink, 1); }
    for (let k = 0; k < 9; k++) { const z0 = 6 + k*12, rr = .035 + .0011*z0;                          // left: green foliage lit by the sun
      trunk(-9.5, z0, 4.2, 1.2, rr*.8); canopy(-9, 5.2, z0, 3, 1.7, 3.5, 12, clamp(95/((2*rr)**2)*sc, 250, 5500), rr, leaf, 0); }
    for (let k = 0; k < 16; k++) { const bx = -7.2 + rnd()*1.5, bz = 4 + k*3;                         // hydrangeas
      for (let i = 0, N = 260*sc; i < N; i++) add(bx + gauss()*.9, .5 + Math.abs(gauss())*.7, bz + gauss()*.9, .04, colA(leaf(.2),.2));
      for (let f = 0; f < 5; f++) { const fx = bx + gauss()*.7, fy = .8 + rnd()*.6, fz = bz + gauss()*.7, c = [[86,96,210],[140,100,210],[70,70,170],[230,130,190]][rnd()*4|0];
        for (let i = 0; i < 60*sc; i++) add(fx + gauss()*.22, fy + gauss()*.22, fz + gauss()*.22, .03, colA(c,.15)); } }
    for (let z = 3; z < 72; z += 2.4) { for (let i = 0; i < 14; i++) add(4.4, i*.09, z, .035, col(120,92,70,.15));     // fence
      for (const y of [.45,.95]) for (let i = 0; i < 20; i++) add(4.4, y, z + i*.12, .03, col(130,98,74,.15)); }
    const poles = [9,22,41,66,98];                                                                       // telegraph poles and wires
    poles.forEach((z, k) => { for (let i = 0; i < 100; i++) add(-6.1, i*.08, z, .04 + z*.0006, col(105,100,105,.1));
      for (let i = 0; i < 40; i++) add(-6.1 + i*.1, 7.3, z, .035 + z*.0006, col(95,90,96,.1));
      if (k < poles.length-1) for (const wx of [-5.2,-3.4,-1.6]) for (let i = 0, N = Math.round(160*sc); i < N; i++) { const s = rnd(), zz = z + (poles[k+1]-z)*s;
        add(wx, 7.2 - 1.4*4*s*(1-s)*(poles[k+1]-z)/60, zz, .02 + zz*.0008, col(40,34,46,.1)); } });
    for (let i = 0; i < 300; i++) add(-5.7, i*.0127, 11, .03, col(120,120,126,.1));                       // signal
    for (let y of [3.65, 3.05]) for (let i = 0; i < 120; i++) { const a = rnd()*TAU, r = .17*Math.sqrt(rnd()); add(-5.7 + Math.cos(a)*r, y + Math.sin(a)*r, 10.7, .025, col(255,60,50,.1), 1); }
    for (let i = 0; i < 1500*sc; i++) add(-5.7 + (rnd()-.5)*.62, 2.4 + rnd()*1.5, 10.8 + (rnd()-.5)*.1, .03, col(30,30,36,.2));
    for (let i = 0; i < 3600*sc; i++) { const f = rnd() < .55; add(f ? -6.9 + rnd()*.9 : -6.0, rnd()*2, f ? 13 : 13 + rnd()*.8, .03, col(168,170,164,.12)); }

    /* ---------- the train: 3 cars, built in train space (z = 0 at the nose, growing backward) ---------- */
    const frontCol = (x, y) => {
      if (y < .4) return [60,60,72]; if (y > .8 && y < 1.05) return [205,50,60];
      if (Math.hypot(Math.abs(x)-.98, y-.95) < .24) return [255,250,220];
      if (y > 3.2 && y < 3.45 && Math.abs(x) < .7) return [255,210,120];
      if (y > 1.55 && y < 3.1 && Math.abs(x) < 1.2 && Math.abs(x) > .06) return mix([35,50,80],[130,100,140], clamp((y-1.55)/1.5,0,1));
      return [200,200,208]; };
    for (let i = 0; i < 4500; i++) { const x = (rnd()*2-1)*1.45, y = .35 + rnd()*3.25, c = frontCol(x,y); tadd(x, y, 0, .06, colA(c,.08)); }
    for (let car = 0; car < 3; car++) { const z0 = car*19.5;
      for (let i = 0; i < 10000; i++) { const zl = rnd()*19.2, y = .35 + rnd()*3.2; let c;
        const door = (zl % 6.4) > .9 && (zl % 6.4) < 2.1;
        if (y < .55) c = [60,60,72]; else if (y > .85 && y < 1.15) c = [205,50,60];
        else if (y > 1.45 && y < 2.75 && ((zl % 2.1) > .12 || door)) c = Math.sin(zl*.9 + y*2) > .7 ? [255,170,150] : mix([30,45,78],[110,90,130], (y-1.45)/1.3);
        else c = door ? [150,154,164] : [176,178,188];
        tadd(1.45, y, z0 + zl, .09, colA(c,.08)); }
      for (const bz of [3.2, 16]) for (const o of [-.9, .9]) for (let i = 0; i < 200; i++) { const a = rnd()*TAU, r = .46*Math.sqrt(rnd());
        tadd(1.1, .5 + Math.sin(a)*r, z0 + bz + o + Math.cos(a)*r, .05, r < .12 ? col(140,140,150,.1) : col(36,36,42,.2)); } }

    /* falling petals */
    const NP = Math.round(3500*sc), PX = new Float32Array(NP), PY = new Float32Array(NP), PZ = new Float32Array(NP), PV = new Float32Array(NP), PP = new Float32Array(NP), PCL = [col(255,196,216,.05), col(250,150,190,.05), col(255,225,235,.05)];
    for (let i = 0; i < NP; i++) { PX[i] = -8 + rnd()*20; PY[i] = rnd()*9; PZ[i] = 1.5 + Math.pow(rnd(), 1.6)*60; PV[i] = .35 + rnd()*.7; PP[i] = rnd()*TAU; }

    /* ---------- canvas, camera, projection ---------- */
    let cw, ch, img, buf, zb, F_, PPX, PPY, UL;
    let CAP = small ? 560 : 1280, ema = 16, fc = 0;   // render width; the quality governor lowers it only if frames get slow
    function size() {
      const r = cv.getBoundingClientRect(), s = Math.min(1, (CAP)/r.width);
      cw = Math.round(r.width*s); ch = Math.round(r.height*s); cv.width = cw; cv.height = ch;
      img = ctx.createImageData(cw, ch); buf = new Uint32Array(img.data.buffer); zb = new Float32Array(cw*ch);
      F_ = cw*.82; PPX = cw*.52; PPY = ch*.66;
      /* dim gradient behind the particles, so gaps read as depth, not as holes */
      const A = hx3(G.ut), B = hx3(G.uh), D = hx3(G.ul); UL = new Uint32Array(cw*ch);
      for (let y = 0; y < ch; y++) { const c = y < PPY ? mix(grad(clamp(Math.atan((PPY-y)/F_)/D2R/45, 0, 1)), A, .22) : mix(B, D, clamp((y-PPY)/(ch*.35), 0, 1));
        UL.fill(0xFF000000 | ((c[2]|0)<<16) | ((c[1]|0)<<8) | (c[0]|0), y*cw, (y+1)*cw); }
    }
    let cxp, cyp, czp, rx0, rx2, ux0, ux1, ux2, fx0, fx1, fx2;
    const HR = 205, HG = 135, HB = 155;
    function plot(x, y, z, r, c, cap = 3.5) {
      const dx = x-cxp, dy = y-cyp, dz = z-czp, zc = dx*fx0 + dy*fx1 + dz*fx2; if (zc < .3) return;
      const inv = F_/zc, sx = PPX + (dx*rx0 + dz*rx2)*inv, sy = PPY - (dx*ux0 + dy*ux1 + dz*ux2)*inv;
      let h = r*inv*.6; if (h > cap) h = cap;   // small dots
      const s = h < .5 ? 1 : (h*2 + .5)|0, x0 = (sx - s*.5)|0, y0 = (sy - s*.5)|0;
      if (x0 >= cw || y0 >= ch || x0+s <= 0 || y0+s <= 0) return;
      if (zc > 40 && zc < 220) { const k = (Math.min(.3, (zc-40)/300)*256)|0, ik = 256-k;   // atmospheric haze
        c = 0xFF000000 | ((((c>>16&255)*ik + HB*k)>>8)<<16) | ((((c>>8&255)*ik + HG*k)>>8)<<8) | (((c&255)*ik + HR*k)>>8); }
      const xs = x0 < 0 ? 0 : x0, xe = x0+s > cw ? cw : x0+s, ye = y0+s > ch ? ch : y0+s;
      if (s < 3) { for (let yy = y0 < 0 ? 0 : y0; yy < ye; yy++) for (let q = yy*cw + xs, e = yy*cw + xe; q < e; q++) if (zc < zb[q]) { zb[q] = zc; buf[q] = c; } }
      else { const rad = s*.5, mx = x0 + rad, my = y0 + rad, r2 = rad*rad;                      // larger dots are round, not square
        for (let yy = y0 < 0 ? 0 : y0; yy < ye; yy++) { const d2 = (yy + .5 - my)**2; for (let xx = xs, q = yy*cw + xs; xx < xe; xx++, q++) if (d2 + (xx + .5 - mx)**2 <= r2 && zc < zb[q]) { zb[q] = zc; buf[q] = c; } } }
    }
    function proj(x, y, z) { const dx = x-cxp, dy = y-cyp, dz = z-czp, zc = dx*fx0 + dy*fx1 + dz*fx2, inv = F_/zc;
      return [PPX + (dx*rx0 + dz*rx2)*inv, PPY - (dx*ux0 + dy*ux1 + dz*ux2)*inv, zc, inv]; }
    function glow(p, r, c0, c1, a) { if (p[2] < .3 || a < .01) return; ctx.globalAlpha = a; const g = ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],r);
      g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(p[0]-r, p[1]-r, r*2, r*2); }

    /* pointer orbit */
    let camx = 0, camy = 0, tcx = 0, tcy = 0, last = 0, ta0 = 0;
    const onPointer = (e) => { tcx = (e.clientX/innerWidth-.5)*2; tcy = (e.clientY/innerHeight-.5)*2; };
    if (!reduce) addEventListener('pointermove', onPointer, {passive:true});
    const TRAIN_V = 7.5, TZ0 = 150, TZ1 = -64, TRIP = (TZ0-TZ1)/TRAIN_V, CYCLE = TRIP + 4;

    function frame(now) {
      if (disposed || !running) return;
      const raw = now - (last || now), t = now/1000, dt = Math.min(.033, raw/1000); last = now; if (!ta0) ta0 = t;
      const ts = t - ta0; ema += (raw - ema)*.05;
      if (++fc % 90 === 0 && ts > 6 && ema > 27 && CAP > 640) { CAP *= .85; size(); }       // quality governor: keep it smooth
      camx += (tcx-camx)*.05; camy += (tcy-camy)*.05;
      const ax = camx + (reduce ? 0 : Math.sin(t*.23)*.5), ay = camy + (reduce ? 0 : Math.sin(t*.17+1)*.25);
      cxp = CAM_X + ax*.9; cyp = 1.05 + ay*.3; czp = 0;                                  // camera glides around its spot: real 3D parallax
      const f = nrm([.3-cxp, 1.5-cyp, 16]), rt = nrm([f[2], 0, -f[0]]), up = [f[1]*rt[2], f[2]*rt[0]-f[0]*rt[2], -f[1]*rt[0]];
      rx0 = rt[0]; rx2 = rt[2]; ux0 = up[0]; ux1 = up[1]; ux2 = up[2]; fx0 = f[0]; fx1 = f[1]; fx2 = f[2];
      buf.set(UL); zb.fill(1e9);
      const asm = reduce ? 1 : clamp(ts/4.6, 0, 1);
      for (let i = 0; i < n; i++) {
        let x = X[i], y = Y[i], z = Z[i], c = C[i], p = PH[i];
        if (asm < 1) { const q = clamp((ts - p*2.4)/1.5, 0, 1); if (q < 1) { const u = (1-q)*(1-q)*40; x += ((p*37.1)%1-.5)*u*2; y += ((p*91.7)%1-.3)*u; z += ((p*53.3)%1-.5)*u*2; } }
        if (FL[i] && !reduce && Math.sin(t*3 + p*40) > .93) c = 0xFF000000 | (((c & 0xFEFEFE) >> 1) + 0x7F7F7F);   // twinkling blossoms
        plot(x, y, z, R[i], c);
      }
      /* train: arrives, passes the camera, dissolves into particles as it leaves, then returns */
      const cyc = reduce ? 20 : Math.max(0, ts - 4) % CYCLE, run = cyc < TRIP && ts > 3.5 || reduce, tz = reduce ? 30 : TZ0 - TRAIN_V*cyc;
      if (run) for (let j = 0; j < nt; j++) { let x = TXC + TX[j], y = TY[j], z = tz + TZ[j];
        if (z < 3) { const u = Math.pow(clamp((3-z)/10, 0, 1), 2)*4, p = TP[j]; x -= p*u*1.5; y += ((p*13)%1 - .35)*u; z += ((p*7)%1 - .5)*u; }
        plot(x, y, z, TR[j], TC[j], 26); }   // train dots grow as it nears, so the body stays solid
      /* petals */
      for (let i = 0; i < NP; i++) { if (!reduce) { PY[i] -= PV[i]*dt; PX[i] += (Math.sin(t*.7 + PP[i])*.35 - .25)*dt; PZ[i] -= .1*dt;
        if (PY[i] < 0 || PZ[i] < 1) { PY[i] = 7 + rnd()*3; PX[i] = -8 + rnd()*20; PZ[i] = 3 + rnd()*58; } }
        plot(PX[i], PY[i], PZ[i], .03 + .02*Math.sin(PP[i]*3 + t*2)**2 + (i % 40 === 0 ? .1 : 0), PCL[i % 3]); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.putImageData(img, 0, 0);
      /* light: sun, headlights, signal lamps */
      ctx.globalCompositeOperation = 'lighter';
      glow(proj(cxp + SUN[0]*450, cyp + SUN[1]*450, SUN[2]*450), cw*.16*(1 + (reduce ? 0 : .05*Math.sin(t*1.1))), G.sun, G.sun0, asm);
      if (run) for (const o of [-.98, .98]) { const p = proj(TXC + o, .95, tz), pl = reduce ? 1 : .85 + .15*Math.sin(t*5); glow(p, clamp(.5*p[3], 2, cw*.12), G.lamp, G.lamp0, .9*pl); }
      const bl = reduce ? 1 : (Math.sin(t*2.2) > 0 ? 1 : .4);
      glow(proj(-5.7, 3.65, 10.7), .3*F_/10.7, G.sig, G.sig0, bl*asm); glow(proj(-5.7, 3.05, 10.7), .3*F_/10.7, G.sig, G.sig0, (1.4-bl)*asm);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      if (ts > 5.2 && hint) hint.style.opacity = 0;
      raf = requestAnimationFrame(frame);
    }

    /* Run only while the hero is on screen and the tab is visible: a
       heavy scene that never pauses is a battery tax on every visit. */
    const start = () => {
      if (disposed || running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(
      (entries) => { entries[0].isIntersecting ? start() : stop(); },
      { threshold: 0 },
    );
    io.observe(cv);
    const onVisibility = () => { document.hidden ? stop() : start(); };
    document.addEventListener('visibilitychange', onVisibility);
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    size();

    return () => {
      disposed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (!reduce) removeEventListener('pointermove', onPointer);
    };
  }, [hintRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label="A 3D particle cherry blossom railway at sunset with a train arriving and leaving"
    />
  );
}
