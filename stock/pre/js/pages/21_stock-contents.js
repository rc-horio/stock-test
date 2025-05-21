import { loadCSV, parseCSV } from "../shared/util.js";
import {
  buildMotifList,
  setFooterItem,
  cancelMotif,
} from "../managers/motifManager.js";
import {
  setTransitionData,
  cancelTransition,
} from "../managers/transitionManager.js";
import { PDFExporter } from "../shared/pdfExporter.js";
import {
  initTakeoffLanding,
  cancelTakeoffLanding,
} from "../managers/takeoffLandingManager.js";

// --------------------
// DOM参照
// --------------------
const footerItem = document.getElementById("footerItem");
const pdfOutputBtn = document.getElementById("PDFoutput");
const sharedModalSelect = document.getElementById("sharedModalSelect");
const select = document.getElementById("select");
const colorList = document.getElementById("color_list");

// --------------------
// 初期化処理
// --------------------
document.addEventListener("DOMContentLoaded", async () => {
  // ログイン状態チェック（ローカルセッションストレージ利用）
  if (sessionStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "index.html";
    return;
  }

  showMainUI();
});

function showMainUI() {
  initializeMainApp();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sessionStorage.removeItem("isLoggedIn");
      window.location.href = "index.html";
    });
  }

  const backToMenuBtn = document.getElementById("backToMenuBtn");
  if (backToMenuBtn) {
    backToMenuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "20_user-menu.html";
    });
  }
}

// --------------------
// 機体数フィルタの設定
// --------------------
function setupPlaneFilter() {
  select.addEventListener("change", () => {
    const val = select.value;
    const m100 = document.getElementsByClassName("m_100");
    const m300 = document.getElementsByClassName("m_300");
    const m500 = document.getElementsByClassName("m_500");

    const showAll = () =>
      [...m100, ...m300, ...m500].forEach((el) => el.removeAttribute("id"));
    const hide = (els) =>
      Array.from(els).forEach((el) => el.setAttribute("id", "m_none"));

    showAll();
    if (val === "0100") {
      hide(m300);
      hide(m500);
    } else if (val === "0300") {
      hide(m100);
      hide(m500);
    } else if (val === "0500") {
      hide(m100);
      hide(m300);
    }
  });
}

// --------------------
// キャンセル処理（Motif/Transition）
// --------------------
footerItem.addEventListener("click", (e) => {
  // Motif Cancel
  if (e.target.classList.contains("motifCancel")) {
    const motifEl = e.target.parentElement;
    cancelMotif(motifEl);
    return;
  }

  // Transition Cancel
  if (e.target.classList.contains("transitionCancel")) {
    const transitionEl = e.target.parentElement;
    cancelTransition(transitionEl);
    /* ★ ダブルクリックなども完全に殺す */
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    return;
  }

  // ★★ Take-off / Landing Cancel
  if (e.target.classList.contains("tlCancel")) {
    const tlEl = e.target.parentElement; // img ラッパ
    cancelTakeoffLanding(tlEl);
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
    return;
  }
});

function initializeMainApp() {
  // 💡 プレースホルダーを初期化（重複防止）
  document.querySelectorAll(".tlPlaceholder").forEach((el) => el.remove());

  // motifManager に footerItem をセット
  setFooterItem(footerItem);

  // 離陸／着陸プレースホルダを配置
  initTakeoffLanding(footerItem);

  // モチーフデータの読み込み
  loadCSV("./assets/csv/motifs.csv", (text) => {
    const csvArray = parseCSV(text);
    buildMotifList(csvArray, colorList);
  });

  // トランジションデータの読み込み
  loadCSV("./assets/csv/transitions.csv", (text) => {
    const transitionCsvArray = parseCSV(text);
    setTransitionData(transitionCsvArray);
  });

  // 機体数フィルタ設定
  setupPlaneFilter();

  // PDF出力ボタン設定
  const pdfExporter = new PDFExporter("#footerItem");
  pdfOutputBtn.addEventListener("click", () => {
    pdfExporter.export();
  });
}
