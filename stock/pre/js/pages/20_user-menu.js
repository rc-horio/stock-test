document.addEventListener("DOMContentLoaded", () => {
  // ログインチェック
  if (sessionStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "index.html";
    return;
  }

  // 遷移イベント
  const stockBtn = document.getElementById("stockContentsBtn");
  stockBtn.addEventListener("click", () => {
    window.location.href = "./21_stock-contents.html";
  });

  // ログアウト処理
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("isLoggedIn");
    window.location.href = "index.html";
  });
});
