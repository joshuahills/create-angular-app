export function formatTargetDirectory(targetDir: string) {
  return targetDir?.trim().replace(/\/+$/g, '');
}
