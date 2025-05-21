document.addEventListener("DOMContentLoaded", () => {
  // 認証チェック
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  const role = sessionStorage.getItem("userRole");

  if (!isLoggedIn || role !== "admin") {
    window.location.href = "index.html";
    return;
  }

  // ✅ ユーザー管理ボタンで遷移
  document.getElementById("userManageBtn").addEventListener("click", () => {
    window.location.href = "11_user-management.html";
  });

  // 他ボタン（仮）
  document.getElementById("logBtn").addEventListener("click", () => {
    alert("ログ画面へ（未実装）");
  });

  document.getElementById("contentManageBtn").addEventListener("click", () => {
    alert("コンテンツ管理画面へ（未実装）");
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });
});
