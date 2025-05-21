// -------------------------------------------------------------
// 認証 / 認可 API ルーター（画面表示はすべて index.html 側で制御）
// -------------------------------------------------------------
import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";

const router = Router();

// ----------------------------------------
// POST /login：ログイン認証
// ----------------------------------------
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log("💬 ログイン試行:", username);

  const user = db.data.users.find((u) => u.username === username);
  if (!user) {
    console.log("❌ ユーザー名が存在しません");
    return res
      .status(401)
      .json({ success: false, message: "ユーザー名エラー" });
  }

  if (!bcrypt.compareSync(password, user.hash)) {
    console.log("❌ パスワードが一致しません");
    return res
      .status(401)
      .json({ success: false, message: "パスワードエラー" });
  }

  req.session.userId = user.id;
  req.session.save(
    () => res.json({ success: true, role: user.role })
  );
});

// ----------------------------------------
// POST /logout：ログアウト（セッション削除）
// ----------------------------------------
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ----------------------------------------
// GET /session-check：ログイン状態の確認
// ----------------------------------------
router.get("/session-check", async (req, res) => {
  try {
    // DB読み込みが未実行のケースに備え、強制読み込み
    await db.read();
    db.data ||= { users: [] };

    const user = db.data.users.find((u) => u.id === req.session.userId);

    if (user) {
      res.json({ loggedIn: true, role: user.role });
    } else {
      res.json({ loggedIn: false });
    }
  } catch (err) {
    console.error("❌ /session-check エラー:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ----------------------------------------
// GET /login：誤アクセス対策で禁止
// ----------------------------------------
router.get("/login", (_req, res) => {
  res.status(403).send("Forbidden");
});

export default router;
