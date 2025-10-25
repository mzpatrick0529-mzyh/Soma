type Test = { name: string; fn: () => void | Promise<void> };
const suites: Record<string, Test[]> = {};

export function describe(name: string, fn: () => void) {
  suites[name] = [];
  fn();
}

export function it(name: string, fn: () => void | Promise<void>) {
  const current = Object.keys(suites).slice(-1)[0];
  if (!current) throw new Error('No active suite');
  suites[current].push({ name, fn });
}

export async function run() {
  let passed = 0, failed = 0;
  for (const [suite, tests] of Object.entries(suites)) {
    // eslint-disable-next-line no-console
    console.log(`\nSuite: ${suite}`);
    for (const t of tests) {
      try {
        await t.fn();
        passed++;
        // eslint-disable-next-line no-console
        console.log(`  ✓ ${t.name}`);
      } catch (e: any) {
        failed++;
        // eslint-disable-next-line no-console
        console.log(`  ✗ ${t.name} -> ${e?.message || e}`);
      }
    }
  }
  // eslint-disable-next-line no-console
  console.log(`\nPassed: ${passed}  Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}
