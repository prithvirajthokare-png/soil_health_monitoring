import sys
import io
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Ensure project root is in sys.path
PROJECT_DIR = Path(__file__).resolve().parent.parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from backend.app.database import engine, Base, SessionLocal
from backend.app.services.seeder import run_seed

def main():
    print("--------------------------------------------------")
    print("[DB] Creating SQLite Database Tables...")
    Base.metadata.create_all(bind=engine)
    print("[DB] Running Crop Library & Location Seeder...")
    db = SessionLocal()
    try:
        run_seed(db)
        print("[DB] Database seeding complete!")
    finally:
        db.close()
    print("--------------------------------------------------")

if __name__ == "__main__":
    main()
