import os
import sys
import django
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BetBetter.settings')
def pytest_configure(config):
    django.setup()
