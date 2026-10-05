from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.auth import create_access_token, hash_password, verify_password


def test_password_hash_is_salted_and_verifiable():
    encoded = hash_password("StrongPassword123!")
    assert encoded != "StrongPassword123!"
    assert verify_password("StrongPassword123!", encoded)
    assert not verify_password("wrong-password", encoded)


def test_access_token_is_created():
    assert len(create_access_token(42).split(".")) == 3


class FakeUserDB:
    def __init__(self, user):
        self.user = user

    def get(self, model, user_id):
        return self.user if self.user.id == user_id else None


def test_access_token_carries_session_version():
    from app.auth import _decode
    import json

    token = create_access_token(42, token_version=7)
    claims = json.loads(_decode(token.split(".")[1]))
    assert claims["sub"] == "42"
    assert claims["ver"] == 7


def test_old_token_is_rejected_after_password_change():
    from app.auth import get_current_user

    user = SimpleNamespace(id=42, is_active=True, token_version=2)
    old_token = create_access_token(42, token_version=1)
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=old_token)
    with pytest.raises(HTTPException) as error:
        get_current_user(credentials, FakeUserDB(user))
    assert error.value.status_code == 401


def test_production_settings_reject_default_secrets():
    from app.config import Settings
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        Settings(app_env="production", secret_key="change-this-development-secret-before-production")


def test_test_management_data_is_limited_to_quality_roles():
    from app.main import require_workspace_data_role

    require_workspace_data_role(SimpleNamespace(role="qa"), "testrail-cases")
    with pytest.raises(HTTPException) as error:
        require_workspace_data_role(SimpleNamespace(role="member"), "testrail-cases")
    assert error.value.status_code == 403
