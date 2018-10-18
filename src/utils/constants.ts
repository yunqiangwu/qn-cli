import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

const fileName = '.qn-cli.json';

let filePath = join(process.cwd(), fileName);

if (!existsSync(filePath)) {
    filePath = join(homedir(), fileName);
}

export const tokenfile = filePath;
