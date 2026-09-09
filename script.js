/* ══════════════════════════════════════════════════════════
   RoV TOURNAMENT — script.js
   เวอร์ชันสมบูรณ์ พร้อมใช้งานทันที
   ══════════════════════════════════════════════════════════ */

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

var mainBox = document.getElementById("mainList");
var subBox  = document.getElementById("subList");
if (mainBox) mainBox.innerHTML = mainHTML;
if (subBox)  subBox.innerHTML  = makeCard("sub", "ตัวสำรอง (ไม่บังคับ)", true);

/* ---------- 2) QR Code + ลิงก์กลุ่มไลน์ ---------- */
var qrLink = document.getElementById("qrLink");
var qrImg  = document.getElementById("qrImg");
if (qrLink) qrLink.href = GROUP_LINK;
if (qrImg)  qrImg.src   = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(GROUP_LINK);

/* ---------- 3) ฟังก์ชันตัวช่วย ---------- */
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

function showDone() {
  var done = document.getElementById("done");
  if (done) {
    done.style.display = "flex";
    done.classList.add("on");
  } else {
    alert("ลงทะเบียนสำเร็จ!");
  }
}

/* ---------- 4) ตัวส่งข้อมูลแบบกันค้าง ---------- */
function sendToSheet(data, callback) {
  var finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    callback();
  }

  // กันค้าง: ไม่ว่าจะเกิดอะไรขึ้น 4 วินาทีต้องไปต่อ
  setTimeout(finish, 4000);

  var payload = JSON.stringify(data);

  try {
    // วิธีที่ 1 — sendBeacon (ไม่รอ response จึงไม่มีทางค้าง)
    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
      if (navigator.sendBeacon(GAS_URL, blob)) {
        setTimeout(finish, 900);
        return;
      }
    }

    // วิธีที่ 2 — fetch สำรอง
    fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload
    }).then(finish).catch(finish);

  } catch (err) {
    finish();
  }
}

/* ---------- 5) ระบบส่งฟอร์ม ---------- */
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

  /* ตรวจ UID ซ้ำ (ไม่จำกัดความยาว เช็คแค่ห้ามซ้ำ) */
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

  /* ส่งข้อมูล */
  var btn = document.querySelector(".send");
  var oldText = btn ? btn.textContent : "ส่งข้อมูลลงทะเบียน";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "กำลังส่งข้อมูล...";
  }

  sendToSheet(data, function () {
    if (btn) {
      btn.disabled = false;
      btn.textContent = oldText;
    }
    showDone();
  });
});
