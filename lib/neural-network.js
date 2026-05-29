// Neural network constellation background
// Renders a 3D point cloud connected by edges, rotates with scroll, parallax with mouse

export let triggerNeuralReveal = () => {};

export function initNeuralNetwork(canvas) {
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  const NODE_COUNT = 110;
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: (Math.random() - 0.5) * 2.6,
      y: (Math.random() - 0.5) * 2.6,
      z: (Math.random() - 0.5) * 2.2,
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
      vz: (Math.random() - 0.5) * 0.0006,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.01,
      size: 0.6 + Math.random() * 1.4,
    });
  }

  const EDGE_THRESHOLD = 0.45;
  let edges = [];
  function recomputeEdges() {
    edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < EDGE_THRESHOLD * EDGE_THRESHOLD) {
          edges.push([i, j, Math.sqrt(d2)]);
        }
      }
    }
  }
  recomputeEdges();
  let edgeRecomputeFrame = 0;

  let scrollY = 0;
  let targetMx = 0, targetMy = 0;
  let mx = 0, my = 0;

  // 0→1 when reveal is triggered, decays back to 0 over ~5s
  let revealPulse = 0;

  triggerNeuralReveal = function () {
    revealPulse = 1.0;
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  window.addEventListener('mousemove', (e) => {
    targetMx = (e.clientX / window.innerWidth - 0.5);
    targetMy = (e.clientY / window.innerHeight - 0.5);
  });
  resize();

  function project(x, y, z) {
    const fov = 1.4;
    const cz = z + 2.6;
    const scale = fov / cz;
    const px = width  / 2 + x * scale * width  * 0.48;
    const py = height / 2 + y * scale * height * 0.48;
    return { px, py, scale, cz };
  }

  function render() {
    mx += (targetMx - mx) * 0.05;
    my += (targetMy - my) * 0.05;

    if (revealPulse > 0) revealPulse = Math.max(0, revealPulse - 0.003);

    const scrollNorm = scrollY / Math.max(window.innerHeight, 1);
    const rotY = scrollNorm * 0.55 + mx * 0.35;
    const rotX = scrollNorm * 0.18 + my * 0.25;
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy; n.z += n.vz;
      if (n.x > 1.3 || n.x < -1.3) n.vx *= -1;
      if (n.y > 1.3 || n.y < -1.3) n.vy *= -1;
      if (n.z > 1.1 || n.z < -1.1) n.vz *= -1;
      n.pulse += n.pulseSpeed;
    }

    edgeRecomputeFrame++;
    if (edgeRecomputeFrame > 60) { recomputeEdges(); edgeRecomputeFrame = 0; }

    ctx.fillStyle = 'rgba(10, 10, 12, 1)';
    ctx.fillRect(0, 0, width, height);

    const projected = nodes.map((n) => {
      let x = n.x, y = n.y, z = n.z;
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      return { ...project(x1, y2, z2), n };
    });

    for (let i = 0; i < edges.length; i++) {
      const [a, b, dist] = edges[i];
      const pa = projected[a], pb = projected[b];
      const depth = (pa.cz + pb.cz) / 2;
      const depthAlpha = Math.max(0, Math.min(1, (4 - depth) / 3));
      const distAlpha = 1 - dist / EDGE_THRESHOLD;
      const alpha = depthAlpha * distAlpha * (0.22 + revealPulse * 0.22);
      if (alpha <= 0.005) continue;
      ctx.strokeStyle = `rgba(220, 225, 240, ${alpha})`;
      ctx.lineWidth = 0.5 + revealPulse * 0.4;
      ctx.beginPath();
      ctx.moveTo(pa.px, pa.py);
      ctx.lineTo(pb.px, pb.py);
      ctx.stroke();
    }

    for (const p of projected) {
      const depthAlpha = Math.max(0, Math.min(1, (4 - p.cz) / 3));
      const pulse = 0.7 + Math.sin(p.n.pulse) * 0.3;
      const sizeBoost = 1 + revealPulse * 0.7;
      const r = p.n.size * p.scale * 1.6 * pulse * sizeBoost;
      const alpha = Math.min(1, depthAlpha * (0.85 + revealPulse * 0.45));

      const grd = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, r * 4);
      grd.addColorStop(0, `rgba(255, 250, 240, ${alpha * 0.9})`);
      grd.addColorStop(0.4, `rgba(255, 240, 220, ${alpha * 0.15})`);
      grd.addColorStop(1, `rgba(255, 240, 220, 0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.px, p.py, r * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 252, 245, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  render();
}
