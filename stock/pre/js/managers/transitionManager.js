import { createDividerPlus,adjustPlusButtons } from "./motifManager.js";

/* -----------------------------  データ保持  ----------------------------- */
let transitionList = [];

export function setTransitionData(csvArray) {
  const [, ...rows] = csvArray;
  transitionList = rows
    .map(([id, name, comment, filename]) => ({ id, name, comment, filename }))
    .filter((t) => t.id);
}

/* 必要なら外部で参照 */
export const getTransitionData = () => transitionList;

/* -----------------------------  UI 生成系  ----------------------------- */
// ──────────────────────────────────────────────
//  他パネルをまとめて閉じるユーティリティ
// ──────────────────────────────────────────────
function closeExistingPanels() {
  const tlMask = document.getElementById("tlModalMask");
  if (tlMask && !tlMask.classList.contains("hidden")) tlMask.click();

  const sharedMask = document.getElementById("sharedModalMask");
  if (sharedMask && !sharedMask.classList.contains("hidden"))
    sharedMask.click();
}

/**
 * + を押したら呼ぶ。プレビュー 10 種を並べたパネルを開く。
 * @param {HTMLElement} targetPlusDiv
 */
export function openTransitionModal(targetPlusDiv) {
  closeExistingPanels();
  if (!transitionList.length) return;

  const mask = document.getElementById("transitionModalMask");
  const modal = document.getElementById("transitionModal");
  const grid = document.getElementById("transitionGrid");
  const closeX = document.getElementById("transitionModalClose");

  grid.innerHTML = "";

  /* プレビューカードを 10 個生成 (それ以上でも自動で並ぶ) */
  transitionList.forEach((t) => {
    const card = document.createElement("div");
    card.className = "transCard";

    card.innerHTML = `
              <video class="transPreview" muted autoplay loop playsinline preload="metadata">
                <source src="./assets/image/transition/video/${t.filename}.mp4" type="video/mp4">
              </video>`;

    /* 動画クリックで選択 */
    card.querySelector(".transPreview").onclick = () => {
      replacePlusWithTransition(targetPlusDiv, t.filename);
      closePanel();
    };

    grid.appendChild(card);
  });

  /* 開閉系 */
  const closePanel = () => {
    modal.classList.add("hidden");
    mask.classList.add("hidden");

    grid.querySelectorAll("video").forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
    document.removeEventListener("click", outsideWatcher);
  };
  mask.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    closePanel();
  };
  closeX.onclick = closePanel;

  /* ----- モーダル外クリックで閉じる (mask が無い領域もカバー) ----- */
  const outsideWatcher = (e) => {
    if (!modal.contains(e.target) && !mask.contains(e.target)) {
      e.stopPropagation();
      e.preventDefault();
      closePanel();
    }
  };

  setTimeout(() => document.addEventListener("click", outsideWatcher));

  modal.classList.remove("hidden");
  mask.classList.remove("hidden");

  grid.querySelectorAll("video").forEach((v) => v.play().catch(() => {}));
}

/**
 * + ボタンをトランジションアイコンに置換
 */
export function replacePlusWithTransition(oldPlusDiv, fileName) {
  const wrapper = document.createElement("div");
  wrapper.className = "footerIcon transitionIconWrapper";
  wrapper.innerHTML = `
        <img src="./assets/image/transition/icon/${fileName}.jpg"
             class="container"
             data-type="transition"
             data-filename="${fileName}">
        <div class="footerItemClose transitionCancel">Cancel</div>
    `;

  oldPlusDiv.replaceWith(wrapper);
  adjustPlusButtons();
}

/* -------------------------  Cancel → + に戻す  ------------------------- */
export function cancelTransition(iconWrapper) {
  if (!iconWrapper) return;

  /* ① クリック無効の仮プレースホルダー */
  const silent = document.createElement("div");
  silent.className = "divider tempPlaceholder";
  silent.textContent = "+";
  iconWrapper.replaceWith(silent);

  /* ② 次フレームで“本物”の＋（クリック可）を差し込む */
  setTimeout(() => {
    const realDivider = createDividerPlus(() =>
      openTransitionModal(realDivider)
    );
    silent.replaceWith(realDivider);
    adjustPlusButtons();
  });
}
