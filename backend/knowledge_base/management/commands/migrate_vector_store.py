"""
Management command to migrate knowledge bases from one vector store to another.

Usage:
    python manage.py migrate_vector_store --from opensearch --to weaviate
    python manage.py migrate_vector_store --from opensearch --to weaviate --kb-uuid <uuid>
    python manage.py migrate_vector_store --from opensearch --to weaviate --all
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from knowledge_base.models import KnowledgeBase, KnowledgeBaseChunk
from knowledge_base.factories import VectorStoreFactory
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Migrate knowledge bases from one vector store to another"

    def add_arguments(self, parser):
        parser.add_argument(
            "--from",
            dest="from_store",
            type=str,
            required=True,
            help="Source vector store type (e.g., opensearch)",
        )
        parser.add_argument(
            "--to",
            dest="to_store",
            type=str,
            required=True,
            help="Target vector store type (e.g., weaviate)",
        )
        parser.add_argument(
            "--kb-uuid",
            type=str,
            help="UUID of specific knowledge base to migrate",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Migrate all knowledge bases",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Perform a dry run without actually migrating",
        )

    def handle(self, *args, **options):
        from_store = options["from_store"]
        to_store = options["to_store"]
        kb_uuid = options.get("kb_uuid")
        migrate_all = options.get("all", False)
        dry_run = options.get("dry_run", False)

        # Validate vector store types
        valid_stores = ["opensearch", "weaviate", "pinecone"]
        if from_store not in valid_stores:
            raise CommandError(f"Invalid source vector store: {from_store}")
        if to_store not in valid_stores:
            raise CommandError(f"Invalid target vector store: {to_store}")

        if from_store == to_store:
            raise CommandError("Source and target vector stores must be different")

        # Get knowledge bases to migrate
        if kb_uuid:
            try:
                knowledge_bases = [KnowledgeBase.objects.get(uuid=kb_uuid)]
            except KnowledgeBase.DoesNotExist:
                raise CommandError(f"Knowledge base with UUID {kb_uuid} not found")
        elif migrate_all:
            knowledge_bases = KnowledgeBase.objects.filter(
                vector_store_type=from_store
            ).all()
            if not knowledge_bases.exists():
                self.stdout.write(
                    self.style.WARNING(
                        f"No knowledge bases found with vector_store_type={from_store}"
                    )
                )
                return
        else:
            raise CommandError(
                "Must specify either --kb-uuid or --all to select knowledge bases"
            )

        self.stdout.write(
            self.style.SUCCESS(f"Starting migration from {from_store} to {to_store}...")
        )
        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN MODE - No changes will be made")
            )

        # Migrate each knowledge base
        for kb in knowledge_bases:
            self.stdout.write(
                f"\nMigrating knowledge base: {kb.title} (UUID: {kb.uuid})"
            )

            if dry_run:
                chunk_count = KnowledgeBaseChunk.objects.filter(
                    document__knowledge_base=kb
                ).count()
                self.stdout.write(
                    f"  Would migrate {chunk_count} chunks from {from_store} to {to_store}"
                )
                continue

            try:
                self._migrate_knowledge_base(kb, from_store, to_store)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  Successfully migrated {kb.title} to {to_store}"
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  Error migrating {kb.title}: {str(e)}")
                )
                logger.exception(f"Error migrating knowledge base {kb.uuid}")

        self.stdout.write(self.style.SUCCESS("\nMigration completed successfully!"))

    @transaction.atomic
    def _migrate_knowledge_base(
        self, knowledge_base: KnowledgeBase, from_store: str, to_store: str
    ):
        """Migrate a single knowledge base."""

        # Step 2: Get all chunks from database (they have embeddings saved)
        chunks = KnowledgeBaseChunk.objects.filter(
            document__knowledge_base=knowledge_base
        ).select_related("document")

        if not chunks.exists():
            self.stdout.write(f"  No chunks found for {knowledge_base.title}")
            return

        # Step 3: Update knowledge base to new vector store type
        knowledge_base.vector_store_type = to_store
        knowledge_base.save(update_fields=["vector_store_type"])

        # Step 4: Create new vector store and index all chunks
        new_vector_store = VectorStoreFactory.from_knowledge_base(knowledge_base)
        chunk_list = list(chunks)
        new_vector_store.index_chunks(chunk_list)

        self.stdout.write(f"  Indexed {len(chunk_list)} chunks to {to_store}")

        # Step 5: Delete old vector store data (optional - can be done separately)
        # For safety, we don't delete the old store automatically
        # Admin can delete it manually after verifying the migration

        self.stdout.write(
            f"  Migration complete. Old {from_store} data can be deleted manually if needed."
        )
