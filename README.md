# GenesisOS

Welcome to GenesisOS, an AI-native operating system for creating autonomous digital workforces.

## 🚀 Features

- 🧠 **AI Agents** - Intelligent digital workers with specific roles and capabilities
- ⚡ **Quantum Canvas** - Visual workflow editor for designing agent interactions
- 🔄 **Orchestration Engine** - Coordination of AI workers, workflows and processes
- 🧪 **Simulation Lab** - Test your AI workforce in a safe environment before deployment
- 🌐 **Deployment System** - Deploy your guild to production with confidence

## 🔧 Prerequisites

- Node.js 18+
- Python 3.8+ (with pip)
- Npm or Yarn
- Optional: Redis for production deployments

## 🚀 Getting Started

### Quick Setup

1. Clone this repository:

```bash
git clone https://github.com/yourusername/genesisOS.git
cd genesisOS
```

2. Set up environment variables:

```bash
# Create environment files from examples
cp .env.example .env
cp orchestrator/.env.example orchestrator/.env
cp agents/agent_service/.env.example agents/agent_service/.env

# Edit the files with your actual API keys and credentials
```

3. Install dependencies and run all services:

```bash
npm install
cd orchestrator && npm install && cd ..
npm run full-dev
```

### Manual Setup

1. Clone this repository:

```bash
git clone https://github.com/yourusername/genesisOS.git
cd genesisOS
```

2. Run the setup script:

**On Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**On Windows:**
```batch
setup.bat
```

3. Start the development environment:

```bash
npm run full-dev
```

### Manual Setup

1. Install frontend dependencies:

```bash
npm install
```

2. Setup the Orchestrator:

```bash
cd orchestrator
cp .env.example .env  # Update with your values
npm install
cd ..
```

3. Setup the Agent Service:

```bash
cd agents/agent_service
cp .env.example .env  # Update with your values
pip install -r requirements.txt
cd ../..
```

4. Start all components:

```bash
npm run full-dev
```

## 🏗 Project Structure

- `/src` - React frontend
- `/orchestrator` - Node.js workflow orchestration service
- `/agents/agent_service` - Python FastAPI service for AI agents
- `/supabase` - Supabase database migrations and configuration

## 🛠 Development Components

You can run each component separately:

- **Frontend**: `npm run dev`
- **Orchestrator**: `npm run orchestrator:dev`
- **Agent Service**: `npm run agent:dev`

Or run everything with `npm run full-dev`

```bash
npm install
```

2. Setup the Orchestrator:

```bash
cd orchestrator
cp .env.example .env  # Update with your values
npm install
cd ..
```

3. Setup the Agent Service:

```bash
cd agents/agent_service
cp .env.example .env  # Update with your values
pip install -r requirements.txt
cd ../..
```

4. Start all components:

```bash
npm run full-dev
```

## 🏗 Project Structure

- `/src` - React frontend
- `/orchestrator` - Node.js workflow orchestration service
- `/agents/agent_service` - Python FastAPI service for AI agents
- `/supabase` - Supabase database migrations and configuration

## 🛠 Development Components

You can run each component separately:

- **Frontend**: `npm run dev`
- **Orchestrator**: `npm run orchestrator:dev`
- **Agent Service**: `npm run agent:dev`

Or run everything with `npm run full-dev`

## 🌟 User Experience

GenesisOS provides a multi-step wizard for creating and managing AI workforces:

1. **Welcome**: Introduction to GenesisOS capabilities
2. **Intent**: Share your business goal or vision
3. **Blueprint**: Review the AI-generated system architecture
4. **Canvas**: Visualize and customize your workflow
5. **Credentials**: Connect your tools and services
6. **Simulation**: Test your guild in a safe environment
7. **Deployment**: Launch your AI workforce

## 🔧 Configuration

Each component can be configured through its respective `.env` file:

- **Root**: Frontend configuration
- **Orchestrator**: Workflow engine configuration
- **Agent Service**: AI service configuration

## 📝 License

[MIT License](LICENSE)

## 👤 Contributors

- The GenesisOS Team
- Built with [Bolt.new](https://bolt.new)