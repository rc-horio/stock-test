document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");

  const credentials = {
    test: "bd9dc5ab8b52ae7c9bc09042ef379d83bea457e98c80f75dc9d4c8a55a1d88f9",
    admin: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  };

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = loginForm.username.value.trim();
    const password = loginForm.password.value.trim();
    const hashedPassword = sha256(password);

    console.log(hashedPassword)

    // ユーザー認証
    if (credentials[username] && credentials[username] === hashedPassword) {
      console.log(hashedPassword)
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem(
        "userRole",
        username === "admin" ? "admin" : "user"
      );

      window.location.href =
        username === "admin" ? "10_admin-menu.html" : "20_user-menu.html";
    } else {
      console.log(hashedPassword)
      loginError.textContent = "ユーザー名またはパスワードが正しくありません。";
      loginError.classList.add("show");
    }
  });
});
