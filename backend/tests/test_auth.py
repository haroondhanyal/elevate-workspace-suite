from app.auth import create_access_token, hash_password, verify_password


def test_password_hash_is_salted_and_verifiable():
    encoded = hash_password("StrongPassword123!")
    assert encoded != "StrongPassword123!"
    assert verify_password("StrongPassword123!", encoded)
    assert not verify_password("wrong-password", encoded)


def test_access_token_is_created():
    assert len(create_access_token(42).split(".")) == 3
