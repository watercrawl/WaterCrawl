"""
Parameter Strategy Module

This module handles tool parameter configuration strategies:
- llm: Let the LLM decide the parameter value (keep in schema)
- fixed: Use a predefined value (remove from schema, inject at call time)
- exclude: Remove parameter entirely (remove from schema, don't pass to function)
- keep: For nested objects, configure nested properties individually
"""

import copy
import logging
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Strategy constants
STRATEGY_LLM = "llm"
STRATEGY_FIXED = "fixed"
STRATEGY_EXCLUDE = "exclude"
STRATEGY_KEEP = "keep"


class ParameterStrategyProcessor:
    """
    Processor for handling parameter strategy configurations.

    This class:
    1. Modifies input_schema based on strategy config (for LLM visibility)
    2. Extracts fixed values to inject at call time
    3. Merges LLM params with fixed values when tool is called
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the processor with a configuration.

        Args:
            config: The tool configuration containing parameter strategies.
                   Expected format:
                   {
                       "parameters": {
                           "type": "object",
                           "properties": {
                               "param1": {"strategy": "fixed", "value": "..."},
                               "param2": {"strategy": "exclude"},
                               "param3": {"strategy": "llm"},
                               "nested": {
                                   "strategy": "keep",
                                   "properties": {
                                       "nestedA": {"strategy": "fixed", "value": 123}
                                   }
                               }
                           }
                       }
                   }
        """
        self.config = config or {}
        self._strategy_config = self._extract_strategy_config()

    def _extract_strategy_config(self) -> Dict[str, Any]:
        """Extract the parameter strategy configuration."""
        parameters = self.config.get("parameters", {})
        return parameters.get("properties", {})

    def process_schema(
        self, input_schema: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Process the input schema based on strategy configuration.

        Returns:
            Tuple of (modified_schema, fixed_values)
            - modified_schema: Schema with fixed/excluded fields removed
            - fixed_values: Dict of fixed values to inject at call time
        """
        if not input_schema or not self._strategy_config:
            logger.debug("No schema or strategy config, returning original schema")
            return input_schema, {}

        modified_schema = copy.deepcopy(input_schema)
        fixed_values = {}

        properties = modified_schema.get("properties", {})
        required = list(modified_schema.get("required", []))

        # Process each property based on its strategy
        properties_to_remove = []

        for prop_name, strategy_config in self._strategy_config.items():
            if prop_name not in properties:
                continue

            strategy = strategy_config.get("strategy", STRATEGY_LLM)

            if strategy == STRATEGY_FIXED:
                # Remove from schema, store fixed value
                properties_to_remove.append(prop_name)
                fixed_values[prop_name] = strategy_config.get("value")
                if prop_name in required:
                    required.remove(prop_name)

            elif strategy == STRATEGY_EXCLUDE:
                # Remove from schema entirely
                properties_to_remove.append(prop_name)
                if prop_name in required:
                    required.remove(prop_name)

            elif strategy == STRATEGY_KEEP:
                # For nested objects, process nested properties
                nested_properties = strategy_config.get("properties", {})
                if nested_properties and "properties" in properties.get(prop_name, {}):
                    nested_schema, nested_fixed = self._process_nested_schema(
                        properties[prop_name], nested_properties
                    )
                    properties[prop_name] = nested_schema
                    if nested_fixed:
                        fixed_values[prop_name] = nested_fixed

            # STRATEGY_LLM: Keep in schema as-is (no action needed)

        # Remove properties marked for removal
        for prop_name in properties_to_remove:
            properties.pop(prop_name, None)

        modified_schema["properties"] = properties
        modified_schema["required"] = required

        logger.debug(
            f"Schema processed: removed {len(properties_to_remove)} properties, "
            f"fixed values for: {list(fixed_values.keys())}"
        )

        return modified_schema, fixed_values

    def _process_nested_schema(
        self, prop_schema: Dict[str, Any], nested_config: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Process nested object schema properties.

        Args:
            prop_schema: The schema for the nested object property
            nested_config: The strategy config for nested properties

        Returns:
            Tuple of (modified_nested_schema, nested_fixed_values)
        """
        modified_schema = copy.deepcopy(prop_schema)
        fixed_values = {}

        properties = modified_schema.get("properties", {})
        required = list(modified_schema.get("required", []))

        properties_to_remove = []

        for nested_prop, nested_strategy in nested_config.items():
            if nested_prop not in properties:
                continue

            strategy = nested_strategy.get("strategy", STRATEGY_LLM)

            if strategy == STRATEGY_FIXED:
                properties_to_remove.append(nested_prop)
                fixed_values[nested_prop] = nested_strategy.get("value")
                if nested_prop in required:
                    required.remove(nested_prop)

            elif strategy == STRATEGY_EXCLUDE:
                properties_to_remove.append(nested_prop)
                if nested_prop in required:
                    required.remove(nested_prop)

            elif strategy == STRATEGY_KEEP:
                # Recursively handle deeply nested objects
                deeper_properties = nested_strategy.get("properties", {})
                if deeper_properties and "properties" in properties.get(
                    nested_prop, {}
                ):
                    deeper_schema, deeper_fixed = self._process_nested_schema(
                        properties[nested_prop], deeper_properties
                    )
                    properties[nested_prop] = deeper_schema
                    if deeper_fixed:
                        fixed_values[nested_prop] = deeper_fixed

        # Remove properties marked for removal
        for prop_name in properties_to_remove:
            properties.pop(prop_name, None)

        modified_schema["properties"] = properties
        modified_schema["required"] = required

        return modified_schema, fixed_values

    def merge_params(
        self, llm_params: Dict[str, Any], fixed_values: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Merge LLM-provided parameters with fixed values.

        Fixed values take precedence and are injected into the final params.
        Handles nested objects by deep merging.

        Args:
            llm_params: Parameters provided by the LLM
            fixed_values: Fixed values from configuration

        Returns:
            Merged parameters dict
        """
        if not fixed_values:
            return llm_params

        result = copy.deepcopy(llm_params)

        for key, fixed_value in fixed_values.items():
            if (
                isinstance(fixed_value, dict)
                and key in result
                and isinstance(result[key], dict)
            ):
                # Deep merge for nested objects
                result[key] = self._deep_merge(result[key], fixed_value)
            else:
                # Direct assignment for non-nested or override
                result[key] = fixed_value

        return result

    def _deep_merge(
        self, base: Dict[str, Any], override: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Deep merge two dictionaries, with override taking precedence."""
        result = copy.deepcopy(base)

        for key, value in override.items():
            if (
                key in result
                and isinstance(result[key], dict)
                and isinstance(value, dict)
            ):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value

        return result


def create_strategy_wrapper(
    original_func, fixed_values: Dict[str, Any], processor: ParameterStrategyProcessor
):
    """
    Create a wrapper function that injects fixed values before calling the original.

    Args:
        original_func: The original tool function
        fixed_values: Fixed values to inject
        processor: The parameter strategy processor

    Returns:
        Wrapped function that merges fixed values with LLM params
    """

    def wrapper(**kwargs):
        # Extract tool_call_id if present (special param, not for merging)
        tool_call_id = kwargs.pop("tool_call_id", None)

        # Merge LLM params with fixed values
        merged_params = processor.merge_params(kwargs, fixed_values)

        # Add back tool_call_id if it was present
        if tool_call_id is not None:
            merged_params["tool_call_id"] = tool_call_id

        return original_func(**merged_params)

    return wrapper


async def create_async_strategy_wrapper(
    original_coro, fixed_values: Dict[str, Any], processor: ParameterStrategyProcessor
):
    """
    Create an async wrapper function that injects fixed values before calling the original.

    This returns a coroutine function, not a wrapper factory.
    """

    async def wrapper(**kwargs):
        # Extract tool_call_id if present
        tool_call_id = kwargs.pop("tool_call_id", None)

        # Merge LLM params with fixed values
        merged_params = processor.merge_params(kwargs, fixed_values)

        # Add back tool_call_id if it was present
        if tool_call_id is not None:
            merged_params["tool_call_id"] = tool_call_id

        return await original_coro(**merged_params)

    return wrapper
