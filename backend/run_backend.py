import sys
from pathlib import Path
import uvicorn

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Ensure project root is in sys.path
PROJECT_DIR = Path(__file__).resolve().parent.parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

if __name__ == "__main__":
    print("==================================================")
    print("TerraPulse Soil Health Monitoring Backend")
    print("Running on http://127.0.0.1:8000")
    print("OpenAPI Swagger Docs: http://127.0.0.1:8000/docs")
    print("==================================================")
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(PROJECT_DIR / "backend" / "app")]
    )
