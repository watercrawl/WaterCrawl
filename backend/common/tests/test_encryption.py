"""Tests for common/encryption.py Fernet wrapper."""

import pytest

from common.encryption import decrypt_key, encrypt_key


class TestEncryption:
    def test_roundtrip_returns_original(self):
        original = "supersecret-password-with-emoji-🔒"
        assert decrypt_key(encrypt_key(original)) == original

    def test_encrypt_is_non_deterministic(self):
        a = encrypt_key("hello")
        b = encrypt_key("hello")
        # Fernet includes an IV; ciphertexts must differ
        assert a != b

    def test_tampered_ciphertext_raises(self):
        from cryptography.fernet import InvalidToken

        ct = encrypt_key("hello")
        # flip a character mid-ciphertext
        tampered = ct[:-2] + ("A" if ct[-2] != "A" else "B") + ct[-1]
        with pytest.raises(InvalidToken):
            decrypt_key(tampered)

    def test_empty_string_roundtrip(self):
        assert decrypt_key(encrypt_key("")) == ""
