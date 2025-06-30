const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function setupOrchestrator() {
  console.log('🚀 Setting up GenesisOS Orchestrator...');

  // Create .env file if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, '.env'))) {
    if (fs.existsSync(path.join(__dirname, '.env.example'))) {
      console.log('Creating .env file from example...');
      fs.copyFileSync(path.join(__dirname, '.env.example'), path.join(__dirname, '.env'));
      console.log('⚠️  Please update the .env file with your actual API keys!');
    } else {
      console.log('Creating basic .env file...');
      const envContent = 
`PORT=3000
AGENT_SERVICE_URL=http://localhost:8001
SUPABASE_URL=https://atnmspufnvgfxhilemsd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bm1zcHVmbnZnZnhoaWxlbXNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA4MTM2MCwiZXhwIjoyMDY1NjU3MzYwfQ.VEwqXme0COrQCllWyyHA9evnOLkapHoTHbPkTX7KntE
REDIS_URL=redis://default:zeoCiYhvAxKOKFORQNNGXB0oid4h0v0e@redis-10690.c274.us-east-1-3.ec2.redns.redis-cloud.com:10690
`;
      fs.writeFileSync(path.join(__dirname, '.env'), envContent);
      console.log('⚠️  .env file created with placeholder values. Please update with actual keys!');
    }
  }

  // Install dependencies
  console.log('Installing Node.js dependencies...');
  try {
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    return false;
  }

  // Build TypeScript
  console.log('Building TypeScript...');
  try {
    execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ TypeScript build completed successfully!');
  } catch (error) {
    console.error('❌ Failed to build TypeScript:', error.message);
    return false;
  }

  console.log('\n✅ Orchestrator setup completed successfully!');
  console.log('\nTo run the orchestrator, use the following command:');
  console.log('  - npm run dev');
  
  return true;
}

setupOrchestrator();