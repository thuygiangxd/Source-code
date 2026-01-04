import os
import pytest
import httpx
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001/auth")

@pytest.fixture(scope="module")
def test_user_credentials():
    # Generate unique credentials for testing
    username = "test_user_update_pwd"
    email = "test_user_update_pwd@example.com"
    name = "Test User Update Pwd"
    password = "old_password_123"
    phone = "1234567890"
    return {"username": username, "email": email, "name": name, "password": password, "phone": phone}

@pytest.fixture(scope="module")
def setup_test_user(test_user_credentials):
    # Signup the test user
    signup_data = test_user_credentials
    try:
        response = httpx.post(f"{AUTH_SERVICE_URL}/signup", json=signup_data)
        response.raise_for_status()
        print(f"Test user {signup_data['username']} signed up successfully.")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400 and "Username already exists" in e.response.text:
            print(f"Test user {signup_data['username']} already exists. Proceeding with existing user.")
        else:
            raise

    # Login to get a token
    login_data = {"username": test_user_credentials["username"], "password": test_user_credentials["password"]}
    response = httpx.post(f"{AUTH_SERVICE_URL}/login", json=login_data)
    response.raise_for_status()
    token = response.json()["access_token"]
    print(f"Test user {test_user_credentials['username']} logged in successfully.")
    
    yield token, test_user_credentials["username"]

    # Teardown: (Ideally, delete the user from Supabase, but that requires admin access or a specific endpoint)
    # For now, we'll just rely on unique usernames for each test run or manual cleanup.
    print(f"Test user {test_user_credentials['username']} cleanup (manual deletion might be needed).")


def test_update_password_invalid_current_password(setup_test_user):
    token, username = setup_test_user
    headers = {"Authorization": f"Bearer {token}"}
    update_data = {
        "current_password": "wrong_password",
        "new_password": "new_password_123"
    }
    response = httpx.patch(f"{AUTH_SERVICE_URL}/password", json=update_data, headers=headers)
    assert response.status_code == 401
    assert "Invalid current password" in response.json()["detail"]
    print(f"Test 'invalid current password' passed for user {username}.")

def test_update_password_success_and_login_with_new_password(setup_test_user):
    token, username = setup_test_user
    headers = {"Authorization": f"Bearer {token}"}
    
    # Update password
    update_data = {
        "current_password": "old_password_123", # This needs to be the initial password
        "new_password": "new_password_123"
    }
    response = httpx.patch(f"{AUTH_SERVICE_URL}/password", json=update_data, headers=headers)
    response.raise_for_status()
    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"
    print(f"Test 'password update success' passed for user {username}.")

    # Try logging in with the old password (should fail)
    login_data_old = {"username": username, "password": "old_password_123"}
    response_old = httpx.post(f"{AUTH_SERVICE_URL}/login", json=login_data_old)
    assert response_old.status_code == 401
    print(f"Test 'login with old password after update' failed as expected for user {username}.")

    # Try logging in with the new password (should succeed)
    login_data_new = {"username": username, "password": "new_password_123"}
    response_new = httpx.post(f"{AUTH_SERVICE_URL}/login", json=login_data_new)
    response_new.raise_for_status()
    assert response_new.status_code == 200
    assert response_new.json()["username"] == username
    print(f"Test 'login with new password after update' passed for user {username}.")
