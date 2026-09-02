/**
 * Browser file download helper. Isolated so a native build can replace it with
 * a share-sheet / filesystem implementation.
 */
export function downloadText(filename: string, text: string, type = "application/json") {
  try {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.warn("[download] failed", err);
  }
}
