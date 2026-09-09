/* ══════════════════════════════════════════════════════
   RoV TOURNAMENT — script.js  (ฉบับสมบูรณ์ พร้อมใช้งาน)
   ══════════════════════════════════════════════════════ */

var GAS_URL      = "https://script.google.com/macros/s/AKfycbyPHYheghgR9MoXmaljrkxR9Qwf1f-6lUs6uM2mSEDPEVraZyQQiVCp1DIMsnHEJ6vmDA/exec";
var GROUP_LINK   = "https://line.me/ti/g/642AHg2T5x";
var PLAYER_COUNT = 5;

/* ---------- โครงสร้างช่องกรอกของผู้เล่นแต่ละคน ---------- */
var FIELDS = [
  { k: "name",    l: "ชื่อ-นามสกุล", ph: "เช่น สมชาย ใจดี" },
  { k: "nick",    l: "ชื่อในเกม",    ph: "IGN" },
  { k: "uid",     l: "UID",          ph: "ใส่ได้ไม่จำกัดความยาว" },
  { k: "room",    l: "ห้อง",         ph: "เช่น ม.5/2" },
  { k: "gpa",     l: "เกรดเฉลี่ย",   ph: "เช่น 3.25" },
  { k: "contact", l: "เบอร์ / IG",   ph: "ช่องทางติดต่อ" }
];

/* ---------- 1) สร้างการ์ดผู้เล่นอัตโนมัติ ---------- */
function makeCard(prefix, title, optional) {
  var inputs = FIELDS.map(function (f) {
    var extra = ' type="text" autocomplete="off"';
    if (f.k === "uid") {
      extra = ' type="text" inputmode="numeric" autocomplete="off" spellcheck="false"';
    }
    return '<div><label>' + f.l + '</label>' +
           '<input name="' + prefix + '_' + f.k + '"' + extra +
           ' placeholder="' + f.ph + '"' +
           (optional ? '' : ' data-req="1"') + '></div>';
  }).join("");

  return '<div class="card"><strong>' + title + '</strong>' +
         '<div class="grid">' + inputs + '</div></div>';
}

var mainHTML = "";
for (var i = 1; i <= PLAYER_COUNT; i++) {
  mainHTML += makeCard("p" + i, "PLAYER " + i, false);
}
document.getElementById("mainList").innerHTML = mainHTML;
document.getElementById("subList").innerHTML  = makeCard("sub", "ตัวสำรอง (ไม่บังคับ)", true);

/* ---------- 2) QR Code + ลิงก์กลุ่มไลน์ ---------- */
var qrLink = document.getElementById("qrLink");
var qrImg  = document.getElementById("qrImg");
if (qrLink) qrLink.href = GROUP_LINK;
if (qrImg)  qrImg.src   = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(GROUP_LINK);

/* ---------- 3) ตัวช่วย ---------- */
function val(name) {
  var el = document.querySelector('[name="' + name + '"]');
  return el ? el.value.trim() : "";
}

function grab(prefix) {
  return {
    name:    val(prefix + "_name"),
    nick:    val(prefix + "_nick"),
    uid:     val(prefix + "_uid"),
    room:    val(prefix + "_room"),
    gpa:     val(prefix + "_gpa"),
    contact: val(prefix + "_contact")
  };
}

function showErr(msg) {
  var box = document.getElementById("errBox");
  if (!box) { alert(msg); return false; }
  box.style.display = "block";
  box.innerText = "⚠ " + msg;
  box.scrollIntoView({ behavior: "smooth", block: "center" });
  return false;
}

/* ---------- 4) ส่งข้อมูลเข้า Google Sheet ---------- */
document.getElementById("form").addEventListener("submit", function (e) {
  e.preventDefault();

  var errBox = document.getElementById("errBox");
  if (errBox) errBox.style.display = "none";

  /* ตรวจข้อมูลทีม */
  if (!val("team_name"))    return showErr("กรุณากรอกชื่อทีม");
  if (!val("team_leader"))  return showErr("กรุณากรอกชื่อหัวหน้าทีม");
  if (!val("team_contact")) return showErr("กรุณากรอกเบอร์ติดต่อหัวหน้าทีม");

  /* ตรวจผู้เล่นหลักให้ครบทุกช่อง */
  var empty = [];
  document.querySelectorAll('[data-req="1"]').forEach(function (el) {
    if (el.value.trim() === "") empty.push(el);
  });
  if (empty.length > 0) {
    empty[0].focus();
    return showErr("กรอกข้อมูลผู้เล่นหลักไม่ครบ (ขาดอีก " + empty.length + " ช่อง)");
  }

  /* ตรวจ UID ซ้ำ — ไม่จำกัดความยาว เช็คแค่ห้ามซ้ำ */
  var uids = [];
  for (var i = 1; i <= PLAYER_COUNT; i++) {
    var u = val("p" + i + "_uid");
    if (uids.indexOf(u) !== -1) {
      return showErr("UID ซ้ำกัน กรุณาตรวจสอบผู้เล่นคนที่ " + i);
    }
    uids.push(u);
  }

  /* รวมข้อมูลทั้งหมด */
  var data = {
    team_name:    val("team_name"),
    team_leader:  val("team_leader"),
    team_contact: val("team_contact"),
    players:      [],
    substitute:   grab("sub")
  };
  for (var j = 1; j <= PLAYER_COUNT; j++) {
    data.players.push(grab("p" + j));
  }

  /* ส่งไป Google Apps Script */
  var btn = document.querySelector(".send");
  var oldText = btn ? btn.textContent : "";
  if (btn) { btn.disabled = true; btn.textContent = "กำลังส่งข้อมูล..."; }

  fetch(GAS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data)
  })
  .then(function () {
    var done = document.getElementById("done");
    if (done) done.style.display = "flex";
    else alert("ลงทะเบียนสำเร็จ!");
  })
  .catch(function () {
    showErr("ส่งข้อมูลไม่สำเร็จ กรุณาเช็คอินเทอร์เน็ตแล้วลองใหม่");
  })
  .then(function () {
    if (btn) { btn.disabled = false; btn.textContent = oldText; }
  });
});
