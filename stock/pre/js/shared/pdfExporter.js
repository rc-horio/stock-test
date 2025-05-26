export class PDFExporter {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.template = null; // 初期は null
  }

  async loadTemplate() {
    if (this.template) return this.template; // キャッシュ
    const res = await fetch("./22_pdf-preview.html");
    const text = await res.text();

    // テンプレートだけ抽出（script タグ内の content）
    const match = text.match(
      /<script[^>]*id="pdf-template-v2"[^>]*>([\s\S]*?)<\/script>/i
    );
    if (!match) throw new Error("テンプレートが見つかりません");

    this.template = match[1]; // innerHTML（textContentに相当）
    return this.template;
  }

  async export() {
    await document.fonts.ready;
    const template = await this.loadTemplate(); // ← テンプレート読み込み

    let takeoffTitle = "";
    let landingTitle = "";

    const imgs = [...this.container.querySelectorAll("img")];
    if (!imgs.length) {
      alert("フッターに画像がありません。");
      return;
    }

    // 画像リストを先にスキャンして、離陸／着陸タイトルだけ拾っておく
    for (const img of imgs) {
      if (img.dataset.type === "takeoff") {
        takeoffTitle = img.dataset.filename || "";
      }
      if (img.dataset.type === "landing") {
        landingTitle = img.dataset.filename || "";
      }
    }

    // タイトルがあれば「離陸／着陸 + スペース + タイトル」、なければ「離陸／着陸」のみ
    const takeoffLabel = "離陸" + (takeoffTitle ? `　${takeoffTitle}` : "");
    const landingLabel = "着陸" + (landingTitle ? `　${landingTitle}` : "");
    const landingLabelHTML = `
      <div class="landing-label">${landingLabel}</div>
    `;

    const labelMap = {
      motif: "モチーフ",
      transition: "トランジション",
      takeoff: "離陸",
      landing: "着陸",
    };

    const entries = [];
    let motifIndex = 0;

    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];

      /* ─── モチーフではない場合は読み飛ばし ─── */
      if (img.dataset.type === "takeoff" || img.dataset.type === "landing") {
        continue;
      }

      /* ─── モチーフ ─── */
      motifIndex++;
      const dataURL = await this.#imgToDataURL(img);

      /* 直後にトランジションがあれば取り込み、ループを 1 つ飛ばす */
      let tlHTML = "";
      if (i + 1 < imgs.length && imgs[i + 1].dataset.type === "transition") {
        tlHTML = `<div class="tl-label">${imgs[i + 1].dataset.filename}</div>`;
        i++; // ← トランジション分をスキップ
      }

      entries.push(`
  <div class="entry">
    <div class="entry-number">${motifIndex}</div>
    <div class="entry-content">
      <img src="${dataURL}" class="motif-img">
      <div class="caption caption-side">
        <div class="caption-line title">${img.dataset.filename}</div>
        <div class="caption-line">機体数　${img.dataset.planes}</div>
        <div class="caption-line">サイズ　${img.dataset.size}</div>
        <div class="caption-line">時間　　${img.dataset.time}</div>
      </div>
      </div>
      </div>
      ${tlHTML}
`);
      // ⭐ 最後のモチーフの直後に着陸ラベルを追加
      if (
        motifIndex === imgs.filter((img) => img.dataset.type === "motif").length
      ) {
        entries.push(landingLabelHTML);
      }
    }

    /* ========= 2) 左右カラムに分割 ========== */
    const MAX_PER_COLUMN = 6;
    const leftCount =
      motifIndex < MAX_PER_COLUMN ? motifIndex + 1 : MAX_PER_COLUMN;

    const leftBlocks = entries.slice(0, leftCount).join("");
    const rightBlocks = entries.slice(leftCount).join("");

    /* ========= 3) テンプレートを DOM に挿入 ========== */
    const htmlString = template
      .replace("{{leftBlocks}}", leftBlocks)
      .replace("{{rightBlocks}}", rightBlocks)
      .replace("{{takeoffLabel}}", takeoffLabel);

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    Object.assign(tempDiv.style, {
      position: "fixed",
      left: "-9999px",
      top: 0,
      visibility: "visible",
      width: "210mm",
      background: "#000",
      minHeight: "297mm",
      overflow: "hidden",
    });
    document.body.appendChild(tempDiv);

    // ② 基準要素として「着陸ラベル」か「最後の .entry」を取得
    const adjustBaseline = (column) => {
      const base = column.querySelector(".baseline");
      if (!base) return;

      // 列内で 'baseline' 以外の直近の兄弟要素を全部取得
      const children = Array.from(column.children).filter(
        (el) => !el.classList.contains("baseline")
      );

      if (!children.length) return;

      // いちばん下にある要素（entry / tl-label / landing-label など）
      const target = children[children.length - 1];

      // column 内の座標で高さを算出
      const colRect = column.getBoundingClientRect();
      const tgtRect = target.getBoundingClientRect();
      const heightPx = tgtRect.bottom - colRect.top; // ← 下端まで

      base.style.height = `${heightPx}px`;
    };

    // 左右それぞれ調整
    tempDiv.querySelectorAll(".column").forEach(adjustBaseline);

    /* ========= 3) PDF 生成 (html2canvas → addImage) ========= */
    try {
      // ① html2canvas でページ全体を画像化
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#000",
      });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (imgH <= pageH) {
        pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
      } else {
        let y = 0;
        while (y < imgH) {
          pdf.addImage(imgData, "JPEG", 0, -y, imgW, imgH);
          y += pageH;
          if (y < imgH) pdf.addPage();
        }
      }

      pdf.save("stockcontents.pdf");
      console.log(this.template.slice(0, 80));
    } catch (err) {
      console.error("pdf addImage error", err);
      alert("PDF 生成に失敗しました（詳細はコンソール参照）");
    }

    document.body.removeChild(tempDiv);
  }

  /* 画像 → dataURL（JPEG 90 %）*/
  #imgToDataURL(img) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    });
  }
}
