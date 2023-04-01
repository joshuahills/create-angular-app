import * as fs from 'fs';
import * as path from 'path';

export async function emptyDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    return await fs.promises.rm(path.resolve(dir, file), { recursive: true, force: true });
  }
}
