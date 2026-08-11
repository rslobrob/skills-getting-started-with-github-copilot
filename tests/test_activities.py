def test_get_activities_returns_all_activities(client):
    # Arrange
    expected_activity = "Chess Club"

    # Act
    response = client.get("/activities")
    data = response.json()

    # Assert
    assert response.status_code == 200
    assert isinstance(data, dict)
    assert expected_activity in data


def test_get_activities_has_expected_schema_for_an_activity(client):
    # Arrange
    required_keys = {"description", "schedule", "max_participants", "participants"}

    # Act
    response = client.get("/activities")
    data = response.json()
    first_activity = next(iter(data.values()))

    # Assert
    assert response.status_code == 200
    assert required_keys.issubset(first_activity.keys())
    assert isinstance(first_activity["participants"], list)
