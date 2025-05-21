// motifManager.js – モチーフ一覧とフッター管理 (swap 対応版)
// -------------------------------------------------------------------
import { openTransitionModal } from "./transitionManager.js";
import { openSharedModal } from "../shared/sharedModal.js";

let footerItemRef = null; // フッター DOM
let internalMotifData = []; // CSV パース結果

/* ================================================================
   フッターにドラッグ＆ドロップ（Swap）を設定
   ================================================================ */
export function setFooterItem(el) {
  footerItemRef = el;

  Sortable.create(footerItemRef, {
    draggable: ".motifIcon, .transitionIconWrapper",
    filter:
      ".footerItemClose, .landingPlaceholder, .takeoffPlaceholder, .plusBtn",

    dragClass: "draggingIcon", // CSS で透明度など指定
    ghostClass: "ghostIcon",
    swap: true, // ← 追加
    swapClass: "swapCandidate", // （お好み。後述の CSS で枠線出し）

    forceFallback: false, // swap が自動で並べ替えを抑制するので不要
    animation: 150, // 多少つけても OK（見た目だけ）

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
      rebuildPlusButtons(); // “＋” を再配置
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

/* ========================= Swap ヘルパ ======================== */
function swapNodes(a, b) {
  const aNext = a.nextSibling;
  const bNext = b.nextSibling;
  const parent = a.parentNode;

  if (aNext === b) {
    parent.insertBefore(b, a);
  } else if (bNext === a) {
    parent.insertBefore(a, b);
  } else {
    parent.insertBefore(a, bNext);
    parent.insertBefore(b, aNext);
  }
}

/* ================================================================
   Motif 一覧を生成（グリッド側）
   ================================================================= */
export function buildMotifList(csvArray, container) {
  internalMotifData = parseMotifData(csvArray);

  internalMotifData.forEach((m) => {
    const imgPath = `./assets/image/motif/icon/${m.fileName}.jpg`;

    // 画像が存在するかチェック
    const img = new Image();
    img.src = imgPath;

    img.onload = () => {
      const section = document.createElement("section");
      section.className = `m_${m.planeNum}`;
      section.innerHTML = `
          <div class="singleArray">
            <div class="box-img">
              <a>
                <img src="${imgPath}" 
                    data-height="${m.height}" data-width="${m.width}"
                    data-depth="${m.depth}" data-length="${m.length}" 
                    alt="${m.fileName}">
              </a>
              <p>${m.motifName} / ${m.planeNum}機 / ${m.comment}</p>
            </div>
          </div>`;

      section.querySelector("a").addEventListener("click", (e) => {
        const img = e.target;
        const videoPath = `./assets/image/motif/video/${m.fileName}.mp4`;
        const info = `縦:${img.dataset.height} / 横:${img.dataset.width} / 奥行:${img.dataset.depth} / 総尺:${img.dataset.length}`;

        openSharedModal({
          videoPath,
          comment: "",
          infoText: info,
          selectData: null,
          onInput: () => addMotifToFooter(m.fileName),
        });
      });

      container.insertAdjacentElement("beforebegin", section);
    };

    img.onerror = () => {
      // 画像が存在しない場合はスキップ（何もしない）
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
    .map(([id, name, num, comment, file, , w, h, d, len]) => ({
      id: id || "-",
      motifName: name || "-",
      planeNum: num || "-",
      comment: comment || "-",
      fileName: file || "-",
      width: w || "-",
      height: h || "-",
      depth: d || "-",
      length: len || "-",
    }))
    .filter((m) => {
      const values = Object.values(m);
      const allEmpty = values.every((val) => val === "-");
      const onlyIdExists =
        m.id !== "-" && values.slice(1).every((val) => val === "-");
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
    <img src="./assets/image/motif/icon/${fileName}.jpg" class="container"
         data-type="motif" data-filename="${fileName}">
    <div class="footerItemClose motifCancel">Cancel</div>`;
  return div;
}

export function createDividerPlus() {
  const div = document.createElement("div");
  div.className = "divider plusBtn";
  div.textContent = "+";
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

/* ----------------  M → T → M … の順序保証（安全版）  ---------------- */
function restoreMTMOrder() {
  if (!footerItemRef) return;

  // 1) いま並んでいるアイコンを取得（landing はそのまま）
  const originals = Array.from(
    footerItemRef.querySelectorAll(
      ".motifIcon, .transitionIconWrapper, .landingPlaceholder"
    )
  );

  // 2) Motif と Transition を別々に取り出してキューにする
  const motifs = originals.filter((n) => n.classList.contains("motifIcon"));
  const transitions = originals.filter((n) =>
    n.classList.contains("transitionIconWrapper")
  );
  const landing = originals.find((n) =>
    n.classList.contains("landingPlaceholder")
  );

  // 3) 交互配列を作る: Motif → Transition → Motif → …
  const ordered = [];
  while (motifs.length || transitions.length) {
    if (motifs.length) ordered.push(motifs.shift());
    if (transitions.length) ordered.push(transitions.shift());
  }
  if (landing) ordered.push(landing); // landing は最後に固定

  // 4) DocumentFragment にまとめて差し替え
  const frag = document.createDocumentFragment();
  ordered.forEach((n) => frag.appendChild(n));
  footerItemRef.appendChild(frag); // これで一括置換完了
}
