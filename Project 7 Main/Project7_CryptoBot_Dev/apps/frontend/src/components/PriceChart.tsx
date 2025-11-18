import React from 'react';

type Point = { ts: number; price: number };

export default function PriceChart({ data, height = 300 }: { data: Point[]; height?: number }) {
  const points = (data || []).slice().sort((a, b) => a.ts - b.ts);
  if (points.length < 2) {
    return (
      <div className="chart-empty" style={{ height }}>
        Not enough data to render chart
      </div>
    );
  }

  const minTs = points[0].ts;
  const maxTs = points[points.length - 1].ts;
  const minP = Math.min(...points.map((p) => p.price));
  const maxP = Math.max(...points.map((p) => p.price));

  const padY = (maxP - minP) * 0.05 || 1;
  const yMin = minP - padY;
  const yMax = maxP + padY;

  const W = 800;
  const H = height;

  const x = (t: number) => ((t - minTs) / Math.max(1, maxTs - minTs)) * (W - 40) + 20;
  const y = (p: number) => H - ((p - yMin) / Math.max(1e-9, yMax - yMin)) * (H - 30) - 15;

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.ts).toFixed(2)} ${y(p.price).toFixed(2)}`)
    .join(' ');

  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} role="img" aria-label="Price chart">
      <rect x={0} y={0} width={W} height={H} fill="transparent" />
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
        <line key={i} x1={20} x2={W - 20} y1={15 + (H - 30) * g} y2={15 + (H - 30) * g} stroke="#333" strokeWidth={1} opacity={0.3} />
      ))}
      {/* path */}
      <path d={d} fill="none" stroke="#4ade80" strokeWidth={2} />
      {/* last point */}
      <circle cx={x(last.ts)} cy={y(last.price)} r={3} fill="#22c55e" />
      {/* axes labels minimal */}
      <text x={10} y={15} fill="#888" fontSize="10">
        {yMax.toFixed(2)}
      </text>
      <text x={10} y={H - 10} fill="#888" fontSize="10">
        {yMin.toFixed(2)}
      </text>
    </svg>
  );
}

