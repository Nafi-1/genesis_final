import os
import subprocess
import platform
import sys
import shutil
import subprocess

def setup_environment():
    """Setup the Python environment and install dependencies"""
    print("🚀 Setting up GenesisOS Agent Service (Enhanced Version)...")

    # Create .env file if it doesn't exist
    if not os.path.exists('.env'):
        if os.path.exists('.env.example'):
            print("Creating .env file from example...")
            shutil.copy('.env.example', '.env')
            print("⚠️  Please update the .env file with your actual API keys!")
        else:
            print("Creating basic .env file...")
            with open('.env', 'w') as f:
                f.write("AGENT_PORT=8001\n")
                f.write("GEMINI_API_KEY=your_gemini_api_key\n")
                f.write("GEMINI_PRO_MODEL=gemini-pro\n")
                f.write("GEMINI_FLASH_MODEL=gemini-flash\n")
                f.write("GEMINI_DEFAULT_MODEL=gemini-flash\n")
                f.write("ELEVENLABS_API_KEY=your_elevenlabs_api_key\n")
                f.write("ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id\n")
                f.write("PINECONE_API_KEY=your_pinecone_api_key\n")
                f.write("PINECONE_ENVIRONMENT=your_pinecone_environment\n")
                f.write("PINECONE_INDEX_NAME=genesis-memory\n")
                f.write("REDIS_URL=your_redis_url\n")
                f.write("MEMORY_CACHE_TTL=3600\n")
                f.write("MEMORY_ENABLE_LOCAL_EMBEDDING=true\n")
                f.write("GEMINI_REQUEST_CACHE_ENABLED=true\n")
                f.write("GEMINI_REQUEST_CACHE_TTL=3600\n")
                f.write("GEMINI_FALLBACK_TO_MOCK=true\n")
                f.write("AGENT_MEMORY_ENABLED=true\n")
                f.write("VOICE_ENABLED=true\n")
                f.write("DEBUG=true\n")
            print("⚠️ .env file created with placeholder values. Please update with your actual API keys!")

    # Check if virtual environment exists
    venv_path = os.path.join(os.getcwd(), 'venv')
    if not os.path.exists(venv_path):
        print("Creating virtual environment...")
        try:
            subprocess.check_call([sys.executable, "-m", "venv", "venv"])
            print("✅ Virtual environment created successfully!")
        except subprocess.CalledProcessError:
            print("❌ Failed to create virtual environment. Make sure you have venv installed.")
            return False

    # Determine the Python interpreter path
    if platform.system() == "Windows":
        python_path = os.path.join(venv_path, "Scripts", "python.exe")
        pip_path = os.path.join(venv_path, "Scripts", "pip.exe")
    else:
        python_path = os.path.join(venv_path, "bin", "python")
        pip_path = os.path.join(venv_path, "bin", "pip")

    # Check if pip needs to be updated
    print("Updating pip to the latest version...")
    try:
        subprocess.check_call([python_path, "-m", "pip", "install", "--upgrade", "pip"])
        print("✅ Pip updated successfully!")
    except subprocess.CalledProcessError:
        print("⚠️ Failed to update pip. Continuing with installation...")

    # Install required packages
    print("Installing required Python packages...")
    try:
        subprocess.check_call([pip_path, "install", "-r", "requirements.txt"])
        print("✅ Python packages installed successfully!")
    except subprocess.CalledProcessError:
        print("❌ Failed to install packages. Please check your environment and try again.")
        return False

    print("\n✅ Agent Service setup completed successfully!")
    print("\nTo run the agent service, activate the virtual environment and run:")
    if platform.system() == "Windows":
        print("  - venv\\Scripts\\activate")
        print("  - python run.py")
    else:
        print("  - source venv/bin/activate")
        print("  - python run.py")
    print("\nOr in one command:")
    if platform.system() == "Windows":
        print("  - venv\\Scripts\\python.exe run.py")
    else:
        print("  - venv/bin/python run.py")
    return True

if __name__ == "__main__":
    setup_environment()