# 🔧 VSCode Backend Development Setup Guide

## 🎯 Quick Start (5 Minutes)

### 1. Open Backend in VSCode
```bash
# In your terminal, navigate to the backend directory
cd backend

# Open the backend folder in VSCode
code .
```

### 2. Install Python Extension
In VSCode:
1. Go to Extensions (Ctrl+Shift+X)
2. Search for "Python" by Microsoft
3. Install the official Python extension
4. Search for "Pylance" and install it too

### 3. Set Up Python Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure VSCode Python Interpreter
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Python: Select Interpreter"
3. Choose the interpreter from `./venv/bin/python` (or `.\venv\Scripts\python.exe` on Windows)

### 5. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
code .env
```

Required environment variables:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Redis Configuration (for Phase 3)
REDIS_URL=your_redis_cloud_url

# Pinecone Configuration (for Phase 3)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=genesis-memory

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# ElevenLabs Voice (for Phase 4)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# FastAPI Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
SECRET_KEY=your-super-secret-jwt-key

# CORS
FRONTEND_URL=http://localhost:5173
```

### 6. Run the Backend Server
```bash
# Method 1: Using the run script
python run.py

# Method 2: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Method 3: Using the npm script from root directory
npm run backend
```

You should see:
```
🚀 Starting GenesisOS Backend Server...
📍 Host: 0.0.0.0:8000
🔧 Debug: True
🌐 Frontend: http://localhost:5173
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
✅ Database connections established
```

---

## 🐛 Debugging Setup in VSCode

### 1. Create Launch Configuration
Create `.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "FastAPI Debug",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/run.py",
            "console": "integratedTerminal",
            "env": {
                "PYTHONPATH": "${workspaceFolder}",
                "DEBUG": "True"
            },
            "cwd": "${workspaceFolder}",
            "envFile": "${workspaceFolder}/.env"
        }
    ]
}
```

### 2. Set Breakpoints
- Click next to line numbers to set breakpoints
- Press F5 to start debugging
- Use the debug console to inspect variables

### 3. VSCode Tasks for Development
Create `.vscode/tasks.json`:
```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start Backend",
            "type": "shell",
            "command": "python",
            "args": ["run.py"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "options": {
                "cwd": "${workspaceFolder}"
            }
        },
        {
            "label": "Install Dependencies",
            "type": "shell",
            "command": "pip",
            "args": ["install", "-r", "requirements.txt"],
            "group": "build"
        }
    ]
}
```

---

## 🔥 Development Workflow

### Daily Development Routine:
1. **Start VSCode**: `code backend`
2. **Activate Environment**: Terminal → `source venv/bin/activate`
3. **Start Server**: `python run.py`
4. **Open Browser**: Navigate to `http://localhost:8000/docs`

### Hot Reload Development:
- FastAPI automatically reloads when you save Python files
- No need to restart the server for code changes
- Check the terminal for any errors

### API Documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

---

## 🧪 Testing the Backend

### 1. Health Check
```bash
curl http://localhost:8000/health
```
Expected response:
```json
{
    "status": "healthy",
    "database": "connected",
    "redis": "connected",
    "ai_service": "ready"
}
```

### 2. API Endpoints Testing
Use the interactive docs at `http://localhost:8000/docs` to:
- Test all API endpoints
- See request/response schemas
- Try different parameters

### 3. Frontend Integration Testing
Start both frontend and backend:
```bash
# Terminal 1 (Backend)
cd backend
python run.py

# Terminal 2 (Frontend)
cd ..
npm run dev
```

Check the backend status indicator in the frontend (bottom right corner).

---

## 🛠️ VSCode Extensions for Better Development

### Essential Extensions:
1. **Python** (Microsoft) - Python language support
2. **Pylance** (Microsoft) - Advanced Python language server
3. **Thunder Client** - API testing (like Postman in VSCode)
4. **GitLens** - Enhanced Git capabilities
5. **Error Lens** - Inline error highlighting

### Helpful Extensions:
1. **Python Docstring Generator** - Auto-generate docstrings
2. **autoDocstring** - Smart docstring completion
3. **Python Type Hint** - Better type hint support
4. **REST Client** - Test APIs directly in VSCode

---

## 🚨 Common Issues & Solutions

### Issue: "python not found"
**Solution:**
```bash
# Make sure Python is installed
python --version

# Or try python3
python3 --version

# Install Python from python.org if needed
```

### Issue: "Module not found"
**Solution:**
```bash
# Activate virtual environment first
source venv/bin/activate

# Install dependencies again
pip install -r requirements.txt

# Verify installation
pip list
```

### Issue: "Port already in use"
**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process (replace PID)
kill -9 <PID>

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### Issue: "Environment variables not loading"
**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify file content
cat .env

# Restart the server
python run.py
```

---

## 📚 Next Steps

### Phase 1 Development Tasks:
1. **Enhance Blueprint Generation** (`/app/services/ai_service.py`)
2. **Improve Wizard API** (`/app/api/routes/wizard.py`)
3. **Add Error Handling** (all routes)
4. **Test Gemini Integration**

### Recommended Development Order:
1. **Test Current Backend** - Ensure everything works
2. **Set Up Gemini API** - Replace mock blueprint generation
3. **Enhance Error Handling** - Robust error responses
4. **Add Logging** - Better debugging and monitoring
5. **Optimize Performance** - Async operations and caching

---

## 🎯 Ready to Code!

Your backend development environment is now ready! 

**Quick Start Command:**
```bash
cd backend && source venv/bin/activate && python run.py
```

**Next:** Start implementing Phase 1 features and integrating with the frontend.

**Insha'Allah, let's build something amazing!** 🚀
