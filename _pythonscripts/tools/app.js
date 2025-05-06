/* ───────── Seat‑Plan (আগে যেমন) ───────── */
const SECTION_CFG = {
  A:{start:1,seats:65,dense:true},B:{start:66,seats:65,dense:true},C:{start:131,seats:65,dense:true},
  A1:{start:1,seats:33,dense:false},A2:{start:34,seats:32,dense:false},
  B1:{start:66,seats:33,dense:false},B2:{start:99,seats:32,dense:false},
  C1:{start:131,seats:33,dense:false},C2:{start:164,seats:32,dense:false},
};
const pad=n=>(n<10?"0"+n:n.toString());

/* ---------- Build seat rows  (row / column • raster / serpentine / random) ----------
   ‑ keep the original signature; optional 4th arg is a small opts object.
   ‑ if opts is omitted it behaves like the old simple raster‑row scan.       */
   function buildSeatRows(start, total, perRow, opts = {}) {
    const {
      horizStart = "left",         // "left" | "right"
      vertStart  = "top",          // "top"  | "bottom"
      mode       = "row",          // "row"  | "col"
      serpentine = false,
      random     = false
    } = opts;
  
    /* --- make the number list --- */
    const nums = Array.from({length: total}, (_, i) => start + i);
    if (random) nums.sort(() => Math.random() - .5);   // shuffle if needed
  
    /* --- prepare blank grid --- */
    const rows = Array.from(
          { length: Math.ceil(total / perRow) },
          () => Array(perRow).fill(null));
  
    /* index helpers */
    const rowOrder = vertStart === "top"
          ? [...rows.keys()] : [...rows.keys()].reverse();
    const colOrder = horizStart === "left"
          ? [...Array(perRow).keys()] : [...Array(perRow).keys()].reverse();
  
    let n = 0;
  
    if (mode === "row") {                  /* -------- ROW scan -------- */
      rowOrder.forEach((r, rLogical) => {
        const cols = serpentine && rLogical % 2 ? [...colOrder].reverse() : colOrder;
        cols.forEach(c => { if (n < nums.length) rows[r][c] = nums[n++]; });
      });
  
    } else {                               /* -------- COLUMN scan -------- */
      colOrder.forEach((c, cLogical) => {
        const rowsNow = serpentine && cLogical % 2 ? [...rowOrder].reverse() : rowOrder;
        rowsNow.forEach(r => { if (n < nums.length) rows[r][c] = nums[n++]; });
      });
    }
    return rows;
  }
  
function buildTable(rows,dense){
  const seatCell=v=>`<td class="seat">${v?`<span class="seat-num">${pad(v)}</span><span class="chair"></span>`:""}</td>`;
  let html="<table>";
  rows.forEach(r=>{
    html+="<tr>";
    if(dense){r.forEach((v,i)=>{if(i===6)html+='<td class="walkway"></td>';html+=seatCell(v);});}
    else{
      for(let i=0;i<3;i++) html+=seatCell(r[i])+'<td class="blankcol"></td>';
      html+='<td class="walkway"></td>';
      for(let i=3;i<6;i++) html+=seatCell(r[i])+'<td class="blankcol"></td>';
    }
    html+="</tr>";
  });
  return html+"</table>";
}
function renderPlan() {
  const section = document.getElementById("sectionSelect").value;
  const cfg     = SECTION_CFG[section];
  const perRow  = cfg.dense ? 12 : 6;

  /* read user choices */
  const pattern = document.getElementById("pattern").value;    // e.g. "serpentine-col"
  const horiz   = document.getElementById("startSide").value;  // "left" | "right"
  const vert    = document.getElementById("startRow").value;   // "top"  | "bottom"

  const opts = {
    horizStart : horiz,
    vertStart  : vert,
    mode       : pattern.includes("-col") ? "col" : "row",
    serpentine : pattern.startsWith("serpentine"),
    random     : pattern === "random"
  };

  const seatRows = buildSeatRows(cfg.start, cfg.seats, perRow, opts);

  document.getElementById("planHolder").innerHTML =
    `<div class="plan-container">
       <h1>Seat Plan for Section ${section}</h1>
       <div class="podium"></div>
       ${buildTable(seatRows, cfg.dense)}
     </div>`;
}

document.getElementById("generateBtn").onclick=renderPlan;
window.addEventListener("DOMContentLoaded",renderPlan);

/* ───────── Stopwatch & Clock (সিঙ্কড) ───────── */
let FULL_LEN = 1690;   // initial circumference for large dial

/* ---------- dial size presets ---------- */
const dialSizes = {
  large : {w:614,   r:269, stroke:61,  font:184, dash:1690, labelY:352, btnText:"Smaller Timer"},
  small : {w:430, r:188, stroke:43,  font:129,  dash:1183,  labelY:246,   btnText:"Larger Timer"}
};
let currentSize = "large";

function applyDialSize(sizeKey){
  const s = dialSizes[sizeKey];
  currentSize = sizeKey;
  FULL_LEN = s.dash;

  const svg   = document.getElementById("pie");
  const ring  = document.getElementById("pieFill");
  const bg    = svg.querySelector("circle");              // first circle
  const text  = document.getElementById("timeLabel");

  svg.setAttribute("width",  s.w);
  svg.setAttribute("height", s.w);
  svg.setAttribute("viewBox", `0 0 ${s.w} ${s.w}`);

  [bg, ring].forEach(c=>{
    c.setAttribute("cx", s.w/2);
    c.setAttribute("cy", s.w/2);
    c.setAttribute("r",  s.r);
    c.setAttribute("stroke-width", s.stroke);
  });
  ring.setAttribute("stroke-dasharray", s.dash);
  //ring.setAttribute("stroke-dashoffset", s.dash);
   const realLen = ring.getTotalLength();         // measure
 ring.setAttribute("stroke-dasharray",  realLen);
 ring.setAttribute("stroke-dashoffset", realLen);
 FULL_LEN = realLen;       
  ring.setAttribute("transform", `rotate(-90 ${s.w/2} ${s.w/2})`);

  text.setAttribute("x", s.w/2);
  text.setAttribute("y", s.labelY);
  text.setAttribute("font-size", s.font);

  /* keep progress correct after resizing */
  drawPie();

  /* update button text */
  document.getElementById("toggleSizeBtn").textContent = s.btnText;
}


let duration=700, initialDuration = 700, remain=700, endTime=null, running=false;


const pie=document.getElementById("pie"), fill=document.getElementById("pieFill"), label=document.getElementById("timeLabel");
const dateLbl=document.getElementById("dateTime"), endLbl=document.getElementById("endTime");
const durInput=document.getElementById("durationInput");
const startBtn=document.getElementById("startBtn"), pauseBtn=document.getElementById("pauseBtn"), resetBtn=document.getElementById("resetBtn");

const fmt=t=>`${pad((t/60)|0)}:${pad(t%60)}`;
function drawPie(){
  //const ratio=remain/duration;
  const ratio = remain / initialDuration;
  fill.style.strokeDashoffset=(FULL_LEN*(1-ratio)).toFixed(1);
  label.textContent=fmt(remain);  //Math.floor(remain/duration*100);//
}
function updateEndLabel(){endLbl.textContent=endTime?`Ends at ${endTime.toLocaleTimeString()}`:"";}

/* ---------- controls ---------- */
function startTimer(){
  if(running) return;
  //duration=parseInt(durInput.value,10)*60;
  duration        = (+durInput.value || 10) * 60;
  initialDuration = duration;          // ← freeze here
  remain          = duration;
  if(!duration) return;
  remain=duration;
  endTime=new Date(Date.now()+remain*1000);
  running=true;
  startBtn.disabled=true; pauseBtn.disabled=false; resetBtn.disabled=false;
  pie.classList.remove("shake");
  drawPie(); updateEndLabel();
}
function pauseTimer(){
  if(!running){ // resume
    if(remain<=0)return;
    endTime=new Date(Date.now()+remain*1000);
    running=true; pauseBtn.textContent="Pause";
  }else{
    running=false; pauseBtn.textContent="Resume";
  }
}
function resetTimer(){
  running=false; 
  //remain=duration=parseInt(durInput.value,10)*60;
  duration        = (+durInput.value || 10) * 60;
  initialDuration = duration;          // ← and here
  remain          = duration;
  endTime=null; drawPie(); updateEndLabel();
  pie.classList.remove("shake");
  startBtn.disabled=false; pauseBtn.disabled=true; resetBtn.disabled=true; pauseBtn.textContent="Pause";
}
function adjust(sec){
  if(running){
    //remain = Math.max(0, remain + sec);
    //duration = Math.max(duration, remain);
    remain   = Math.max(0, remain + sec);     // only tweak the countdown
    endTime  = new Date(Date.now() + remain * 1000);
  } else {
    /* timer idle: change the preset duration */
    //duration = Math.max(0, duration + sec);
    //remain   = duration;
    duration        = Math.max(0, duration + sec);
    initialDuration = duration;               // keep them in sync
    remain          = duration;
    durInput.value = Math.ceil(duration / 60);
  }
  drawPie(); updateEndLabel();
}


/* quick / adjust buttons */
document.querySelectorAll("button.quick").forEach(b=>b.onclick=()=>{durInput.value=b.dataset.min;});
document.querySelectorAll("button.adj").forEach(b=>b.onclick=()=>adjust(parseInt(b.dataset.sec,10)));

startBtn.onclick=startTimer; pauseBtn.onclick=pauseTimer; resetBtn.onclick=resetTimer;

/* ---------- beep + finish ---------- */
function beep(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const osc=ctx.createOscillator(); osc.frequency.value=1000;
    const gain=ctx.createGain(); gain.gain.value=0.15;
    osc.connect(gain).connect(ctx.destination); osc.start();
    setTimeout(()=>{osc.stop();ctx.close();},600);
  }catch{}
}
function finish(){
  running=false; remain=0; drawPie(); updateEndLabel();
  pie.classList.add("shake"); beep();
  startBtn.disabled=false; pauseBtn.disabled=true; resetBtn.disabled=false; pauseBtn.textContent="Pause";
}

/* ---------- master second‑tick ---------- */
function tick(){
  const now=new Date();

  /* clock */
  const opts={day:'2-digit',month:'long',year:'numeric'};
  dateLbl.textContent=`${now.toLocaleDateString(undefined,opts)} ${now.toLocaleTimeString()}`;

  /* timer */
  if(running){
    remain=Math.max(0, Math.ceil((endTime.getTime()-now.getTime())/1000));
    drawPie(); updateEndLabel();
    if(remain===0) finish();
  }

  /* schedule next tick aligned to real‑second boundary */
  const delay=1000-now.getMilliseconds();
  setTimeout(tick,delay);
}
drawPie(); updateEndLabel(); 
applyDialSize("large");  
tick();   // kick‑off master tick

/* ---------- toggle timer visibility ---------- */
const box=document.getElementById("timerBox"), tog=document.getElementById("toggleTimerBtn");
tog.onclick=()=>{const hide=box.style.display!=="none";box.style.display=hide?"none":"block";tog.textContent=hide?"Show Timer":"Hide Timer";}

document.getElementById("toggleSizeBtn").onclick =
() => applyDialSize(currentSize === "large" ? "small" : "large");

/* click ✕ to hide timer */
document.getElementById('closeTimerBtn').onclick = () => {
  box.style.display = 'none';
  tog.textContent   = 'Show Timer';
};
