import util from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import prompts from 'prompts';
import ghpages from 'gh-pages';
import chalk from 'chalk';

const publishAsync = util.promisify(ghpages.publish);

const ghPagesOptions = {
  branch: 'gh-pages',
  message: `Update ${new Date().toISOString()}`,
  dotfiles: true,
};

const questions = [
  {
    name: 'publish',
    type: 'confirm',
    message: `Do You want to publish the '${chalk.cyan('build')}' directory to '${chalk.cyan(
      ghPagesOptions.branch
    )}' branch?`,
  },
];

const publish = async () => {
  try {
    if (process.env.CI) {
      prompts.inject([true]);
    }

    const answers = await prompts(questions);

    if (!answers.publish) {
      return;
    }

    await fs.writeFile(path.join(process.cwd(), 'build', '.nojekyll'), '', 'utf-8');
    console.log(chalk.green(`\nCreated ${chalk.cyan("'.nojekyll'")} file in the build directory`));

    await publishAsync('build', ghPagesOptions);
    console.log(chalk.green(`\nBuild published successfully to ${chalk.cyan("'gh-pages'")} \n`));
  } catch (err) {
    console.log(chalk.red('Unable to publish build. Error:'), err);
  }
};

publish();
