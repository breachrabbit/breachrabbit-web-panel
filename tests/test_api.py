from pathlib import Path

from fastapi.testclient import TestClient

from app.database import DATA_DB, MANAGED_DB_DIR
from app.main import app


def clean_state() -> None:
    if DATA_DB.exists():
        DATA_DB.unlink()
    for db_file in MANAGED_DB_DIR.glob('*.db'):
        db_file.unlink()


def test_database_lifecycle_and_audit() -> None:
    clean_state()
    client = TestClient(app)

    with client:
        create_resp = client.post(
            '/api/databases',
            json={'db_name': 'tenant_one', 'user': 'tenant_user', 'password': 'supersafe123'},
        )
        assert create_resp.status_code == 201

        list_resp = client.get('/api/databases')
        assert list_resp.status_code == 200
        assert list_resp.json()['items'][0]['db_name'] == 'tenant_one'

        password_resp = client.post('/api/databases/tenant_one/password', json={'new_password': 'newpassword123'})
        assert password_resp.status_code == 200

        token_resp = client.post('/api/databases/tenant_one/adminer-token')
        assert token_resp.status_code == 200
        token = token_resp.json()['token']

        adminer_page = client.get(f'/adminer/{token}')
        assert adminer_page.status_code == 200
        assert 'tenant_one' in adminer_page.text

        reused_token = client.get(f'/adminer/{token}')
        assert reused_token.status_code == 401

        delete_resp = client.delete('/api/databases/tenant_one')
        assert delete_resp.status_code == 200

        logs_resp = client.get('/api/audit-logs')
        assert logs_resp.status_code == 200
        actions = [row['action'] for row in logs_resp.json()['items']]
        assert 'create_database_and_user' in actions
        assert 'change_user_password' in actions
        assert 'issue_admin_token' in actions
        assert 'delete_database' in actions

    assert not (MANAGED_DB_DIR / 'tenant_one.db').exists()
