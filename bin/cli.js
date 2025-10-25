#!/usr/bin/env node --no-warnings=ExperimentalWarning

import {Audset, yargsConfig} from '../dist/index.cjs';

(async () => {
  try {
    const argv = await yargsConfig.parse();
    const audset = new Audset(argv);

    await audset.run();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
})();
