/* ══════════════ ตั้งค่า (แก้แค่ตรงนี้) ══════════════ */
var GAS_URL      = "https://script.google.com/macros/s/AKfycbyPHYheghgR9MoXmaljrkxR9Qwf1f-6lUs6uM2mSEDPEVraZyQQiVCp1DIMsnHEJ6vmDA/exec";
var GROUP_LINK   = "https://line.me/ti/g/642AHg2T5x";
var PLAYER_COUNT = 5;
/* ═══════════════════════════════════════════════ */

var FIELDS = [
  { k: "name",    l: "ชื่อ-นามสกุล", ph: "เช่น สมชาย ใจดี" },
  { k: "nick",    l: "ชื่อในเกม",    ph: "IGN" },
  { k: "uid",     l: "UID",          ph: "ตัวเลข ID ในเกม" },
  { k: "room",    l: "ห้อง",         ph: "เช่น ม.5/2" },
  { k: "gpa",     l: "เกรดเฉลี่ย",   ph: "เช่น 3.25" },
  { k: "contact", l: "เบอร์ / IG",   ph: "ช่องทางติดต่อ" }
];

/* ---------- 1) สร้างช่องกรอกอัตโนมัติ ---------- */
function makeCard(prefix, title, optional) {
  var inputs = FIELDS.map(function (f) {
    return '<div><label>' + f.l + '</label>' +
           '<input name="' + prefix + '_' + f.k + '" placeholder="' + f.ph + '"' +
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
document.getElementById("qrLink").href = GROUP_LINK;
document.getElementById("qrImg").src =
  "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(GROUP_LINK);

/* ---------- 3) ตัวช่วยอ่านค่า ---------- */
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
  box.style.display = "block";
  box.innerText = msg;
  box.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- 4) ส่งข้อมูลเข้า Google Sheet ---------- */
document.getElementById("form").addEventListener("submit", function (e) {
  e.preventDefault();

  var errBox = document.getElementById("errBox");
  errBox.style.display = "none";

  // ตรวจข้อมูลทีม
  if (!val("team_name"))    return showErr("กรุณากรอกชื่อทีม");
  if (!val("team_leader"))  return showErr("กรุณากรอกชื่อหัวหน้าทีม");
  if (!val("team_contact")) return showErr("กรุณากรอกเบอร์ติดต่อหัวหน้าทีม");

  // ตรวจผู้เล่นหลักให้ครบทุกช่อง
  var empty = [];
  document.querySelectorAll('[data-req="1"]').forEach(function (el) {
    if (el.value.trim() === "") empty.push(el);
  });
  if (empty.length > 0) {
    empty[0].focus();
    return showErr("กรอกข้อมูลผู้เล่นหลักไม่ครบ (ขาดอีก " + empty.length + " ช่อง)");
  }

  // ตรวจ UID ซ้ำ
  var uids = [];
  for (var i = 1; i <= PLAYER_COUNT; i++) {
    var u = val("p" + i + "_uid");
    if (uids.indexOf(u) !== -1) return showErr("UID ซ้ำกัน กรุณาตรวจสอบผู้เล่นคนที่ " + i);
    uids.push(u);
  }

  // รวมข้อมูล
  var data = {
    team_name:    val("team_name"),
    team_leader:  val("team_leader"),
    team_contact: val("team_contact"),
    players:      [],
    substitute:   grab("sub")
  };
  for (var j = 1; j <= PLAYER_COUNT; j++) data.players.push(grab("p" + j));

  // ส่ง
  var btn = document.querySelector(".send");
  btn.disabled = true;
  btn.textContent = "กำลังส่งข้อมูล...";

  fetch(GAS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data)
  })
  .then(function () {
    document.getElementById("done").style.display = "flex";
  })
  .catch(function () {
    showErr("ส่งข้อมูลไม่สำเร็จ กรุณาเช็คอินเทอร์เน็ตแล้วลองใหม่");
  })
  .finally(function () {
    btn.disabled = false;
    btn.textContent = "ส่งข้อมูลลงทะเบียน";
  });
});
