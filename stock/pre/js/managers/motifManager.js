import { openTransitionModal } from "./transitionManager.js";
import { openSharedModal } from "../shared/sharedModal.js";
import { flashElement } from "../shared/feedback.js";

let footerItemRef = null;
let internalMotifData = [];
let originalOrder = [];
// 現在の並び替え状態
let currentSortKey = "";
// 読み込んだ画像枚数
let loadedCount = 0;

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
      rebuildPlusButtons();
    },
  });
}

/* ====================== ハイライト制御 ======================= */
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

/* ---------- 日付を ISO にしてタイムスタンプ取得 ---------- */
function toTimestamp(str) {
  if (!str || str === "-") return 0;
  const iso = str.replace(/\//g, "-");
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/* ================================================================
   Motif 一覧を生成（グリッド側）
   ================================================================= */
export function buildMotifList(csvArray, container) {
  internalMotifData = parseMotifData(csvArray);
  originalOrder = [...internalMotifData];

  internalMotifData.forEach((m) => {
    // モチーフ画像の読み込み（★ローカルファイルから取得）
    const imgPath = `./assets/image/motif/icon/${m.fileName}.jpg`;

    // モチーフ画像の読み込み（★R2から取得）
    // const imgPath = `${CDN_BASE}/assets/iamge/motif/icon/${m.fileName}.jpg`;

    const plane = Number(m.planeNum); // 例 145, 697 …
    const group100 = Math.floor(plane / 100) * 100; // 145→100, 697→600

    // 画像が存在するかチェック
    const img = new Image();
    img.src = imgPath;

    img.onload = () => {
      const section = document.createElement("section");
      // 画像ロード完了をカウントし、全件そろったら再ソート
      loadedCount++;
      if (loadedCount === internalMotifData.length && currentSortKey)
        sortMotifs(currentSortKey);
      section.className = `m_${m.planeNum} m_${group100}`;

      if (m.season && m.season !== "-") {
        section.classList.add(`season_${m.season}`);
      }
      if (m.category && m.category !== "-") {
        section.classList.add(`category_${m.category}`);
      }
      if (m.popular && m.popular !== "-") {
        section.classList.add(`popular_${m.popular}`);
      }
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
        const img = e.target;
        // モチーフ動画の読み込み（★ローカルファイルから取得）
        const videoPath = `./assets/image/motif/video/${m.fileName}.mp4`;

        // モチーフ動画の読み込み（★R2 から取得）
        // const videoPath = `${CDN_BASE}/assets/image/motif/video/${m.fileName}.mp4`;

        const info = `縦:${img.dataset.height} / 横:${img.dataset.width} / 奥行:${img.dataset.depth} / 総尺:${img.dataset.length}`;

        openSharedModal({
          videoPath,
          droneType: "",
          infoText: info,
          selectData: null,
          onInput: () => addMotifToFooter(m.fileName),
        });
      });

      container.insertAdjacentElement("beforebegin", section);
    };

    img.onerror = () => {
      console.warn(`画像が見つかりません: ${imgPath}`);
      loadedCount++;
      if (loadedCount === internalMotifData.length && currentSortKey)
        sortMotifs(currentSortKey);
    };
  });
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
        // 4桁ゼロ埋め
        const fileName = `${String(id).padStart(4, "0")}_${name}`;

        return {
          id: id || "-",
          dateValue: toTimestamp(date),
          motifName: name || "-",
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
      const values = Object.values(m);
      const allEmpty = values.every((v) => v === "-");
      const onlyIdExists =
        m.id !== "-" && values.slice(1).every((v) => v === "-");
      return !(allEmpty || onlyIdExists);
    });
}
export const getMotifData = () => internalMotifData;

/* ================================================================
   フッター操作系
   ================================================================= */
function addMotifToFooter(fileName) {
  if (!footerItemRef) return;
  const motifEl = createMotifElement(fileName);
  const landing = footerItemRef.querySelector(".landingPlaceholder");
  footerItemRef.insertBefore(motifEl, landing);
  flashElement(motifEl);
  rebuildPlusButtons();
}

export function cancelMotif(motifEl) {
  motifEl.remove();
  rebuildPlusButtons();
}

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

export function createDividerPlus() {
  const div = document.createElement("div");
  div.className = "footerIcon transitionPlaceholder plusBtn";
  div.innerHTML = `<div class="tlBox">トランジションを<br>選択する</div>`;
  div.addEventListener("click", () => openTransitionModal(div));
  return div;
}

/* =================== “＋” 再配置 =================== */
export function adjustPlusButtons() {
  rebuildPlusButtons();
}

function rebuildPlusButtons() {
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
   ソート（外部から呼び出し）
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
   フィルター＋並び替え リセット
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
