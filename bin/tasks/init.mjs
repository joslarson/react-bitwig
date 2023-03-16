import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import colors from 'colors/safe.js';
import { globSync as glob } from 'glob';
import nunjucks from 'nunjucks';
import promptSync from 'prompt-sync';
import { v4 as uuid } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgjson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8')
);

const prompt = promptSync({ sigint: true });

const IS_WINDOWS = os.platform() === 'win32';
const IS_MACOS = os.platform() === 'darwin';
const IS_LINUX = !IS_WINDOWS && !IS_MACOS;
const TEMPLATE_ROOT = path.join(__dirname, '..', 'template');

const scriptsDirs = {
  linux: path.join(os.homedir(), 'Bitwig Studio', 'Controller Scripts'),
  other: path.join(
    os.homedir(),
    'Documents',
    'Bitwig Studio',
    'Controller Scripts'
  ),
};

const taskName = colors.bold(colors.magenta(`[react-bitwig]`));
const scriptsDir = IS_LINUX ? scriptsDirs.linux : scriptsDirs.other;

const typescriptVersion = pkgjson.devDependencies['typescript'];
const apiTypesVersion = pkgjson.devDependencies['typed-bitwig-api'];
const defaultApiVersion = apiTypesVersion.split('.')[0].slice(1);

function rprompt(question, defaultValue, test, badTestResponse) {
  test = test === undefined ? (val) => val.trim().length > 0 : test;
  badTestResponse =
    badTestResponse !== undefined
      ? badTestResponse
      : 'Invalid input, try again...';

  let result;
  while (true) {
    result = prompt(question, defaultValue);
    if (test(result)) break;
    console.log(badTestResponse);
  }

  return result;
}

export default (dirname = process.cwd, typescript = false) => {
  console.log(`${taskName} begin project initialization...`);

  const scriptName = path.basename(path.resolve(dirname)).trim();

  const name = rprompt(colors.bold(colors.blue('Display Name: ')), '').trim();
  const vendor = rprompt(
    colors.bold(colors.blue('Vendor/Category: ')),
    ''
  ).trim();
  const author = prompt(colors.bold(colors.blue('Author: ')), '').trim();
  const version = prompt(
    colors.bold(colors.blue('Version (1.0.0): ')),
    '1.0.0'
  ).trim();
  const apiVersion = rprompt(
    colors.bold(colors.blue(`API Version (${defaultApiVersion}): `)),
    `${defaultApiVersion}`
  ).trim();

  const context = {
    typescript,
    packageVersion: pkgjson.version,
    scriptName,
    name,
    vendor,
    version,
    uuid: uuid(),
    author,
    apiVersion,
    apiTypesVersion,
    typescriptVersion,
  };

  const filePaths = glob('**/*', {
    dot: true,
    cwd: TEMPLATE_ROOT,
    nodir: true,
  });

  /** @type {{ path: string, contents: string }[]} */
  const templates = filePaths.reduce((acc, filePath) => {
    const fullPath = path.join(TEMPLATE_ROOT, filePath);
    acc.push({ path: filePath, contents: fs.readFileSync(fullPath, 'utf-8') });
    return acc;
  }, []);

  templates.forEach((template) => {
    // generate file content from template & context
    const contents = nunjucks.renderString(template.contents, context);

    // generate file path from template & context
    let destPath = nunjucks.renderString(template.path, context);
    if (typescript && destPath.startsWith('src/') && destPath.endsWith('.js')) {
      destPath = `${destPath.slice(0, -3)}.tsx`;
    }

    const fullDestPath = path.join(dirname, destPath);
    const fullDestDir = path.dirname(fullDestPath);
    // create dir if it doesn't exist
    if (!fs.existsSync(fullDestDir)) {
      fs.mkdirSync(fullDestDir, { recursive: true });
    }
    // save file
    fs.writeFileSync(fullDestPath, contents, 'utf-8');
  });

  if (!IS_WINDOWS) {
    // symlink on mac and linux
    // create build directory
    try {
      fs.mkdirSync(path.join(scriptsDir, scriptName));
    } catch (e) {
      // already exists... pass
    }
    // symlink build dir to project root
    fs.symlinkSync(
      path.join(scriptsDir, scriptName),
      path.join(dirname, 'dist')
    );
  }

  console.log(`${taskName} project initialization complete.`);
};
