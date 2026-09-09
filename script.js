/* ═══════ ตั้งค่าตรงนี้ ═══════ */
var GROUP_LINK   = "https://line.me/ti/g/642AHg2T5x";
var PLAYER_COUNT = 5;
var GAS_URL      = "";
/* ═══════════════════════════ */

var FIELDS = [
  {k:"name",    l:"ชื่อจริง - นามสกุล",       p:"ชื่อ-นามสกุล"},
  {k:"nick",    l:"ชื่อในเกม (Nickname)",     p:"ชื่อในเกม"},
  {k:"uid",     l:"UID ในเกม",                p:"เช่น 123456789"},
  {k:"room",    l:"ห้อง",                     p:"ม.5/2"},
  {k:"gpa",     l:"เกรดเฉลี่ยเทอมที่ผ่านมา",  p:"เช่น 3.25"},
  {k:"contact", l:"เบอร์โทร หรือ IG",         p:"เบอร์ หรือ IG"}
];

function card(prefix, tag, isSub){
  var cells = FIELDS.map(function(f){
    var extra = f.k === "gpa" ? ' type="number" min="0" max="4" step="0.01" inputmode="decimal"' : "";
    return '<div><label>' + f.l + '</label><input name="' + prefix + '_' + f.k +
           '" placeholder="' + f.p + '"' + extra + '></div>';
  }).join("");
  return '<div class="card' + (isSub ? " sub" : "") + '"><div class="ptag">' + tag +
         '</div><div class="grid">' + cells + '</div></div>';
}

var html = "";
for (var i = 1; i <= PLAYER_COUNT; i++) html += card("p" + i, "PLAYER " + i, false);
document.getElementById("mainList").innerHTML = html;
document.getElementById("subList").innerHTML  = card("sub", "SUBSTITUTE", true);

/* ── ตั้งค่า QR + ลิงก์กลุ่ม ── */
var qrImg = document.getElementById("qrImg");
var qrFallback = document.getElementById("qrFallback");
document.getElementById("qrLink").href = GROUP_LINK;

var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&data=" + encodeURIComponent(GROUP_LINK);
qrImg.src = qrUrl;

qrImg.onerror = function(){
  qrImg.style.display = "none";
  qrFallback.style.display = "block";
};
qrImg.onload = function(){
  qrFallback.style.display = "none";
};

/* ── ฟังก์ชันช่วยดึงค่า ── */
function el(n){ return document.querySelector('[name="' + n + '"]'); }
function val(n){ var e = el(n); return e ? e.value.trim() : ""; }
function grab(pre){
  var o = {};
  FIELDS.forEach(function(f){ o[f.k] = val(pre + "_" + f.k); });
  return o;
}

/* ── ส่งฟอร์ม ── */
document.getElementById("form").addEventListener("submit", function(e){
  e.preventDefault();
  var errs = [];
  document.querySelectorAll("input").forEach(function(i){ i.classList.remove("bad"); });

  function mark(n){ var x = el(n); if (x) x.classList.add("bad"); }

  if (!val("team_name"))    { errs.push("กรุณากรอกชื่อทีม"); mark("team_name"); }
  if (!val("team_leader"))  { errs.push("กรุณากรอกชื่อหัวหน้าทีม"); mark("team_leader"); }
  if (!val("team_contact")) { errs.push("กรุณากรอกเบอร์ติดต่อหัวหน้าทีม"); mark("team_contact"); }

  function check(pre, who, must){
    var p = grab(pre);
    if (!must && !p.name && !p.nick && !p.uid) return null;
    if (!p.name)    { errs.push(who + ": กรุณากรอกชื่อจริง"); mark(pre + "_name"); }
    if (!p.nick)    { errs.push(who + ": กรุณากรอกชื่อในเกม"); mark(pre + "_nick"); }
    if (!p.room)    { errs.push(who + ": กรุณากรอกห้อง"); mark(pre + "_room"); }
    if (!p.contact) { errs.push(who + ": กรุณากรอกเบอร์โทรหรือ IG"); mark(pre + "_contact"); }
    if (!/^[0-9]{6,12}$/.test(p.uid)) { errs.push(who + ": UID ต้องเป็นตัวเลข 6-12 หลัก"); mark(pre + "_uid"); }
    var g = parseFloat(p.gpa);
    if (p.gpa === "" || isNaN(g) || g < 0 || g > 4) { errs.push(who + ": เกรดต้องอยู่ระหว่าง 0.00 - 4.00"); mark(pre + "_gpa"); }
    return p;
  }

  var players = [];
  for (var i = 1; i <= PLAYER_COUNT; i++) players.push(check("p" + i, "ผู้เล่นที่ " + i, true));
  var sub = check("sub", "ตัวสำรอง", false);

  var uids = players.concat(sub ? [sub] : []).map(function(p){ return p ? p.uid : ""; })
                    .filter(function(u){ return u; });
  if (new Set(uids).size !== uids.length) errs.push("พบ UID ซ้ำกันภายในทีม");

  var box = document.getElementById("errBox");
  if (errs.length){
    box.style.display = "block";
    box.innerHTML = "<b>กรุณาตรวจสอบข้อมูล</b><ul>" +
      errs.map(function(x){ return "<li>" + x + "</li>"; }).join("") + "</ul>";
    box.scrollIntoView({behavior:"smooth", block:"center"});
    return;
  }
  box.style.display = "none";

  var data = {
    game: "RoV",
    team: { name: val("team_name"), leader: val("team_leader"), contact: val("team_contact") },
    players: players,
    substitute: sub,
    submittedAt: new Date().toISOString()
  };

  var btn = e.target.querySelector(".send");
  btn.disabled = true;
  btn.textContent = "กำลังส่ง...";

  function finish(ok){
    btn.disabled = false;
    btn.textContent = "ส่งข้อมูลลงทะเบียน";
    if (ok){
      document.getElementById("done").classList.add("on");
      e.target.reset();
    } else {
      alert("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  if (!GAS_URL){
    console.log("ยังไม่ได้เชื่อม Google Sheet — ข้อมูล:", data);
    setTimeout(function(){ finish(true); }, 500);
    return;
  }
  fetch(GAS_URL, {
    method: "POST", mode: "no-cors",
    headers: {"Content-Type":"text/plain;charset=utf-8"},
    body: JSON.stringify(data)
  }).then(function(){ finish(true); }).catch(function(){ finish(false); });
});
