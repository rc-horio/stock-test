import { flashElement } from "../shared/feedback.js";

/* -------------------- 定数 -------------------- */
const TYPES = {
  takeoff: { label: "離陸を<br>選択する", className: "takeoffPlaceholder" },
  landing: { label: "着陸を<br>選択する", className: "landingPlaceholder" },
};

/* TL 選択肢（CSV 不使用版） */
const TL_CHOICES = {
  takeoff: [
    { name: "レインボー", file: "0231_離陸" },
    { name: "無点灯", file: "" },
  ],
  landing: [
    { name: "レインボー", file: "0232_着陸" },
    { name: "無点灯", file: "" },
  ],
};

/* -------------------- 状態 -------------------- */
let footerItemRef = null;

/* -------------------- 初期化 -------------------- */
export function initTakeoffLanding(footerEl) {
  footerItemRef = footerEl;
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
  // 既存パネルを閉じる（Transition / Shared）
  ["transitionModalMask", "sharedModalMask"].forEach((id) => {
    const mask = document.getElementById(id);
    if (mask && !mask.classList.contains("hidden")) mask.click();
  });

  const mask = document.getElementById("tlModalMask");
  const modal = document.getElementById("tlModal");
  const grid = document.getElementById("tlGrid");
  const closeX = document.getElementById("tlModalClose");

  document.getElementById("tlModalHeading").textContent =
    type === "takeoff"
      ? "離陸アニメーションを選択してください"
      : "着陸アニメーションを選択してください";

  grid.innerHTML = "";

  /* ★ 選択肢をボタン化 */
  TL_CHOICES[type].forEach(({ name, file }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = name === "無点灯" ? "tlTextBtn tlPlainBtn" : "tlTextBtn";
    btn.textContent = name;
    btn.onclick = () => {
      replacePlaceholder(targetPlaceholder, { name, file }, type);
      closePanel();
    };
    grid.appendChild(btn);
  });

  /* 開閉処理 */
  const closePanel = () => {
    modal.classList.add("hidden");
    mask.classList.add("hidden");
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
}

/* -------------------- 置換処理 -------------------- */
function replacePlaceholder(placeholder, { name, file }, tlType) {
  placeholder.onclick = null;
  placeholder.classList.remove("tlPlaceholder");
  flashElement(placeholder);

  if (name === "無点灯") {
    // テキストのみ
    placeholder.innerHTML = `
      <div class="container tlPlainText"
           data-type="${tlType}" data-filename="">
        無点灯
      </div>
      <div class="footerItemClose tlCancel">Cancel</div>
    `;
  } else {
    // 画像アイコン
    placeholder.innerHTML = `
      <div class="container tlPlainText"
           data-type="${tlType}" data-filename="">
        レインボー
      </div>
      <div class="footerItemClose tlCancel">Cancel</div>
    `;
  }
}

/* -------------------- Cancel -------------------- */
export function cancelTakeoffLanding(iconWrapper) {
  const type =
    iconWrapper.dataset.tlType ||
    iconWrapper.querySelector("[data-type]")?.dataset.type;
  if (!type) return;

  const silent = createPlaceholder(type, false);
  iconWrapper.replaceWith(silent);
  setTimeout(() => (silent.onclick = () => openTlModal(silent, type)));
}
