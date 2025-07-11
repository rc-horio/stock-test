import { openTransitionModal } from "./transitionManager.js";
import { flashElement } from "../shared/feedback.js";

let footerItemRef = null;
let internalMotifData = [];
let originalOrder = [];
// 現在の並び替え状態
let currentSortKey = "";
// 読み込んだ画像枚数
let loadedCount = 0;

/* ---------- 日付を ISO にしてタイムスタンプ取得 ---------- */
function toTimestamp(str) {
  if (!str || str === "-") return 0;
  const iso = str.replace(/\//g, "-");
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/* ================================================================
   CSV パースヘルパ
   ================================================================= */
function parseMotifData(csvArray) {
  const [, ...rows] = csvArray;
  return rows
    .map(
      ([
        id,
        date,
        name,
        _num,
        droneType,
        h,
        w,
        d,
        len,
        truncate,
        season,
        category,
        popular,
      ]) => {
        // --- ID/Name をサニタイズ ----------------------------------
        const rawId = id && String(id).trim();
        const safeId = rawId ? String(rawId).padStart(4, "0") : ""; // ID が無ければ空

        const rawName = name && String(name).trim();
        const safeName = rawName && rawName !== "-" ? rawName : ""; // 空文字または "-" を無視

        // ID も名前も無い行は後でフィルタ
        const fileName = [safeId, safeName].filter(Boolean).join("_"); // 空要素を除いて join

        return {
          skip: fileName === "", // のちほど除外
          id: safeId || "-",
          dateValue: toTimestamp(date),
          motifName: safeName || "-",
          planeNum: truncate || "-",
          droneType: droneType || "-",
          fileName,
          height: h || "-",
          width: w || "-",
          depth: d || "-",
          length: len || "-",
          season: season || "-",
          category: category || "-",
          popular: popular || "-",
        };
      }
    )
    .filter((m) => {
      // 画像ファイル名が生成できない（ID/Name 無し）は除外
      if (m.skip) return false;

      // すべて "-" なら除外
      const values = Object.values({
        ...m,
        skip: undefined,
        fileName: undefined,
      });
      const allEmpty = values.every((v) => v === "-");
      const onlyIdExists =
        m.id !== "-" && values.slice(1).every((v) => v === "-");
      return !(allEmpty || onlyIdExists);
    });
}
export const getMotifData = () => internalMotifData;

/* ================================================================
   モチーフ一覧を生成（グリッド側）
   ================================================================= */
export function buildMotifList(csvArray, container) {
  internalMotifData = parseMotifData(csvArray);

  internalMotifData.forEach((m) => {
    const imgPath = `./assets/image/motif/icon/${m.fileName}.jpg`;

    const img = new Image();
    img.src = imgPath;

    img.onload = () => {
      const section = document.createElement("section");
      loadedCount++;
      if (loadedCount === internalMotifData.length && currentSortKey) {
        sortMotifs(currentSortKey);
      }

      const group100 = Math.floor(Number(m.planeNum) / 100) * 100;
      section.className = `m_${m.planeNum} m_${group100}`;

      if (m.season && m.season !== "-")
        section.classList.add(`season_${m.season}`);
      if (m.category && m.category !== "-")
        section.classList.add(`category_${m.category}`);
      if (m.popular && m.popular !== "-")
        section.classList.add(`popular_${m.popular}`);

      section.innerHTML = `
        <div class="singleArray">
          <div class="box-img">
            <a>
              <img src="${imgPath}" 
                   data-height="${m.height}" data-width="${m.width}"
                   data-depth="${m.depth}" data-length="${m.length}" 
                   alt="${m.fileName}">
            </a>
            <p>${m.motifName} / ${m.planeNum}機 / ${m.droneType}</p>
          </div>
        </div>`;

      m.el = section;
      section.querySelector("a").addEventListener("click", (e) => {
        const targetImg = e.target;
        const videoPath = `./assets/image/motif/video/${m.fileName}.mp4`;
        const info = `縦:${targetImg.dataset.height} / 横:${targetImg.dataset.width} / 奥行:${targetImg.dataset.depth} / 総尺:${targetImg.dataset.length}`;

        openSharedModal({
          videoPath,
          infoText: info,
          motifId: m.id,
          motifName: m.motifName,
          selectData: null,
          onInput: () => addMotifToFooter(m.fileName),
        });
      });

      container.insertAdjacentElement("beforebegin", section);
    };

    img.onerror = () => {
      console.warn(`画像が見つかりません: ${imgPath}`);
      loadedCount++;
      if (loadedCount === internalMotifData.length && currentSortKey) {
        sortMotifs(currentSortKey);
      }
    };
  });
}

/* ================================================================
   モチーフエレメントを作成
   ================================================================= */

export function createMotifElement(fileName) {
  const div = document.createElement("div");
  div.className = "footerIcon motifIcon";
  div.innerHTML = `
    <img src="./assets/image/motif/icon/${fileName}.jpg"
         class="container"
         data-type="motif"
         data-filename="${fileName}">
    <div class="footerItemClose motifCancel">Cancel</div>`;
  return div;
}

/* ================================================================
   モチーフソート（外部から呼び出し）
   ================================================================= */
function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0; // "-" や "" は 0 扱い
}
export function sortMotifs(order) {
  currentSortKey = order;
  if (!internalMotifData.length) return;

  const sorted = [...internalMotifData].sort((a, b) => {
    const nA = toInt(a.planeNum);
    const nB = toInt(b.planeNum);

    switch (order) {
      case "planesAsc":
        return nA - nB;
      case "planesDesc":
        return nB - nA;
      case "dateAsc":
        return a.dateValue - b.dateValue;
      case "dateDesc":
        return b.dateValue - a.dateValue;
      default:
        return 0;
    }
  });

  const grid = document.getElementById("setGrid");
  sorted.forEach((m) => m.el && grid.appendChild(m.el));

  const colorList = document.getElementById("color_list");
  colorList && grid.appendChild(colorList);
}

/* ================================================================
   フィルター＋ソート リセット
   ================================================================= */
export function resetMenus() {
  /* 1) ハイライト解除 */
  document
    .querySelectorAll("#filterMenu li.selected,#sortMenu li.selected")
    .forEach((li) => li.classList.remove("selected"));

  /* 2) フィルター解除 */
  if (typeof resetVisibility === "function") resetVisibility();

  /* 3) 並び替え解除（初期 DOM 順に戻す） */
  currentSortKey = "";
  const grid = document.getElementById("setGrid");
  originalOrder.forEach((m) => m.el && grid.appendChild(m.el));
  const colorList = document.getElementById("color_list");
  colorList && grid.appendChild(colorList);
}

/* ================================================================
   モーダルを表示する処理
   ================================================================= */
function openSharedModal({
  videoPath,
  infoText = "",
  motifId = "",
  motifName = "",
  onInput = null,
}) {
  const modal = document.getElementById("motifModal");
  const mask = document.getElementById("motifModalMask");
  const modalBody = modal.querySelector(".motifModalBody");
  const selectBox = document.getElementById("motifModalSelect");
  const video = document.getElementById("motifVideo");
  const videoSource = document.getElementById("motifVideoSource");
  const infoBox = document.getElementById("motifInfoText");
  const inputBtn = document.getElementById("motifModalInput");
  const closeBtn = document.getElementById("motifModalClose");

  /* ---------- ラベル生成 / 配置 ---------- */
  let labelBox = document.getElementById("motifLabel");
  if (!labelBox) {
    labelBox = document.createElement("div");
    labelBox.id = "motifLabel";
    labelBox.className = "motifLabel";
    const videoContainer = modalBody.querySelector(".motifVideoContainer");
    modalBody.insertBefore(labelBox, videoContainer); // videoContainer の直前に配置（枠外）
  }
  labelBox.textContent =
    motifId || motifName ? `No.${motifId}  ${motifName}` : "";

  /* ---------- 初期化 ---------- */
  infoBox.textContent = infoText;

  /* ---------- 動画再生 ---------- */
  videoSource.src = videoPath;
  video.load();
  video.play();

  /* ---------- ボタン / 閉じる ---------- */
  inputBtn.onclick = () => {
    if (onInput) onInput(selectBox?.value || null);
    closeSharedModal();
  };
  closeBtn.onclick = closeSharedModal;
  mask.onclick = closeSharedModal;

  modal.classList.remove("hidden");
  mask.classList.remove("hidden");
}

/* ================================================================
   モーダルを閉じる処理
   ================================================================ */
export function closeSharedModal() {
  const modal = document.getElementById("motifModal");
  const mask = document.getElementById("motifModalMask");
  const video = document.getElementById("motifVideo");
  const labelBox = document.getElementById("motifLabel");

  modal.classList.add("hidden");
  mask.classList.add("hidden");

  video.pause();
  video.currentTime = 0;
  if (labelBox) labelBox.textContent = "";
}

/* ================================================================
   フッター操作系
   ================================================================= */
function addMotifToFooter(fileName) {
  if (!footerItemRef) return;
  const motifEl = createMotifElement(fileName);
  const landing = footerItemRef.querySelector(".landingPlaceholder");
  footerItemRef.insertBefore(motifEl, landing);
  flashElement(motifEl);
  adjustPlusButtons();
}

/* ================================================================
   フッターモチーフキャンセル
   ================================================================= */
export function cancelMotif(motifEl) {
  motifEl.remove();
  adjustPlusButtons();
}

/* ================================================================
   フッター“＋” 配置
   ================================================================= */
export function createDividerPlus() {
  const div = document.createElement("div");
  div.className = "footerIcon transitionPlaceholder plusBtn";
  div.innerHTML = `<div class="tlBox">トランジションを<br>選択する</div>`;
  div.addEventListener("click", () => openTransitionModal(div));
  return div;
}

/* ================================================================
   フッター“＋” 再配置
   ================================================================= */
export function adjustPlusButtons() {
  footerItemRef.querySelectorAll(".plusBtn").forEach((p) => p.remove());

  const nodes = Array.from(footerItemRef.children);
  nodes.forEach((node, idx) => {
    if (!node.classList.contains("motifIcon")) return;

    const next = nodes[idx + 1];
    if (
      !next ||
      next.classList.contains("transitionIconWrapper") ||
      next.classList.contains("landingPlaceholder")
    ) {
      return;
    }
    node.after(createDividerPlus());
  });
}

/* ================================================================
   フッターにドラッグ＆ドロップ（Swap）を設定
   ================================================================ */
export function setFooterItem(el) {
  footerItemRef = el;

  Sortable.create(footerItemRef, {
    draggable: ".motifIcon, .transitionIconWrapper",
    filter:
      ".footerItemClose, .landingPlaceholder, .takeoffPlaceholder, .plusBtn",

    dragClass: "draggingIcon",
    ghostClass: "ghostIcon",
    swap: true,
    swapClass: "swapCandidate",

    forceFallback: false,
    animation: 150,

    /* ----- ドロップ可否 / ハイライト ----- */
    onMove(evt) {
      const d = evt.dragged;
      const r = evt.related;

      if (d.classList.contains("motifIcon"))
        return r.classList.contains("motifIcon");

      if (d.classList.contains("transitionIconWrapper"))
        return r.classList.contains("transitionIconWrapper");

      return false;
    },

    /* ----- ドロップ確定 ----- */
    onEnd(evt) {
      adjustPlusButtons();
    },
  });
}

/* ================================================================
   ハイライト制御
   ================================================================ */
let lastHighlight = null;
function highlight(target, ok) {
  clearHighlight();
  if (ok) {
    target.classList.add("dropTarget");
    lastHighlight = target;
    return true;
  }
  return false;
}
function clearHighlight() {
  if (lastHighlight) lastHighlight.classList.remove("dropTarget");
  lastHighlight = null;
}
