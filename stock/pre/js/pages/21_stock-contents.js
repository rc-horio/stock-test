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
  const allClasses = Array.from({ length: 10 }, (_, i) => `m_${(i + 1) * 100}`);

  // valueに応じて非表示にするクラスを定義
  const classMap = {
    "0100": allClasses.filter((cls) => cls !== "m_100"),
    "0200": allClasses.filter((cls) => cls !== "m_200"),
    "0300": allClasses.filter((cls) => cls !== "m_300"),
    "0400": allClasses.filter((cls) => cls !== "m_400"),
    "0500": allClasses.filter((cls) => cls !== "m_500"),
    "0600": allClasses.filter((cls) => cls !== "m_600"),
    "0700": allClasses.filter((cls) => cls !== "m_700"),
    "0800": allClasses.filter((cls) => cls !== "m_800"),
    "0900": allClasses.filter((cls) => cls !== "m_900"),
    1000: allClasses.filter((cls) => cls !== "m_1000"),
  };

  const showAll = () => {
    allClasses.forEach((cls) => {
      Array.from(document.getElementsByClassName(cls)).forEach((el) =>
        el.removeAttribute("id")
      );
    });
  };

  const hide = (classNames) => {
    classNames.forEach((cls) => {
      Array.from(document.getElementsByClassName(cls)).forEach((el) =>
        el.setAttribute("id", "m_none")
      );
    });
  };

  const select = document.getElementById("select");

  select.addEventListener("change", () => {
    const val = select.value;
    showAll();
    if (classMap[val]) {
      hide(classMap[val]);
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
