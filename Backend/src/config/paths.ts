import path from 'path';
import { fileURLToPath } from 'url';

// Backend/src/config -> project root, where public/ and dist/ live
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
export const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
