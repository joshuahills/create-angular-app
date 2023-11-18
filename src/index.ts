#!/usr/bin/env node

import * as child_process from 'child_process';
import { Spinner } from 'cli-spinner';
import * as fs from 'fs';
import { gray, green, red, reset, yellow } from 'kolorist';
import { fileURLToPath } from 'node:url';
import * as path from 'path';
import prompts from 'prompts';
import replace from 'replace-in-file';
import * as util from 'util';

import {
  copy,
  emptyDirectory,
  formatTargetDirectory,
  isDirectoryEmpty,
  isValidPackageName,
  toValidPackageName,
} from './utils/index.js';

const exec = util.promisify(child_process.exec);
const cwd = process.cwd();

const APPS = [
  {
    name: 'Angular V15',
    color: yellow,
    variants: [
      {
        name: 'angular-v15',
        color: yellow,
      },
    ],
  },
  {
    name: 'Angular V16',
    color: green,
    variants: [
      {
        name: 'angular-v16',
        color: green,
      },
    ],
  },
  {
    name: 'Angular V17 (standalone)',
    color: red,
    variants: [
      {
        name: 'angular-v17',
        color: red,
      },
    ],
  },
];

const TEMPLATES = APPS.map(
  (f) => (f.variants && f.variants.map((v) => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), []);

async function init () {
  const defaultTargetDir = 'my-angular-app';
  let targetDir = '';
  let template = '';
  const getProjectName = () => targetDir === '.' ? path.basename(path.resolve()) : targetDir;

  let result: prompts.Answers<'projectName' | 'overwrite' | 'overwriteChecker' | 'packageName' | 'framework' | 'variant'>;

  try {
    result = await prompts(
      [
        // Project name
        {
          type: 'text',
          name: 'projectName',
          message: reset('Project name (use . for current dir):'),
          initial: defaultTargetDir,
          onState: (state) => targetDir = formatTargetDirectory(state.value) || defaultTargetDir,
        },
        {
          type: () => !fs.existsSync(targetDir) || isDirectoryEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () =>
            (targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}"`) +
            ` is not empty. Remove existing files and continue?`,
        },
        {
          type: (_, { overwrite }) => {
            if (overwrite === false) {
              throw new Error(red('✖') + ' Operation cancelled');
            }
            return null;
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
          name: 'packageName',
          message: reset('Package name:'),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
          type: template && TEMPLATES.includes(template) ? null : 'select',
          name: 'framework',
          message:
            typeof template === 'string' && template.length > 0 && !TEMPLATES.includes(template)
              ? reset(
                `"${template}" isn't a valid template. Please choose from below: `,
              )
              : reset('Select a template:'),
          initial: 0,
          choices: APPS.map((framework) => {
            const frameworkColor = framework.color;
            return {
              title: frameworkColor(framework.name),
              value: framework,
            };
          }),
        },
        {
          type: (framework) =>
            framework && framework.variants ? 'select' : null,
          name: 'variant',
          message: reset('Select a variant:'),
          choices: (framework) =>
            framework.variants.map((variant: { name: string, color: (x: string | number) => string }) => {
              const variantColor = variant.color;
              return {
                title: variantColor(variant.name),
                value: variant.name,
              };
            }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled');
        },
      },
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(err.message);
    }
    return;
  }

  // user choices associated with prompts
  const { framework, overwrite, packageName, variant } = result;

  const root = path.join(cwd, targetDir);

  if (overwrite) {
    const spinner = new Spinner('Removing existing files...').start();
    await emptyDirectory(root);
    spinner.stop(true);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  // determine template
  template = variant || framework || template;

  console.log(`\nScaffolding project in ${root}...`);

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '..',
    '..',
    'templates',
    `${template}-template`,
  );

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file);
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8'),
  );

  pkg.name = packageName || getProjectName();

  write('package.json', JSON.stringify(pkg, null, 2));

  replace.sync({
    files: [
      path.join(targetDir, 'src/app/app.component.ts'),
      path.join(targetDir, 'angular.json'),
      path.join(targetDir, 'src/index.html'),
    ],
    from:/angular-v(\d+)-template/g,
    to: pkg.name,
  });

  const spinner = new Spinner('Installing dependencies...').start();

  try {
    await exec(`cd ${path.relative(cwd, root)} && npm install`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log(red(err.message));
    }
  } finally {
    spinner.stop(true);
  }

  console.log(`\nAll done! Now run:\n`);
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`);
  }
  console.log(`  npm start`);
  console.log();
}

init().catch((e) => {
  console.log(
    'An error occurred while initializing the project. Please create a GitHub issue and include all prompt answers and the below error.');
  console.error(e);
});
