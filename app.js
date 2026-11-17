/* 画面の制御 */
const $ = s => document.querySelector(s);
const KEY = "shigoto-navi.v1";

const state = {
  step: 0,
  sel: { interests: new Set(), strengths: new Set(), values: new Set(), extras: new Set(), acts: new Set() },
  w: { i: 35, s: 40, v: 25 },
  showMore: false
};

const STEPS = [
  { id: "intro", label: "はじめに", cls: "pink" },
  { id: "interests", label: "好きなこと", cls: "pink", key: "interests", max: 12 },
  { id: "strengths", label: "得意なこと", cls: "yellow", key: "strengths", max: 15 },
  { id: "values", label: "価値観", cls: "green", key: "values", max: 8 },
  { id: "acts", label: "学校生活", cls: "blue", key: "acts", max: 15 },
  { id: "result", label: "結果", cls: "dark" }
];

function save() {
  try {
    const o = { step: state.step, w: state.w, sel: {} };
    for (const k in state.sel) o.sel[k] = [...state.sel[k]];
    localStorage.setItem(KEY, JSON.stringify(o));
  } catch (e) {}
}
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!o) return false;
    for (const k in state.sel) state.sel[k] = new Set(o.sel[k] || []);
    state.w = o.w || state.w;
    state.saved = o.step || 0;
    return Object.values(state.sel).some(s => s.size);
  } catch (e) { return false; }
}
const hadSave = load();

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add("hidden"), 2200);
}

/* ---------- 共通部品 ---------- */
function renderChrome() {
  const st = STEPS[state.step];
  document.body.className = st.cls;
  $("#progress").innerHTML = STEPS.slice(1).map((s, i) =>
    `<span class="${i + 1 === state.step ? "cur" : ""}">${i + 1}.${s.label}</span>`).join("");
  const last = state.step === STEPS.length - 1;
  let nav = "";
  if (state.step > 0) nav += `<button class="btn sub" data-go="-1">← 戻る</button>`;
  if (state.step === 0) nav += `<button class="btn" data-go="1">はじめる</button>`;
  else if (!last) {
    const need = st.key && st.key !== "acts" && state.sel[st.key].size === 0;
    nav += `<button class="btn" data-go="1" ${need ? "disabled" : ""}>${state.step === 4 ? "結果を見る →" : "次へ →"}</button>`;
    if (need) nav += `<span class="hint">1つ以上選んでね</span>`;
  } else nav += `<button class="btn sub" data-act="reset">最初からやり直す</button>`;
  $("#nav").innerHTML = nav;
}
function counter(key, max) {
  const n = state.sel[key].size;
  return `<div class="count">選んだ数 <b id="cnt-${key}">${n}</b> / ${max}</div>`;
}
function searchBox(ph) {
  return `<input type="search" id="q" placeholder="${ph}" aria-label="絞り込み">`;
}

/* ---------- 各ステップ ---------- */
function viewIntro() {
  return `
  <div class="card">
    <h2>向いている仕事を、選ぶだけで見つけよう</h2>
    <p>「好きなこと」「得意なこと」「大切にしたい価値観」「学校生活で頑張ったこと」を、ピンときたものを選んでいくだけ。
    言葉にするのが苦手でも大丈夫です。最後に、相性のよさそうな仕事をランキングで表示します。</p>
    <ol>
      <li>好きなこと(興味)を選ぶ</li><li>得意なことを選ぶ</li><li>価値観・働き方を選ぶ</li>
      <li>学校生活で頑張ったことを選ぶ</li><li>ランキングを見て、自己PRのたたき台もつくる</li>
    </ol>
    <p class="note">所要時間は約10〜15分。入力内容はこの端末のブラウザにだけ保存され、外部には送信されません。
    結果は「考えるきっかけ」です。気になった仕事は、先生や家族、職業情報サイトでぜひ調べてみてください。</p>
    ${hadSave ? `<div class="row"><button class="btn" data-act="resume">前回の続きから</button></div>` : ""}
  </div>`;
}

function viewInterests() {
  const chips = INTERESTS.map((it, i) =>
    `<button class="chip ${state.sel.interests.has(i) ? "on" : ""}" data-k="interests" data-i="${i}">${it[0]}</button>`).join("");
  return `
  <h2>1. 好きなこと(興味)</h2>
  <p class="lead">時間を忘れてしまうこと、つい調べてしまうことなど、気になるものを最大12個まで選ぼう。仕事に関係なくてもOK。</p>
  <div class="tools">${searchBox("さがす(例: 音楽)")}${counter("interests", 12)}</div>
  <div class="chips" id="list">${chips}</div>`;
}

function viewStrengths() {
  const items = STRENGTHS.map((it, i) =>
    `<button class="item ${state.sel.strengths.has(i) ? "on" : ""}" data-k="strengths" data-i="${i}"><span class="n">${String(i + 1).padStart(2, "0")}</span><span>${it[0]}</span></button>`).join("");
  return `
  <h2>2. 得意なこと</h2>
  <p class="lead">「自分っぽい」「言われたことがある」と思うものを最大15個まで選ぼう。迷ったら直感でOK。</p>
  <div class="tools">${searchBox("さがす(例: 計画)")}${counter("strengths", 15)}</div>
  <div class="list two" id="list">${items}</div>`;
}

function viewValues() {
  const items = VALUES.map((it, i) =>
    `<button class="item ${state.sel.values.has(i) ? "on" : ""}" data-k="values" data-i="${i}"><span class="n">${String(i + 1).padStart(2, "0")}</span><span>${it[0]}<small>${it[1]}</small></span></button>`).join("");
  const ex = EXTRAS.map((it, i) =>
    `<button class="chip ${state.sel.extras.has(i) ? "on" : ""}" data-k="extras" data-i="${i}">${it[0]}</button>`).join("");
  return `
  <h2>3. 大切にしたい価値観</h2>
  <p class="lead">生き方・働き方で大事にしたいものを最大8個まで選ぼう。</p>
  <div class="tools">${searchBox("さがす(例: 家族)")}${counter("values", 8)}</div>
  <div class="list two" id="list">${items}</div>
  <h3 class="group">働き方の希望(3つまで)</h3>
  <div class="chips">${ex}</div>
  <p class="note">選んだ数 <span id="cnt-extras">${state.sel.extras.size}</span> / 3</p>`;
}

function viewActs() {
  let html = `
  <h2>4. 学校生活で頑張ったこと</h2>
  <p class="lead">大きな成果でなくてOK。「やったな」と思うことを選ぼう(最大15個)。選ばなくても結果は見られます。</p>
  <div class="tools">${counter("acts", 15)}</div>`;
  ACT_GROUPS.forEach((g, gi) => {
    html += `<h3 class="group">${g.name}</h3><div class="list two">`;
    ACTS.forEach((a, i) => {
      if (a.g === gi) html += `<button class="item ${state.sel.acts.has(i) ? "on" : ""}" data-k="acts" data-i="${i}"><span>${a.t}</span></button>`;
    });
    html += `</div>`;
  });
  return html;
}

/* ---------- 結果 ---------- */
function selArrays() {
  const o = {};
  for (const k in state.sel) o[k] = [...state.sel[k]];
  return o;
}
function viewResult() {
  return `
  <h2>あなたに向いていそうな仕事ランキング</h2>
  <p class="lead">選んだ内容をもとにした相性の目安です。順位は「正解」ではなく、視野を広げるためのヒントとして使ってください。</p>
  <div class="card noprint">
    <b>何を重視する?</b>(動かすとランキングが変わります)
    <div class="sliders">
      <label>好きなこと<input type="range" min="0" max="100" value="${state.w.i}" data-w="i"><span id="wv-i">${state.w.i}</span></label>
      <label>得意なこと<input type="range" min="0" max="100" value="${state.w.s}" data-w="s"><span id="wv-s">${state.w.s}</span></label>
      <label>価値観<input type="range" min="0" max="100" value="${state.w.v}" data-w="v"><span id="wv-v">${state.w.v}</span></label>
    </div>
  </div>
  <div class="card"><b>あなたの強みタイプ</b><div id="types" class="axbar"></div></div>
  <div id="ranking"></div>
  <div class="row noprint"><button class="btn sub" id="more">もっと見る(20位まで)</button></div>
  <div class="card" style="margin-top:14px">
    <b>自己PRのたたき台</b>
    <p class="note">選んだ内容から自動でつくった文章です。自分の言葉に直して、進路面談や志望理由書に使ってみよう。</p>
    <textarea id="pr"></textarea>
    <div class="row noprint">
      <button class="btn" data-act="copy-pr">文章をコピー</button>
      <button class="btn sub" data-act="copy-rank">ランキングをコピー</button>
      <button class="btn sub" data-act="print">印刷する</button>
    </div>
  </div>
  <div class="card noprint">
    <b>次のステップ</b>
    <p class="note" style="font-size:14px">気になる仕事が見つかったら、厚生労働省の職業情報提供サイト「job tag」(https://shigoto.mhlw.go.jp/)で仕事内容・必要な資格・求められる力を調べてみよう。
    その仕事の人に話を聞く、オープンキャンパスや職業体験に参加するのもおすすめです。</p>
  </div>`;
}

let lastResult = null;
function renderRanking() {
  const sel = selArrays();
  const res = compute(sel, state.w);
  lastResult = res;
  const n = state.showMore ? 20 : 10;
  $("#ranking").innerHTML = res.rows.slice(0, n).map((r, idx) => {
    const intr = sel.interests.filter(i => INTERESTS[i][1].split(",").some(f => r.job.fields.includes(f))).slice(0, 3).map(i => INTERESTS[i][0]);
    const mainAx = Object.keys(r.job.axes).sort((a, b) => r.job.axes[b] - r.job.axes[a]).slice(0, 2);
    const strs = sel.strengths.filter(i => mainAx.some(a => STRENGTHS[i][1].includes(a))).slice(0, 2).map(i => STRENGTHS[i][0]);
    const acts = sel.acts.filter(i => mainAx.some(a => ACTS[i].a.includes(a))).slice(0, 1).map(i => ACTS[i].t);
    const tags = [];
    r.fields.forEach(f => tags.push(FIELD[f]));
    r.axes.forEach(a => tags.push(AXIS[a]));
    r.work.forEach(t => tags.push(WORKSTYLE[t]));
    const pct = x => Math.round(x * 100);
    const bar = (cls, v, label, on) => on ? `<span>${label}</span><div class="bar"><i class="${cls}" style="width:${pct(v)}%"></i></div>` : "";
    const ev = [];
    if (intr.length) ev.push(`好きなこと:${intr.map(s => `「${s}」`).join("")}`);
    if (strs.length) ev.push(`得意なこと:${strs.map(s => `「${s}」`).join("")}`);
    if (acts.length) ev.push(`学校生活:${acts.map(s => `「${s}」`).join("")}`);
    return `<div class="job"><div class="rank">${idx + 1}</div><div style="flex:1">
      <h3><span>${r.job.name}</span><span class="score">${pct(r.total)}点</span></h3>
      <p class="d">${r.job.desc}</p>
      <div class="bars">${bar("b-i", r.part.i, "好き", res.active.i)}${bar("b-s", r.part.s, "得意", res.active.s)}${bar("b-v", r.part.v, "価値観", res.active.v)}</div>
      <p class="why">${tags.slice(0, 6).map(t => `<span>${t}</span>`).join("")}</p>
      ${ev.length ? `<p class="why">つながり → ${ev.join(" / ")}</p>` : ""}
    </div></div>`;
  }).join("");
  $("#more").textContent = state.showMore ? "上位10位だけ表示" : "もっと見る(20位まで)";

  const tp = topAxes(res.us, res.uv, 5);
  const mx = tp.length ? tp[0].v : 1;
  $("#types").innerHTML = tp.length ? tp.map(t => `<span>${AXIS[t.k]}</span><div class="bar"><i class="b-s" style="width:${Math.round(t.v / mx * 100)}%"></i></div>`).join("") : "<span>得意なこと・学校生活を選ぶと表示されます</span>";
  $("#pr").value = buildPR(sel, tp);
}

function buildPR(sel, tp) {
  const acts = sel.acts.slice(0, 2).map(i => ACTS[i].t);
  const ax = tp.slice(0, 2).map(t => AXIS[t.k]);
  const ints = sel.interests.slice(0, 3).map(i => INTERESTS[i][0]);
  const vals = sel.values.slice(0, 2).map(i => VALUES[i][0]);
  let s = "";
  if (acts.length) s += `私は高校生活で「${acts.join("」「")}」という経験をしました。`;
  if (ax.length) s += `この経験などを通して、${ax.join("」と「").replace(/^/, "「") + "」"}の力を発揮できることに気づきました。`;
  if (ints.length) s += `また、${ints.join("・")}に関心があります。`;
  if (vals.length) s += `将来は「${vals.join("」「")}」を大切にして働きたいと考えています。`;
  if (!s) s = "選択した内容から、ここに自己PRのたたき台が表示されます。";
  s += "\n\n【その経験で、具体的に何をしましたか?(自分の言葉で書き足そう)】\n\n【そこから学んだこと・これから挑戦したいこと】\n";
  return s;
}

/* ---------- 描画 ---------- */
function render() {
  const st = STEPS[state.step];
  const v = { intro: viewIntro, interests: viewInterests, strengths: viewStrengths, values: viewValues, acts: viewActs, result: viewResult }[st.id];
  $("#main").innerHTML = v();
  renderChrome();
  if (st.id === "result") renderRanking();
  window.scrollTo(0, 0);
  save();
}

/* ---------- イベント ---------- */
document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (go) { state.step = Math.max(0, Math.min(STEPS.length - 1, state.step + +go.dataset.go)); render(); return; }

  const act = e.target.closest("[data-act]");
  if (act) {
    const a = act.dataset.act;
    if (a === "resume") { state.step = 1; render(); }
    if (a === "reset") {
      if (confirm("選んだ内容をすべて消して、最初からやり直しますか?")) {
        for (const k in state.sel) state.sel[k] = new Set();
        state.step = 0; render();
      }
    }
    if (a === "copy-pr") copyText($("#pr").value);
    if (a === "copy-rank") copyText(lastResult.rows.slice(0, 10).map((r, i) => `${i + 1}位 ${r.job.name}(${Math.round(r.total * 100)}点)`).join("\n"));
    if (a === "print") window.print();
    return;
  }

  if (e.target.id === "more") { state.showMore = !state.showMore; renderRanking(); return; }

  const b = e.target.closest("[data-k]");
  if (b) {
    const k = b.dataset.k, i = +b.dataset.i, set = state.sel[k];
    const max = k === "extras" ? 3 : STEPS[state.step].max;
    if (set.has(i)) { set.delete(i); b.classList.remove("on"); }
    else {
      if (set.size >= max) { toast(`最大${max}個までです。外したいものを先にタップしてね`); return; }
      set.add(i); b.classList.add("on");
    }
    const c = $("#cnt-" + k); if (c) c.textContent = set.size;
    if (k !== "acts" && k !== "extras") renderChrome();
    save();
  }
});

document.addEventListener("input", e => {
  if (e.target.id === "q") {
    const q = e.target.value.trim();
    document.querySelectorAll("#list [data-i]").forEach(el => {
      el.classList.toggle("hidden", q && !el.textContent.includes(q));
    });
  }
  if (e.target.dataset && e.target.dataset.w) {
    state.w[e.target.dataset.w] = +e.target.value;
    $("#wv-" + e.target.dataset.w).textContent = e.target.value;
    renderRanking(); save();
  }
});

function copyText(t) {
  const done = () => toast("コピーしました");
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, () => { fallbackCopy(t); done(); });
  else { fallbackCopy(t); done(); }
}
function fallbackCopy(t) {
  const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta);
  ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove();
}

render();
