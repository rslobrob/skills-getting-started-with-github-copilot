import copy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app

INITIAL_ACTIVITIES = copy.deepcopy(activities)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities_state():
    # Arrange: restore in-memory activities to a known baseline before each test.
    activities.clear()
    activities.update(copy.deepcopy(INITIAL_ACTIVITIES))

    yield

    # Cleanup: restore baseline to avoid state leakage from interrupted tests.
    activities.clear()
    activities.update(copy.deepcopy(INITIAL_ACTIVITIES))
