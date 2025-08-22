from typing import List

from django.conf import settings
from django.utils.functional import cached_property
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel

from knowledge_base.interfaces import BaseKeywordExtractor
from knowledge_base.models import KnowledgeBase
import jieba.analyse

from llm.factories import ChatModelFactory
from llm.models import LLMModel, ProviderConfig


class KeywordsSchema(BaseModel):
    keywords: list[str]


# Create parser from the model
parser = PydanticOutputParser(pydantic_object=KeywordsSchema)


class JiebaKeywordExtractor(BaseKeywordExtractor):
    @classmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> BaseKeywordExtractor:
        return cls()

    def extract_keywords(self, text: str) -> List[str]:
        result = []
        check_list = []
        for word in jieba.analyse.extract_tags(text, topK=settings.KB_KEYWORD_COUNT):
            word = word.replace("#", "").replace("@", "").replace(".", "").strip()
            if len(word) < 2:
                continue
            if word.lower() in check_list:
                continue
            result.append(word)
            check_list.append(word.lower())
        return result


class LLMKeywordExtractor(BaseKeywordExtractor):
    def __init__(
        self, language_model: LLMModel = None, provider_config: ProviderConfig = None
    ) -> None:
        self.language_model: LLMModel = language_model
        self.provider_config: ProviderConfig = provider_config

    @classmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> BaseKeywordExtractor:
        return cls(
            language_model=knowledge_base.summarization_model,
            provider_config=knowledge_base.summarization_provider_config,
        )

    @cached_property
    def llm(self) -> BaseChatModel:
        return ChatModelFactory.create_chat_model_from_provider_config(
            llm_model=self.language_model,
            provider_config=self.provider_config,
            temperature=0,
        )

    def extract_keywords(self, text: str) -> List[str]:
        prompt_template = PromptTemplate(
            template="""Extract up to {count} keywords from the following document.
Return output strictly as JSON that fits this schema:

{format_instructions}

Document:
{content}
""",
            input_variables=["count", "content", "format_instructions"],
            template_format="f-string",
        )

        prompt = prompt_template.format(
            count=settings.KB_KEYWORD_COUNT,
            content=text,
            format_instructions=parser.get_format_instructions(),
        )

        response = self.llm.invoke([HumanMessage(content=prompt)])

        # Parse output to Python object using Pydantic parser
        result = parser.parse(response.content)

        return result.keywords
