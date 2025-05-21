export class PDFExporter {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.template = document.getElementById("pdf-template").textContent;
  }

  async export() {
    await document.fonts.ready;

    /* ========= 1) 画像データ収集 ========== */
    const imgs = [...this.container.querySelectorAll("img")];
    if (!imgs.length) {
      alert("フッターに画像がありません。");
      return;
    }

    const blocks = [];
    const labelMap = {
      motif: "モチーフ",
      transition: "トランジション",
      takeoff: "離陸",
      landing: "着陸",
    };

    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      const dataURL = await this.#imgToDataURL(img);
      const typeClass =
        img.dataset.type === "transition" ? "transition-img" : "motif-img";

      const block = `
    <div class="unit">
      <img src="${dataURL}" class="${typeClass}">
      <div class="caption">
        <div>${labelMap[img.dataset.type] ?? img.dataset.type}</div>
        <div>${img.dataset.filename}</div>
      </div>
    </div>
  `;

      if (i % 2 === 0 && i < imgs.length - 1) {
        // 奇数・偶数ペアでセット（アイコン→矢印→アイコン）
        const nextImg = imgs[i + 1];
        const nextDataURL = await this.#imgToDataURL(nextImg);
        const nextTypeClass =
          nextImg.dataset.type === "transition"
            ? "transition-img"
            : "motif-img";

        const nextBlock = `
      <div class="unit">
        <img src="${nextDataURL}" class="${nextTypeClass}">
        <div class="caption">
          <div>${labelMap[nextImg.dataset.type] ?? nextImg.dataset.type}</div>
          <div>${nextImg.dataset.filename}</div>
        </div>
      </div>
    `;

        blocks.push(`
      <div class="row">
        ${block}
        <div class="arrow">→</div>
        ${nextBlock}
      </div>
    `);

        i++;
      } else if (i === imgs.length - 1) {
        blocks.push(`<div class="row">${block}</div>`);
      }
    }

    /* ========= 2) テンプレートを DOM に挿入 ========== */
    const htmlString = this.template
      .replace(/{{title}}/g, "ストックコンテンツ")
      .replace("{{contentBlocks}}", blocks.join(""));

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
