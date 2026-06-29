import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-minimum-32-chars!!")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

import types

app_pkg = types.ModuleType("app")
app_pkg.__path__ = [os.path.dirname(os.path.abspath(__file__))]
app_pkg.__package__ = "app"
sys.modules["app"] = app_pkg
