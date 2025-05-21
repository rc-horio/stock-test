/**
 * CSVを非同期で読み込み、テキストをコールバックに渡す
 * @param {string} url
 * @param {function} callback
 */
export function loadCSV(url, callback) {
  const req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.onload = () => callback(req.responseText);
  req.send(null);
}

/**
 * CSVテキストを配列にパースして返す
 * @param {string} str
 * @returns {string[][]} 2次元配列
 */
export function parseCSV(str) {
  // 改行で分割 → 各行をカンマで分割
  return str
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.split(","));
}
