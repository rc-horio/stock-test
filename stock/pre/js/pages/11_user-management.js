document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  const role = sessionStorage.getItem("userRole");

  if (!isLoggedIn || role !== "admin") {
    window.location.href = "index.html";
    return;
  }

  // 「メニューに戻る」 → 管理者メニューへ
  document.getElementById("backToMenuBtn").addEventListener("click", () => {
    window.location.href = "10_admin-menu.html";
  });

  // 「ログアウト」 → ログイン画面へ
  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });

  document.getElementById("addUserBtn")?.addEventListener("click", () => {
    alert("ユーザー追加（未実装）");
  });
});
