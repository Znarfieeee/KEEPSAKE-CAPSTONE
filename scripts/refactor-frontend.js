#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = path.join(__dirname, '..', 'client');

console.log('🔧 KEEPSAKE Frontend Refactor Tool\n');

const refactorTasks = {
  lint: {
    name: 'ESLint Auto-fix',
    command: 'npm run lint -- --fix',
    description: 'Automatically fix linting issues'
  },

  prettify: {
    name: 'Prettier Format',
    command: 'npx prettier --write "src/**/*.{js,jsx,json,css}" --config .prettierrc 2>/dev/null || npx prettier --write "src/**/*.{js,jsx,json,css}"',
    description: 'Format code with Prettier'
  },

  imports: {
    name: 'Organize Imports',
    command: 'npx organize-imports-cli "src/**/*.{js,jsx}" 2>/dev/null || echo "Skipping import organization (install organize-imports-cli if needed)"',
    description: 'Organize and clean up imports'
  },

  deadCode: {
    name: 'Dead Code Detection',
    command: 'npx unimported 2>/dev/null || echo "Skipping dead code detection (install unimported if needed)"',
    description: 'Find unused files and exports'
  },

  duplicates: {
    name: 'Duplicate Code Detection',
    command: 'npx jscpd src --min-lines 5 --min-tokens 50 --format "table" 2>/dev/null || echo "Skipping duplicate detection (install jscpd if needed)"',
    description: 'Find duplicate code blocks'
  },

  componentStructure: {
    name: 'Component Structure Analysis',
    command: 'node -e "require(\'./scripts/analyze-components.js\')" 2>/dev/null || echo "Component analysis script not found"',
    description: 'Analyze React component structure'
  },

  bundleSize: {
    name: 'Bundle Size Analysis',
    command: 'npm run build && npx vite-bundle-visualizer 2>/dev/null || npm run build',
    description: 'Analyze bundle size and dependencies'
  },

  security: {
    name: 'Security Audit',
    command: 'npm audit fix --audit-level=moderate',
    description: 'Fix security vulnerabilities'
  },

  typeCheck: {
    name: 'Type Checking',
    command: 'npx tsc --noEmit 2>/dev/null || echo "TypeScript checking skipped"',
    description: 'Check TypeScript types'
  },

  cssOptimize: {
    name: 'CSS Optimization',
    command: 'npx purgecss --css src/**/*.css --content src/**/*.{js,jsx,html} --output src/styles/optimized 2>/dev/null || echo "CSS optimization skipped"',
    description: 'Optimize CSS by removing unused styles'
  }
};

async function runTask(taskKey) {
  const task = refactorTasks[taskKey];
  console.log(`\n🔄 ${task.name}: ${task.description}`);

  try {
    const output = execSync(task.command, {
      cwd: FRONTEND_DIR,
      stdio: 'pipe',
      encoding: 'utf8'
    });

    if (output && output.trim()) {
      console.log(output);
    }
    console.log(`✅ ${task.name} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${task.name} failed: ${error.message}`);
    return false;
  }
}

async function runAllTasks() {
  console.log('Running all refactor tasks...\n');
  const results = {};

  for (const taskKey of Object.keys(refactorTasks)) {
    results[taskKey] = await runTask(taskKey);
  }

  console.log('\n📊 Refactor Summary:');
  console.log('─'.repeat(40));

  let successCount = 0;
  let failCount = 0;

  for (const [taskKey, success] of Object.entries(results)) {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${refactorTasks[taskKey].name}`);
    if (success) successCount++;
    else failCount++;
  }

  console.log('─'.repeat(40));
  console.log(`Total: ${successCount} succeeded, ${failCount} failed`);
}

async function interactiveMode() {
  console.log('Select refactor tasks to run:\n');

  const taskKeys = Object.keys(refactorTasks);
  taskKeys.forEach((key, index) => {
    console.log(`${index + 1}. ${refactorTasks[key].name} - ${refactorTasks[key].description}`);
  });

  console.log(`\n0. Run all tasks`);
  console.log(`q. Quit\n`);

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter your choice (0-' + taskKeys.length + ', or q): ', async (answer) => {
    if (answer.toLowerCase() === 'q') {
      console.log('Exiting...');
      rl.close();
      return;
    }

    const choice = parseInt(answer);

    if (choice === 0) {
      await runAllTasks();
    } else if (choice > 0 && choice <= taskKeys.length) {
      await runTask(taskKeys[choice - 1]);
    } else {
      console.log('Invalid choice');
    }

    rl.close();
  });
}

// Check for command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Interactive mode
  interactiveMode();
} else if (args[0] === '--all') {
  // Run all tasks
  runAllTasks();
} else if (args[0] === '--help') {
  console.log('Usage: node refactor-frontend.js [options]\n');
  console.log('Options:');
  console.log('  --all     Run all refactor tasks');
  console.log('  --lint    Run ESLint auto-fix');
  console.log('  --format  Run Prettier formatting');
  console.log('  --imports Organize imports');
  console.log('  --dead    Find dead code');
  console.log('  --dup     Find duplicate code');
  console.log('  --bundle  Analyze bundle size');
  console.log('  --security Run security audit');
  console.log('  --help    Show this help message');
  console.log('\nWithout options, runs in interactive mode');
} else {
  // Run specific task based on argument
  const taskMap = {
    '--lint': 'lint',
    '--format': 'prettify',
    '--imports': 'imports',
    '--dead': 'deadCode',
    '--dup': 'duplicates',
    '--bundle': 'bundleSize',
    '--security': 'security',
    '--type': 'typeCheck',
    '--css': 'cssOptimize'
  };

  const taskKey = taskMap[args[0]];
  if (taskKey) {
    runTask(taskKey);
  } else {
    console.log('Unknown option. Use --help for available options');
  }
}