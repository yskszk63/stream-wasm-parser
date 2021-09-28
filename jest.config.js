import fs from 'fs';
const config = JSON.parse(fs.readFileSync(new URL('.swcrc', import.meta.url), 'utf-8'))

export default {
  "roots": [
    "<rootDir>/src"
  ],
  "testMatch": [
    "**/?(*.)+(spec|test).+(ts|js)"
  ],
  "transform": {
    //"^.+\\.(ts|tsx)$": "esbuild-jest"
    "^.+\\.(ts|tsx)$": ["@swc/jest", {...config}],
    //"^.+\\.(ts|tsx)$": "ts-jest"
  },
}
