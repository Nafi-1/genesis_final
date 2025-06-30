const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function setupGenesisOS() {
  console.log('🌟 Setting up GenesisOS Project...');

  // Setup root .env file
  if (!fs.existsSync('.env')) {
    if (fs.existsSync('.env.example')) {
      console.log('Creating root .env file from example...');
      fs.copyFileSync('.env.example', '.env');
    }
  }

  // Install root dependencies
  console.log('Installing frontend dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Frontend dependencies installed successfully!');
  } catch (error) {
    console.error('❌ Failed to install frontend dependencies:', error.message);
    return false;
  }

  // Setup Orchestrator
  console.log('\n🔄 Setting up Orchestrator...');
  try {
    execSync('node orchestrator/setup.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to setup Orchestrator:', error.message);
    return false;
  }

  // Setup Python Agent Service
  console.log('\n🐍 Setting up Python Agent Service...');
  console.log('To setup the Python Agent Service, run the following commands:');
  console.log('  cd agents/agent_service');
  console.log('  python setup.py');
  
  console.log('\n✅ GenesisOS setup completed!');
  console.log('\n🚀 To run the entire GenesisOS:');
  console.log('1. Start the Agent Service:');
  console.log('   cd agents/agent_service && python run.py');
  console.log('2. Start the Orchestrator:');
  console.log('   cd orchestrator && npm run dev');
  console.log('3. Start the Frontend:');
  console.log('   npm run dev');
  console.log('\nOr use the convenience script:');
  console.log('   npm run full-dev');
  
  return true;
}

setupGenesisOS();