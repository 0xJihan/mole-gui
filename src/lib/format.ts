export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0 || i >= sizes.length) return `${bytes} B`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatRate(mbPerSec: number): string {
  if (mbPerSec >= 1.0) {
    return `${mbPerSec.toFixed(1)} MB/s`;
  }
  const kb = mbPerSec * 1024;
  if (kb >= 1.0) {
    return `${kb.toFixed(0)} KB/s`;
  }
  return "0 KB/s";
}

export function formatPercent(val: number): string {
  return `${Math.min(100, Math.max(0, val)).toFixed(1)}%`;
}
