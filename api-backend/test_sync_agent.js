const { spawn } = require('child_process');
const path = require('path');

// Run sync_agent for a specific date
const syncAgent = spawn('python', [
  'sync_agent.py',
  '--date', '2026-02-09',
  '--summary-type', 'OP',
  '--env', '.env'
], {
  cwd: 'C:\\fullstack\\jhcis-node-agent\\node-script',
  stdio: 'inherit'
});

syncAgent.on('close', (code) => {
  console.log(`\nSync agent exited with code ${code}`);
  process.exit(code);
});