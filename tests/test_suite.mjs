#!/usr/bin/env node

/**
 * ============================================================================
 * The Hiu Hero Villa Preview — Comprehensive E2E Automated Test Suite
 * ============================================================================
 * Target: /Users/dinhhuy/Project/Villa Agency/scrollcraft/builds/the-hiu-preview
 * Tiers:
 *   - Tier 1: Feature Coverage (F1–F12, 60 tests)
 *   - Tier 2: Boundary & Corner Cases (F1–F12, 60 tests)
 *   - Tier 3: Cross-Feature Interactions (12 tests)
 *   - Tier 4: Real-World Scenarios (5 tests)
 * Total: 137 tests
 * Invocation: node "scrollcraft/builds/the-hiu-preview/tests/test_suite.mjs"
 * Exit Code: 0 on all pass, 1 on failure.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseCSS } from './css_parser.mjs';
import { runTier1 } from './tier1_features.mjs';
import { runTier2 } from './tier2_boundaries.mjs';
import { runTier3 } from './tier3_interactions.mjs';
import { runTier4 } from './tier4_scenarios.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const htmlPath = path.join(projectRoot, 'index.html');
const cssPath = path.join(projectRoot, 'styles.css');
const appJsPath = path.join(projectRoot, 'app.js');

// Colors for terminal formatting
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function main() {
  console.log(`${ANSI.bold}${ANSI.cyan}==============================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan} THE HIU HERO VILLA PREVIEW — COMPREHENSIVE E2E TEST SUITE${ANSI.reset}`);
  console.log(`${ANSI.dim} Target Directory: ${projectRoot}${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}==============================================================================${ANSI.reset}\n`);

  if (!fs.existsSync(htmlPath) || !fs.existsSync(cssPath) || !fs.existsSync(appJsPath)) {
    console.error(`${ANSI.red}Error: Required files (index.html, styles.css, app.js) not found in ${projectRoot}${ANSI.reset}`);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  const parsedCSS = parseCSS(css);
  const suiteContext = { html, css, appJs, parsedCSS };

  const tier1Results = runTier1(suiteContext);
  const tier2Results = runTier2(suiteContext);
  const tier3Results = runTier3(suiteContext);
  const tier4Results = runTier4(suiteContext);

  const allResults = [
    ...tier1Results,
    ...tier2Results,
    ...tier3Results,
    ...tier4Results
  ];

  const tiers = [
    { name: 'Tier 1: Feature Coverage (F1–F12)', results: tier1Results },
    { name: 'Tier 2: Boundary & Corner Cases', results: tier2Results },
    { name: 'Tier 3: Cross-Feature Interactions', results: tier3Results },
    { name: 'Tier 4: Real-World Scenarios', results: tier4Results }
  ];

  // Print Summary Table
  console.log(`${ANSI.bold}Execution Summary:${ANSI.reset}`);
  console.log(`${ANSI.dim}------------------------------------------------------------------------------${ANSI.reset}`);
  console.log(` ${ANSI.bold}Tier / Suite${' '.repeat(34)} Passed   Failed   Total${ANSI.reset}`);
  console.log(`${ANSI.dim}------------------------------------------------------------------------------${ANSI.reset}`);

  for (const t of tiers) {
    const passed = t.results.filter(r => r.pass).length;
    const failed = t.results.filter(r => !r.pass).length;
    const total = t.results.length;
    const color = failed > 0 ? ANSI.yellow : ANSI.green;
    const passStr = String(passed).padStart(6);
    const failStr = String(failed).padStart(7);
    const totStr = String(total).padStart(6);
    const padName = t.name.padEnd(46);

    console.log(` ${color}${padName} ${passStr}  ${failStr}  ${totStr}${ANSI.reset}`);
  }

  const totalPassed = allResults.filter(r => r.pass).length;
  const totalFailed = allResults.filter(r => !r.pass).length;
  const totalTests = allResults.length;

  console.log(`${ANSI.dim}------------------------------------------------------------------------------${ANSI.reset}`);
  const grandColor = totalFailed > 0 ? ANSI.red : ANSI.green;
  console.log(` ${ANSI.bold}${grandColor}${'TOTAL ALL TIERS'.padEnd(46)} ${String(totalPassed).padStart(6)}  ${String(totalFailed).padStart(7)}  ${String(totalTests).padStart(6)}${ANSI.reset}`);
  console.log(`${ANSI.dim}------------------------------------------------------------------------------${ANSI.reset}\n`);

  // Print Failures if any
  if (totalFailed > 0) {
    console.log(`${ANSI.bold}${ANSI.red}Failed Assertions (${totalFailed}):${ANSI.reset}`);
    console.log(`${ANSI.dim}==============================================================================${ANSI.reset}`);

    tiers.forEach(tier => {
      const failures = tier.results.filter(r => !r.pass);
      if (failures.length > 0) {
        console.log(`\n${ANSI.bold}${ANSI.yellow}▶ ${tier.name}${ANSI.reset}`);
        failures.forEach((f, idx) => {
          console.log(`  ${ANSI.red}✗ [${f.id}]${ANSI.reset} ${ANSI.bold}${f.name}${ANSI.reset}`);
          console.log(`    ${ANSI.dim}Feature:${ANSI.reset}  ${f.feature}`);
          console.log(`    ${ANSI.dim}Expected:${ANSI.reset} ${ANSI.green}${f.expected}${ANSI.reset}`);
          console.log(`    ${ANSI.dim}Actual:${ANSI.reset}   ${ANSI.red}${f.actual}${ANSI.reset}`);
        });
      }
    });

    console.log(`\n${ANSI.dim}==============================================================================${ANSI.reset}`);
    console.log(`${ANSI.bold}${ANSI.red}TEST SUITE RESULT: FAIL (${totalPassed}/${totalTests} passed, ${totalFailed} failed)${ANSI.reset}`);
    console.log(`${ANSI.dim}Fix the defects above to reach 100% test pass rate.${ANSI.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${ANSI.bold}${ANSI.green}==============================================================================${ANSI.reset}`);
    console.log(`${ANSI.bold}${ANSI.green}✔ ALL ${totalTests} TESTS PASSED PERFECTLY ACROSS TIERS 1–4!${ANSI.reset}`);
    console.log(`${ANSI.bold}${ANSI.green}==============================================================================${ANSI.reset}\n`);
    process.exit(0);
  }
}

main();
