#!/usr/bin/env node
import { execSync } from "node:child_process";
import pkg from '../../package.json';

if (process.argv[2] === 'help') {
  console.info('Tag and push commits with current version in ./package.json');
} else {
  execSync(`git tag ${JSON.stringify(pkg.version)}`);
  execSync('git push');
}
