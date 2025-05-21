document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = loginForm.username.value.trim();
    const password = loginForm.password.value.trim();

    // ユーザー認証
    if (username === "test" && password === "test") {
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", "user");
      window.location.href = "20_user-menu.html";
    } else if (username === "admin" && password === "admin") {
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", "admin");
      window.location.href = "10_admin-menu.html";
    } else {
      loginError.textContent = "ユーザー名またはパスワードが正しくありません。";
      loginError.classList.add("show");
    }
  });
});
