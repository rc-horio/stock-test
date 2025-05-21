export function openSharedModal({
  videoPath,
  comment = "",
  infoText = "",
  selectData = null,
  onInput = null,
  onSelectChange = null,
}) {
  const modal = document.getElementById("sharedModal");
  const mask = document.getElementById("sharedModalMask");
  const selectWrapper = document.getElementById("sharedModalSelectWrapper");
  const selectBox = document.getElementById("sharedModalSelect");
  const video = document.getElementById("sharedVideo");
  const videoSource = document.getElementById("sharedVideoSource");
  const commentBox = document.getElementById("sharedComment");
  const infoBox = document.getElementById("sharedInfoText");
  const inputBtn = document.getElementById("sharedModalInput");
  const closeBtn = document.getElementById("sharedModalClose");

  // 初期状態リセット
  commentBox.textContent = comment;
  infoBox.textContent = infoText;

  // プルダウン初期化
  selectBox.innerHTML = "";
  selectBox.onchange = null;
  selectWrapper.classList.add("hidden");

  if (Array.isArray(selectData) && selectData.length > 0) {
    // セレクト表示
    selectWrapper.classList.remove("hidden");
    selectData.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      selectBox.appendChild(option);
    });

    if (onSelectChange) {
      selectBox.onchange = () => {
        onSelectChange(selectBox.value);
      };
    }
  }

  // 動画再生の準備
  videoSource.src = videoPath;
  video.load();
  video.play();

  // 確定ボタン
  inputBtn.onclick = () => {
    if (onInput) onInput(selectBox?.value || null);
    closeSharedModal();
  };

  // 閉じる処理
  closeBtn.onclick = closeSharedModal;
  mask.onclick = closeSharedModal;

  modal.classList.remove("hidden");
  mask.classList.remove("hidden");
}

/**
 * モーダルを閉じる処理
 */
export function closeSharedModal() {
  const modal = document.getElementById("sharedModal");
  const mask = document.getElementById("sharedModalMask");
  const video = document.getElementById("sharedVideo");

  modal.classList.add("hidden");
  mask.classList.add("hidden");

  video.pause();
  video.currentTime = 0;
}
