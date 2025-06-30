@echo off
REM GenesisOS Setup Script for Windows

echo 🚀 Setting up GenesisOS Project...

REM Check if .env exists, if not create from example
if not exist ".env" (
  if exist ".env.example" (
    echo Creating .env file from example...
    copy ".env.example" ".env"
    echo ⚠️  Please update .env with your actual API keys!
  )
)

REM Install dependencies
echo Installing frontend dependencies...
call npm install

REM Setup Orchestrator
echo.
echo 🔄 Setting up Orchestrator...
cd orchestrator

REM Create orchestrator .env if needed
if not exist ".env" (
  if exist ".env.example" (
    echo Creating orchestrator .env file from example...
    copy ".env.example" ".env"
    echo ⚠️  Please update orchestrator .env with your actual API keys!
  )
)

REM Install orchestrator dependencies
call npm install

REM Return to root
cd ..

REM Setup Agent Service
echo.
echo 🐍 Setting up Python Agent Service...
cd agents\agent_service

REM Create agent service .env if needed
if not exist ".env" (
  if exist ".env.example" (
    echo Creating agent service .env file from example...
    copy ".env.example" ".env"
    echo ⚠️  Please update agent service .env with your actual API keys!
  )
)

REM Install Python dependencies
pip install -r requirements.txt

REM Return to root
cd ..\..

echo.
echo ✅ GenesisOS setup completed!
echo.
echo 🚀 To run the entire GenesisOS:
echo    npm run full-dev
echo.
echo Or start each component separately:
echo 1. npm run agent:dev
echo 2. npm run orchestrator:dev
echo 3. npm run dev