import { loadCSV, parseCSV } from "../shared/util.js";

/* -------------------- 定数 -------------------- */
const TYPES = {
  takeoff: { label: "離陸", className: "takeoffPlaceholder" },
  landing: { label: "着陸", className: "landingPlaceholder" },
};

const CSV_PATH = "./assets/csv/takeoffLanding.csv"; // ★

// -------------------- 状態 --------------------
let footerItemRef = null;
let tlData = []; // ★ CSV を整形した配列

/* -------------------- 初期化 -------------------- */
export function initTakeoffLanding(footerEl) {
  footerItemRef = footerEl;

  // CSV 読み込み
  loadCSV(CSV_PATH, (text) => {
    tlData = parseCSV(text)
      .slice(1) // ヘッダ除去
      .filter((r) => r[3]) // 画像名必須
      .map(([id, name, comment, file]) => ({
        id,
        name,
        comment,
        file,
      }));
  });

  footerEl.appendChild(createPlaceholder("takeoff"));
  footerEl.appendChild(createPlaceholder("landing"));
}

/* -------------------- プレースホルダー -------------------- */
function createPlaceholder(type, attachClick = true) {
  const info = TYPES[type];
  const div = document.createElement("div");
  div.className = `footerIcon tlPlaceholder ${info.className}`;
  div.dataset.tlType = type;
  div.innerHTML = `<div class="tlBox">${info.label}</div>`;
  if (attachClick) div.onclick = () => openTlModal(div, type);
  return div;
}

/* -------------------- モーダル -------------------- */
function openTlModal(targetPlaceholder, type) {
  // ── 他パネルを閉じる（Transition / Shared）────
  const transMask = document.getElementById("transitionModalMask");
  if (transMask && !transMask.classList.contains("hidden")) transMask.click();

  const sharedMask = document.getElementById("sharedModalMask");
  if (sharedMask && !sharedMask.classList.contains("hidden"))
    sharedMask.click();

  const mask = document.getElementById("tlModalMask");
  const modal = document.getElementById("tlModal");
  const grid = document.getElementById("tlGrid");
  const closeX = document.getElementById("tlModalClose");

  document.getElementById("tlModalHeading").textContent =
    type === "takeoff"
      ? "離陸アニメーションを選択してください"
      : "着陸アニメーションを選択してください";

  grid.innerHTML = "";

  /* ★ CSV の行ごとに動画カードを生成 */
  tlData.forEach(({ file, name }) => {
    const card = document.createElement("div");
    card.className = "tlCard";
    card.innerHTML = `
        <video muted autoplay loop playsinline preload="metadata">
          <source src="./assets/image/takeoffLanding/video/${file}.mp4" type="video/mp4">
        </video>
        <div style="color:#fff;font-size:12px;text-align:center;margin-top:4px;">${name}</div>
    `;
    card.querySelector("video").onclick = () => {
      replacePlaceholderWithIcon(targetPlaceholder, file, type);
      closePanel();
    };
    grid.appendChild(card);
  });

  const closePanel = () => {
    modal.classList.add("hidden");
    mask.classList.add("hidden");
    grid.querySelectorAll("video").forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
    document.removeEventListener("click", outsideWatcher);
  };
  mask.onclick = closePanel;
  closeX.onclick = closePanel;
  const outsideWatcher = (e) => {
    if (!modal.contains(e.target) && !mask.contains(e.target)) closePanel();
  };
  setTimeout(() => document.addEventListener("click", outsideWatcher));

  modal.classList.remove("hidden");
  mask.classList.remove("hidden");
  grid.querySelectorAll("video").forEach((v) => v.play().catch(() => {}));
}

/* -------------------- アイコンへ置換 -------------------- */
function replacePlaceholderWithIcon(placeholder, fileName, tlType) {
  placeholder.onclick = null;
  placeholder.classList.remove("tlPlaceholder");
  placeholder.innerHTML = `
      <img src="./assets/image/takeoffLanding/icon/${fileName}.jpg"
           class="container"
           data-type="${tlType}"
           data-filename="${fileName}">
      <div class="footerItemClose tlCancel">Cancel</div>
  `;
}

/* -------------------- Cancel -------------------- */
export function cancelTakeoffLanding(iconWrapper) {
  const type =
    iconWrapper.dataset.tlType ||
    iconWrapper.querySelector("img")?.dataset.type;
  if (!type) return;

  const silent = createPlaceholder(type, false);
  iconWrapper.replaceWith(silent);
  setTimeout(() => {
    silent.onclick = () => openTlModal(silent, type);
  });
}
