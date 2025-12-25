"""
Django management command to validate LLM model configurations.

Usage:
    python manage.py check_model_configs openai llms
    python manage.py check_model_configs --all
    python manage.py check_model_configs openai --all-types
"""

from typing import Union

from django.core.management.base import BaseCommand

from llm.models_config.config import ModelConfigLoader, ModelType, ModelConfig


class Command(BaseCommand):
    help = "Check and validate LLM model configurations by loading them without cache"

    def add_arguments(self, parser):
        parser.add_argument(
            "provider",
            nargs="?",
            type=str,
            help="Provider name (e.g., openai, anthropic). Use --all to check all providers.",
        )
        parser.add_argument(
            "model_type",
            nargs="?",
            type=str,
            default="llms",
            help="Model type (e.g., llms, embeddings). Default: llms",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Check all providers and model types",
        )
        parser.add_argument(
            "--all-types",
            action="store_true",
            help="Check all model types for the specified provider",
        )
        parser.add_argument(
            "--details",
            action="store_true",
            help="Show detailed output for each model",
        )

    def handle(self, *args, **options):
        provider = options.get("provider")
        model_type = options.get("model_type")
        check_all = options.get("all")
        all_types = options.get("all_types")
        verbose = options.get("details")

        if check_all:
            self._check_all_providers(verbose)
        elif provider:
            if all_types:
                self._check_provider_all_types(provider, verbose)
            else:
                self._check_provider_type(provider, model_type, verbose)
        else:
            # List available providers
            providers = ModelConfigLoader.list_providers()
            self.stdout.write(
                self.style.WARNING("No provider specified. Available providers:")
            )
            for p in providers:
                self.stdout.write(f"  - {p}")
            self.stdout.write(
                "\nUsage: python manage.py check_model_configs <provider> [model_type]"
            )
            self.stdout.write("       python manage.py check_model_configs --all")

    def _check_all_providers(self, verbose: bool):
        """Check all providers and all model types."""
        providers = ModelConfigLoader.list_providers()
        total_success = 0
        total_errors = 0

        for provider in providers:
            success, errors = self._check_provider_all_types(provider, verbose)
            total_success += success
            total_errors += errors

        self._print_summary(total_success, total_errors)

    def _check_provider_all_types(self, provider: str, verbose: bool) -> tuple:
        """Check all model types for a provider."""
        total_success = 0
        total_errors = 0

        self.stdout.write(self.style.HTTP_INFO(f"\n{'=' * 60}"))
        self.stdout.write(self.style.HTTP_INFO(f"Provider: {provider}"))
        self.stdout.write(self.style.HTTP_INFO(f"{'=' * 60}"))

        for model_type in ModelType:
            models = ModelConfigLoader.list_models(provider, model_type)
            if models:
                success, errors = self._check_provider_type(
                    provider, model_type, verbose, show_header=False
                )
                total_success += success
                total_errors += errors

        return total_success, total_errors

    def _check_provider_type(
        self,
        provider: str,
        model_type: Union[str, ModelType],
        verbose: bool,
        show_header: bool = True,
    ) -> tuple:
        """Check all models for a specific provider and model type."""
        try:
            if isinstance(model_type, str):
                model_type = ModelType(model_type.lower())
        except KeyError:
            self.stdout.write(self.style.ERROR(f"Invalid model type: {model_type}"))
            return 0, 0

        models = ModelConfigLoader.list_models(provider, model_type)

        if not models:
            self.stdout.write(
                self.style.WARNING(f"No models found for {provider}/{model_type.value}")
            )
            return 0, 0

        if show_header:
            self.stdout.write(
                self.style.HTTP_INFO(f"\nChecking {provider}/{model_type.value}...")
            )
            self.stdout.write(self.style.HTTP_INFO("-" * 40))
        else:
            self.stdout.write(f"\n  Model Type: {model_type.value}")
            self.stdout.write("  " + "-" * 38)

        success_count = 0
        error_count = 0

        for model_name in models:
            try:
                loader = ModelConfigLoader(provider, model_type, model_name)
                config = loader.load(use_cache=False)  # Load without cache

                # Validate by accessing key properties
                _ = config.key
                _ = config.label
                _ = config.features
                _ = config.model_properties
                _ = config.parameters_schema  # This will validate parameter templates

                success_count += 1

                if verbose:
                    self._print_model_details(config)
                else:
                    self.stdout.write(self.style.SUCCESS(f"  ✓ {model_name}"))

            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(f"  ✗ {model_name}: {str(e)}"))

        # Print summary for this type
        if show_header:
            self._print_summary(success_count, error_count)

        return success_count, error_count

    def _print_model_details(self, config: ModelConfig):
        """Print detailed information about a model config."""
        self.stdout.write(self.style.SUCCESS(f"  ✓ {config.key}"))
        self.stdout.write(f"      Label: {config.label}")
        self.stdout.write(f"      Type: {config.model_type}")
        self.stdout.write(f"      Mode: {config.mode}")
        self.stdout.write(f"      Context Size: {config.context_size}")
        self.stdout.write(
            f"      Features: {', '.join(config.features) if config.features else 'none'}"
        )

        # Show parameters
        schema = config.parameters_schema
        if schema.get("properties"):
            params = list(schema["properties"].keys())
            self.stdout.write(f"      Parameters: {', '.join(params)}")
        self.stdout.write("")

    def _print_summary(self, success: int, errors: int):
        """Print a summary of the check results."""
        total = success + errors
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO(f"Summary: {total} models checked"))
        self.stdout.write(self.style.SUCCESS(f"  ✓ {success} passed"))
        if errors > 0:
            self.stdout.write(self.style.ERROR(f"  ✗ {errors} failed"))
        else:
            self.stdout.write(self.style.SUCCESS("  All configurations are valid!"))
