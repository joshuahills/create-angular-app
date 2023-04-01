import * as readline from 'readline';

export class Spinner {
  spin() {
    process.stdout.write('\x1B[?25l');

    const spinners = ['-', '\\', '|', '/'];

    let i = 0;

    setInterval(() => {
      let line = spinners[i];

      if (!line) {
        i = 0;
        line = spinners[i];
      }

      process.stdout.write(line);

      readline.cursorTo(process.stdout, 0, 0);

      i = i >= spinners.length ? 0 : i + 1;
    }, 100);
  }
}
