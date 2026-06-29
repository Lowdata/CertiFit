import pytest

def test_create_and_get_company(client, db_session):
    # Register/Login a recruiter
    response = client.post(
        "/auth/register",
        json={
            "name": "Recruiter Bob",
            "email": "bob@company.com",
            "password": "Password123!",
            "user_type": 1,
        },
    )
    assert response.status_code == 200
    
    response = client.post(
        "/auth/login",
        json={"email": "bob@company.com", "password": "Password123!"},
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. GET /company/me when no company exists
    res = client.get("/company/me", headers=headers)
    assert res.status_code == 404

    # 2. PUT /company/me to create
    res = client.put(
        "/company/me",
        headers=headers,
        json={
            "name": "Acme Corp",
            "industry": "Tech",
            "size": "50-200"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Acme Corp"
    assert data["industry"] == "Tech"

    # 3. GET /company/me
    res = client.get("/company/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Acme Corp"

    # 4. PUT /company/me to update
    res = client.put(
        "/company/me",
        headers=headers,
        json={
            "name": "Acme Corp",
            "industry": "FinTech",
            "culture": "Fast-paced"
        }
    )
    assert res.status_code == 200
    assert res.json()["industry"] == "FinTech"
    assert res.json()["culture"] == "Fast-paced"

def test_candidate_cannot_access_company(client, db_session):
    # Register candidate
    response = client.post(
        "/auth/register",
        json={
            "name": "Alice",
            "email": "alice@candidate.com",
            "password": "Password123!",
            "user_type": 2,
        },
    )
    
    response = client.post(
        "/auth/login",
        json={"email": "alice@candidate.com", "password": "Password123!"},
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/company/me", headers=headers)
    assert res.status_code == 403
