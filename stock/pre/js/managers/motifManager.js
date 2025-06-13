import { openTransitionModal } from "./transitionManager.js";
import { openSharedModal } from "../shared/sharedModal.js";
import { CDN_BASE } from "../shared/util.js";
import { flashElement } from "../shared/feedback.js";

let footerItemRef = null;
let internalMotifData = [];

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

/* ================================================================
   Motif 一覧を生成（グリッド側）
   ================================================================= */
export function buildMotifList(csvArray, container) {
  internalMotifData = parseMotifData(csvArray);

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
        name,
        num,
        droneType,
        h,
        w,
        d,
        len,
        _truncate, // 8列目は無視
        season,
        category,
        popular,
      ]) => {
        // 4桁ゼロ埋め＋サニタイズ名
        const fileName = `${String(id).padStart(4, "0")}_${name}`;

        return {
          id: id || "-",
          motifName: name || "-",
          planeNum: num || "-",
          droneType: droneType || "-",
          fileName, // ←生成したファイル名
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

  // （★ローカルファイルから取得する）
  // <img src="./assets/image/motif/icon/${fileName}.jpg"

  // （★R3から取得）
  // <img src="${CDN_BASE}/assets/image/motif/icon/${fileName}.jpg"

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
