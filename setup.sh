#!/bin/bash
# GenesisOS Setup Script

echo "🚀 Setting up GenesisOS Project..."

# Check if .env exists, if not create from example
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "Creating .env file from example..."
  cp .env.example .env
  echo "⚠️  Please update .env with your actual API keys!"
fi

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Setup Orchestrator
echo -e "\n🔄 Setting up Orchestrator..."
cd orchestrator || exit

# Create orchestrator .env if needed
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "Creating orchestrator .env file from example..."
  cp .env.example .env
  echo "⚠️  Please update orchestrator .env with your actual API keys!"
fi

# Install orchestrator dependencies
npm install

# Return to root
cd ..

# Setup Agent Service
echo -e "\n🐍 Setting up Python Agent Service..."
cd agents/agent_service || exit

# Create agent service .env if needed
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "Creating agent service .env file from example..."
  cp .env.example .env
  echo "⚠️  Please update agent service .env with your actual API keys!"
fi

# Install Python dependencies
pip install -r requirements.txt

# Return to root
cd ../..

echo -e "\n✅ GenesisOS setup completed!"
echo -e "\n🚀 To run the entire GenesisOS:"
echo "   npm run full-dev"
echo -e "\nOr start each component separately:"
echo "1. npm run agent:dev"
echo "2. npm run orchestrator:dev"
echo "3. npm run dev"