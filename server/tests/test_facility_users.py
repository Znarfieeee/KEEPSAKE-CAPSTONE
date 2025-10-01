import pytest
from flask import Flask, url_for
from datetime import datetime
from routes.facility_admin.facility_users import fusers_bp
from unittest.mock import Mock, patch

@pytest.fixture
def app():
    app = Flask(__name__)
    app.register_blueprint(fusers_bp)
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def mock_supabase():
    with patch('routes.facility_admin.facility_users.supabase') as mock_supabase:
        yield mock_supabase

@pytest.fixture
def auth_headers():
    return {
        'Authorization': 'Bearer test-token'
    }

# Test cases for GET /facility_users
def test_get_facility_users_success(client, mock_supabase, auth_headers):
    # Mock data
    mock_facility_users = [{
        "facility_id": "123",
        "user_id": "456",
        "role": "doctor",
        "department": "Pediatrics",
        "users": {
            "firstname": "John",
            "lastname": "Doe",
            "email": "john.doe@example.com",
            "specialty": "Pediatrics",
            "license_number": "12345",
            "is_active": True
        }
    }]

    # Configure mock
    mock_supabase.table().select().eq().eq().execute.return_value.data = mock_facility_users
    mock_supabase.table().select().eq().execute.return_value.data = [{"firstname": "Admin", "lastname": "User"}]

    # Mock request context
    with client.application.test_request_context():
        response = client.get('/facility_users', headers=auth_headers)
        assert response.status_code == 200
        assert response.json["status"] == "success"

def test_get_facility_users_no_facility_id(client, auth_headers):
    with client.application.test_request_context():
        response = client.get('/facility_users', headers=auth_headers)
        assert response.status_code == 400
        assert response.json["status"] == "error"
        assert "not assigned to a facility" in response.json["message"]

# Test cases for POST /facility_users
def test_add_facility_user_success(client, mock_supabase, auth_headers):
    # Mock data
    new_user_data = {
        "email": "new.user@example.com",
        "firstname": "New",
        "lastname": "User",
        "role": "doctor",
        "specialty": "Pediatrics",
        "license_number": "12345",
        "department": "Pediatrics"
    }

    # Configure mock for existing user check
    mock_supabase.table().select().eq().execute.return_value.data = []
    
    # Configure mock for user creation
    mock_supabase.auth.sign_up.return_value = Mock(user={"id": "789"})
    mock_supabase.table().insert().execute.return_value.data = [{"user_id": "789"}]

    with client.application.test_request_context():
        response = client.post('/facility_users', 
                             json=new_user_data, 
                             headers=auth_headers)
        assert response.status_code == 201
        assert response.json["status"] == "success"

def test_add_facility_user_missing_fields(client, auth_headers):
    # Test with missing required fields
    new_user_data = {
        "email": "new.user@example.com"
        # Missing other required fields
    }

    with client.application.test_request_context():
        response = client.post('/facility_users', 
                             json=new_user_data, 
                             headers=auth_headers)
        assert response.status_code == 400
        assert response.json["status"] == "error"
        assert "Missing required field" in response.json["message"]

# Test cases for PUT /facility_users/{user_id}
def test_update_facility_user_success(client, mock_supabase, auth_headers):
    # Mock data
    update_data = {
        "role": "nurse",
        "department": "Emergency"
    }

    # Configure mocks
    mock_supabase.table().select().eq().eq().execute.return_value.data = [{"user_id": "456"}]
    mock_supabase.table().update().eq().eq().execute.return_value.error = None

    with client.application.test_request_context():
        response = client.put('/facility_users/456', 
                            json=update_data, 
                            headers=auth_headers)
        assert response.status_code == 200
        assert response.json["status"] == "success"

def test_update_facility_user_not_found(client, mock_supabase, auth_headers):
    # Configure mock to return no user
    mock_supabase.table().select().eq().eq().execute.return_value.data = []

    with client.application.test_request_context():
        response = client.put('/facility_users/999', 
                            json={"role": "nurse"}, 
                            headers=auth_headers)
        assert response.status_code == 404
        assert response.json["status"] == "error"

# Test cases for DELETE /facility_users/{user_id}
def test_remove_facility_user_success(client, mock_supabase, auth_headers):
    # Configure mocks
    mock_supabase.table().select().eq().eq().execute.return_value.data = [{"user_id": "456"}]
    mock_supabase.table().update().eq().eq().execute.return_value.error = None

    with client.application.test_request_context():
        response = client.delete('/facility_users/456', headers=auth_headers)
        assert response.status_code == 200
        assert response.json["status"] == "success"

def test_remove_facility_user_not_found(client, mock_supabase, auth_headers):
    # Configure mock to return no user
    mock_supabase.table().select().eq().eq().execute.return_value.data = []

    with client.application.test_request_context():
        response = client.delete('/facility_users/999', headers=auth_headers)
        assert response.status_code == 404
        assert response.json["status"] == "error"

# Test cases for special operations
def test_reset_user_password_success(client, mock_supabase, auth_headers):
    # Configure mocks
    mock_supabase.table().select().eq().eq().execute.return_value.data = [{"user_id": "456"}]
    mock_supabase.auth.admin.update_user_by_id.return_value = Mock(user={"id": "456"})

    with client.application.test_request_context():
        response = client.post('/facility_users/456/reset_password', headers=auth_headers)
        assert response.status_code == 200
        assert response.json["status"] == "success"

def test_activate_user_success(client, mock_supabase, auth_headers):
    # Configure mocks
    mock_supabase.table().select().eq().eq().execute.return_value.data = [{"user_id": "456"}]
    mock_supabase.auth.admin.update_user_by_id.return_value = Mock(user={"id": "456"})

    with client.application.test_request_context():
        response = client.post('/facility_users/456/activate', headers=auth_headers)
        assert response.status_code == 200
        assert response.json["status"] == "success"