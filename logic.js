/* 診断ロジック(画面に依存しない計算部分) */

function parseAxes(s) {
  const o = {}; const re = /([A-Z])(\d?)/g; let m;
  while ((m = re.exec(s))) o[m[1]] = (o[m[1]] || 0) + (m[2] ? +m[2] : 1);
  return o;
}
function addVec(t, v, k) { k = k || 1; for (const a in v) t[a] = (t[a] || 0) + v[a] * k; }
function cosine(a, b) {
  let d = 0, na = 0, nb = 0;
  for (const k in a) { na += a[k] * a[k]; if (b[k]) d += a[k] * b[k]; }
  for (const k in b) nb += b[k] * b[k];
  return na && nb ? d / Math.sqrt(na * nb) : 0;
}

const JOB_LIST = JOBS.map(j => ({
  name: j[0], desc: j[1], axes: parseAxes(j[2]), fields: j[3].split(","), work: j[4].split(",")
}));

/* sel: {interests, strengths, values, extras, acts} (すべて添字の配列) / w: {i,s,v} */
function compute(sel, w) {
  const us = {}, uv = {}, fc = {}, tags = new Set();
  sel.strengths.forEach(i => addVec(us, parseAxes(STRENGTHS[i][1])));
  sel.acts.forEach(i => {
    addVec(us, parseAxes(ACTS[i].a));
    ACTS[i].f.split(",").filter(Boolean).forEach(f => fc[f] = (fc[f] || 0) + 0.5);
  });
  sel.values.forEach(i => addVec(uv, parseAxes(VALUES[i][2])));
  sel.interests.forEach(i => INTERESTS[i][1].split(",").forEach(f => fc[f] = (fc[f] || 0) + 1));
  sel.extras.forEach(i => tags.add(EXTRAS[i][1]));

  const hasI = Object.keys(fc).length > 0;
  const hasS = Object.keys(us).length > 0;
  const hasV = sel.values.length > 0 || tags.size > 0;

  const rows = JOB_LIST.map(j => {
    let i = 0;
    j.fields.forEach(f => { i += fc[f] || 0; });
    const s = cosine(us, j.axes);
    let v = 0;
    if (sel.values.length && tags.size) {
      const m = j.work.filter(t => tags.has(t)).length / tags.size;
      v = 0.7 * cosine(uv, j.axes) + 0.3 * m;
    } else if (sel.values.length) v = cosine(uv, j.axes);
    else if (tags.size) v = j.work.filter(t => tags.has(t)).length / tags.size;
    return { job: j, raw: { i, s, v } };
  });

  const mx = { i: 0, s: 0, v: 0 };
  rows.forEach(r => { for (const k in mx) mx[k] = Math.max(mx[k], r.raw[k]); });
  const active = { i: hasI, s: hasS, v: hasV };
  let wsum = 0;
  for (const k in active) if (active[k]) wsum += w[k];

  rows.forEach(r => {
    r.part = {};
    let t = 0;
    for (const k in mx) {
      r.part[k] = mx[k] ? r.raw[k] / mx[k] : 0;
      if (active[k] && wsum) t += w[k] * r.part[k];
    }
    r.total = wsum ? t / wsum : 0;
    // 理由づくり
    r.fields = r.job.fields.filter(f => fc[f]);
    r.axes = Object.keys(r.job.axes)
      .filter(a => (us[a] || 0) + (uv[a] || 0) > 0)
      .sort((a, b) => r.job.axes[b] * ((us[b] || 0) + (uv[b] || 0)) - r.job.axes[a] * ((us[a] || 0) + (uv[a] || 0)))
      .slice(0, 3);
    r.work = r.job.work.filter(t => tags.has(t));
  });
  rows.sort((a, b) => b.total - a.total);
  return { rows, us, uv, fc, active };
}

/* あなたの強みタイプ(上位の軸) */
function topAxes(us, uv, n) {
  const t = {};
  addVec(t, us, 1); addVec(t, uv, 0.6);
  return Object.keys(t).sort((a, b) => t[b] - t[a]).slice(0, n || 3).map(k => ({ k, v: t[k] }));
}

if (typeof module !== "undefined") module.exports = { compute, topAxes, parseAxes };
