import fs from'fs';
import path from 'path';
import execa from 'execa';

const cliPath = path.join(__dirname, '../dist/index.js');
const templatePath = path.join(__dirname, '../templates/vanilla');
const projectName = 'test-app';
const projectPath = path.join(__dirname, projectName);
const ENTER = '\x0D';

const rename: Record<string, string> = {
  '.gitignore.default': '.gitignore'
};
const generatedFiles = [
  '.env'
];

function removeProject() {
  fs.rmSync(projectPath, {
    recursive: true,
    force: true
  });
}

function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function installProject(inputs: string[]): Promise<{ files: string[], exitCode: number | null }>{
  const result = execa('node', [cliPath], { cwd: __dirname });
  result.stdout?.on('data', chunk =>
    process.stdout.write(chunk.toString('utf8'))
  );
  for (const input of inputs) {
    result.stdin?.write(input);
    await timeout(500);
  }
  result.stdin?.end();
  await result;
  const files = fs.existsSync(projectPath) ? fs.readdirSync(projectPath) : [];
  return {
    exitCode: result.exitCode,
    files
  };
}

beforeAll(() => {
  removeProject();
});
afterAll(async () => {
  removeProject();
});

describe('create-liff-app', () => {
  it('files properly created', async () => {
    const result = await installProject([
      projectName,
      ENTER,
      ENTER,
      ENTER,
      ENTER,
      'n'
    ]);

    const templateFiles = fs.readdirSync(templatePath).map(f => rename[f] ? rename[f] : f);
    const expectedFiles = templateFiles.concat(generatedFiles);
    expect(result.files.sort()).toEqual(expectedFiles.sort());
    expect(result.exitCode).toBe(0);
  });
});
