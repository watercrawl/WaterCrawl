import uuid

from django.core.files.storage import default_storage
from django.core.files.uploadedfile import TemporaryUploadedFile


class StorageFile:
    uuid: str
    name: str
    path: str

    def __init__(self, unique_id: str, name: str):
        self.unique_id = unique_id
        self.name = name

    @property
    def extension(self):
        return self.name.split(".")[-1]

    def make_path(self, knowledge_base_uuid):
        self.path = f"knowledge_base/{knowledge_base_uuid}/{self.unique_id}/{self.name}.{self.extension}"
        return self


class KnowledgeBaseStorageService:
    def __init__(self, knowledge_base):
        self.storage = default_storage
        self.knowledge_base = knowledge_base

    @classmethod
    def from_knowledge_base(cls, knowledge_base) -> "KnowledgeBaseStorageService":
        return cls(knowledge_base)

    def get_storage_file(self, file: TemporaryUploadedFile) -> StorageFile:
        return StorageFile(
            unique_id=str(uuid.uuid4()),
            name=file.name,
        ).make_path(self.knowledge_base.uuid)

    def save_file(self, file: TemporaryUploadedFile) -> StorageFile:
        storage_file = self.get_storage_file(file)
        storage_file.path = self.storage.save(storage_file.path, file.file)
        return storage_file

    def get_file_from_path(self, path) -> str:
        return self.storage.open(path)
