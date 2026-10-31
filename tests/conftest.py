import pytest
from backend.app.main import seed_demo_environment
from backend.app.database.session import engine, Base

@pytest.fixture(scope="function", autouse=True)
def clean_test_database():
    """Ensures each test runs with a clean, freshly seeded database."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_demo_environment()
    yield
