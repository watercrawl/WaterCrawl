import warnings

from cryptography.fernet import Fernet
from django.conf import settings

if settings.API_ENCRYPTION_KEY == "8zSd6JIuC7ovfZ4AoxG_XmhubW6CPnQWW7Qe_4TD1TQ=":
    warnings.warn("""
API_ENCRYPTION_KEY is not set. This is a security risk, please set it in production mode. 
for generation the encryption key run: 
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
""")

fernet = Fernet(settings.API_ENCRYPTION_KEY)


def encrypt_key(raw_key):
    return fernet.encrypt(raw_key.encode()).decode()


def decrypt_key(encrypted_key):
    if not encrypted_key:
        return encrypted_key
    return fernet.decrypt(encrypted_key.encode()).decode()
