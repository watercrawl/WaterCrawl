# Factory Pattern for Object Creation

## Why Factories?

Factories encapsulate **complex object creation logic** with:
- Multiple configuration options
- Provider-specific implementations
- Dependency injection
- Centralized instantiation

## Factory Design Pattern

### Base Factory Structure

```python
from abc import ABC, abstractmethod
from typing import Any

class BaseFactory(ABC):
    @classmethod
    @abstractmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> Any:
        """Create instance from knowledge base configuration."""
        raise NotImplementedError
```

### Concrete Factory Implementation

```python
class TextSplitterFactory(BaseFactory):
    """Factory for creating text splitters."""
    
    # Registry pattern: map types to classes
    _text_splitters: Dict[str, Type[TextSplitter]] = {
        "recursive": RecursiveCharacterTextSplitter,
        "character": CharacterTextSplitter,
        "token": TokenTextSplitter,
    }
    
    @classmethod
    def create(cls, splitter_type: str, **kwargs) -> TextSplitter:
        """Create by type name."""
        if splitter_type not in cls._text_splitters:
            raise ValueError(f"Type '{splitter_type}' not supported")
        
        return cls._text_splitters[splitter_type](**kwargs)
    
    @classmethod
    def from_knowledge_base(cls, kb: KnowledgeBase) -> TextSplitter:
        """Create from KB configuration."""
        splitter_type = getattr(settings, "KB_TEXT_SPLITTER_TYPE", "recursive")
        
        return cls.create(
            splitter_type,
            chunk_size=kb.chunk_size,
            chunk_overlap=kb.chunk_overlap,
        )
```

## LLM-Specific Factories

### ChatModelFactory

```python
class ChatModelFactory:
    """Create LangChain chat models from provider configs."""
    
    @classmethod
    def create_chat_model_from_provider_config(
        cls,
        llm_model: LLMModel,
        provider_config: ProviderConfig,
        temperature: float = None,
    ) -> BaseChatModel:
        """Create chat model with proper configuration."""
        provider_name = llm_model.provider_name
        model_name = llm_model.key
        api_key = decrypt_key(provider_config.api_key)
        
        if provider_name == "openai":
            return ChatOpenAI(
                model=model_name,
                openai_api_key=api_key,
                openai_api_base=provider_config.base_url or "https://api.openai.com/v1",
                temperature=LLMModelService(llm_model).get_valid_temperature(temperature),
            )
        elif provider_name == "watercrawl":
            from watercrawl_llm import ChatWaterCrawl
            return ChatWaterCrawl(
                model=model_name,
                api_key=api_key,
                base_url=provider_config.base_url,
            )
        else:
            raise ValueError(f"Unsupported provider: {provider_name}")
```

### EmbedderFactory

```python
class EmbedderFactory(BaseFactory):
    """Create embedding models from provider configs."""
    
    @classmethod
    def create_openai_embedding(cls, kb: KnowledgeBase) -> Embeddings:
        return OpenAIEmbeddings(
            model=kb.embedding_model.key,
            openai_api_key=decrypt_key(kb.embedding_provider_config.api_key),
            openai_api_base=kb.embedding_provider_config.base_url or "https://api.openai.com/v1",
        )
    
    @classmethod
    def create_watercrawl_embedding(cls, kb: KnowledgeBase) -> Embeddings:
        from watercrawl_llm import WaterCrawlEmbeddings
        return WaterCrawlEmbeddings(
            model=kb.embedding_model.key,
            api_key=decrypt_key(kb.embedding_provider_config.api_key),
            base_url=kb.embedding_provider_config.base_url,
        )
    
    @classmethod
    def from_knowledge_base(cls, kb: KnowledgeBase) -> Embeddings:
        """Route to correct provider."""
        provider = kb.embedding_provider_config.provider_name
        
        if provider == "openai":
            return cls.create_openai_embedding(kb)
        elif provider == "watercrawl":
            return cls.create_watercrawl_embedding(kb)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
```

## Factory Usage in Services

```python
class KnowledgeBaseService:
    def generate_embeddings(self):
        """Use factories to create configured objects."""
        # Create text splitter
        splitter = TextSplitterFactory.from_knowledge_base(
            self.knowledge_base
        )
        
        # Create embedder
        embedder = EmbedderFactory.from_knowledge_base(
            self.knowledge_base
        )
        
        # Create vector store
        vector_store = VectorStoreFactory.from_knowledge_base(
            self.knowledge_base
        )
        
        # Use them together
        for doc in self.knowledge_base.documents.all():
            chunks = splitter.split_text(doc.content)
            embeddings = embedder.embed_documents(chunks)
            vector_store.add_embeddings(embeddings)
```

## Rules for Factories

- ✅ Use factories for complex object creation
- ✅ Support multiple providers/implementations
- ✅ Accept configuration objects (KnowledgeBase, ProviderConfig)
- ✅ Decrypt sensitive data (API keys) in factory
- ✅ Validate configuration before creation
- ✅ Raise clear errors for unsupported providers
- ✅ Use class methods, not instance methods
- ✅ Return fully configured, ready-to-use objects
