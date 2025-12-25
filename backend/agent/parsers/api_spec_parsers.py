import copy
import re
from typing import Dict, Any, List, Optional, Generator, Set

from pydantic import BaseModel


class HttpToolParameters(BaseModel):
    name: str
    description: str
    key: str
    method: str
    path: str
    content_type: str
    input_schema: Optional[Dict[str, Any]]
    output_schema: Optional[Dict[str, Any]]


class APISpecParser:
    """
    Handles parsing of an OpenAPI specification (v3.0.x) and extracts
    structured data for API tools, independent of any database models.
    """

    def __init__(self, openapi_spec: Dict[str, Any]):
        """
        Initializes the parser with the necessary context and validates the spec.

        Args:
            openapi_spec: The parsed OpenAPI JSON dictionary.

        Raises:
            InvalidOpenAPISpecError: If the spec is missing required fields or a base URL.
        """
        self.openapi_spec = openapi_spec

    def validate_spec(self):
        """
        Checks the OpenAPI specification for mandatory fields and base URL existence.

        Raises:
            InvalidOpenAPISpecError: If the specification is invalid.
        """
        # 1. Check for mandatory root fields
        required_root_fields = ["openapi", "info", "paths"]
        for field in required_root_fields:
            if field not in self.openapi_spec:
                raise ValueError(f"Missing required OpenAPI root field: '{field}'")

        # 2. Check for base URL existence
        if self.base_url is None:
            raise ValueError(
                "Could not determine the base URL. The 'servers' array must contain at least one server object with a 'url' property."
            )

    def _create_json_schema_from_parameters(
        self, parameters: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Converts a list of OpenAPI 'in' parameters (path or query) into a basic JSON schema.

        Returns: A JSON schema dictionary (type: object) or None if no parameters are present.
        """
        schema = {"type": "object", "properties": {}, "required": []}

        for param in parameters:
            param_name = param.get("name")
            param_schema = param.get("schema", {})
            param_required = param.get("required", False)

            if not param_name:
                continue

            schema["properties"][param_name] = param_schema

            if param_required:
                schema["required"].append(param_name)

        # Only return the schema if it actually contains properties
        return schema if schema["properties"] else None

    def _resolve_refs(
        self,
        schema_fragment: Optional[Dict[str, Any]],
        seen_refs: Optional[Set[str]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Recursively resolves local JSON references (#/components/schemas/...) within a schema fragment.
        Replaces all $ref objects with their actual inline schema content.

        Args:
            schema_fragment: The schema fragment to resolve.
            seen_refs: Set of already seen refs to prevent infinite recursion with circular references.

        Returns:
            The schema with all references resolved inline.
        """
        if schema_fragment is None:
            return None

        if seen_refs is None:
            seen_refs = set()

        # Work on a deep copy to prevent modifying the original openapi_spec
        resolved_schema = copy.deepcopy(schema_fragment)

        def resolve_ref_path(ref_path: str) -> Optional[Dict[str, Any]]:
            """Resolve a $ref path to its target schema."""
            if not ref_path.startswith("#/"):
                return None

            path_parts = ref_path.lstrip("#/").split("/")
            target = self.openapi_spec

            try:
                for part in path_parts:
                    # Handle URL-encoded characters in ref paths
                    part = part.replace("~1", "/").replace("~0", "~")
                    target = target[part]
                return copy.deepcopy(target)
            except (KeyError, TypeError):
                print(f"Warning: Could not resolve reference: {ref_path}")
                return None

        def resolve_recursive(obj, current_seen: Set[str]):
            """Recursively resolve all $ref in the object."""
            if obj is None:
                return None

            if isinstance(obj, dict):
                # Handle $ref
                if "$ref" in obj:
                    ref_path = obj["$ref"]

                    # Prevent infinite recursion for circular references
                    if ref_path in current_seen:
                        # Return a simplified schema for circular refs
                        return {
                            "type": "object",
                            "description": f"Circular reference to {ref_path.split('/')[-1]}",
                        }

                    resolved_target = resolve_ref_path(ref_path)
                    if resolved_target is not None:
                        # Add to seen refs before recursing
                        new_seen = current_seen | {ref_path}
                        # Recursively resolve the target
                        resolved_target = resolve_recursive(resolved_target, new_seen)

                        # Merge any additional properties from the original object (except $ref)
                        # This handles cases like: {"$ref": "...", "description": "override"}
                        for key, value in obj.items():
                            if key != "$ref":
                                resolved_target[key] = resolve_recursive(
                                    value, new_seen
                                )

                        return resolved_target
                    else:
                        # Could not resolve, return without $ref
                        return {
                            "type": "object",
                            "description": f"Unresolved reference: {ref_path}",
                        }

                # Process all keys in the dict
                result = {}
                for key, value in obj.items():
                    result[key] = resolve_recursive(value, current_seen)
                return result

            elif isinstance(obj, list):
                return [resolve_recursive(item, current_seen) for item in obj]

            # Primitives (str, int, bool, etc.)
            return obj

        return resolve_recursive(resolved_schema, seen_refs)

    @staticmethod
    def _to_human_readable_name(text: str) -> str:
        """
        Convert an operationId or path-based name to a human-readable name.

        Examples:
            - 'getUserById' -> 'Get User By Id'
            - 'get_user_by_id' -> 'Get User By Id'
            - 'GET-users-list' -> 'GET Users List'
        """
        if not text:
            return text

        # Replace common separators with spaces
        result = re.sub(r"[-_]", " ", text)

        # Insert space before uppercase letters (camelCase handling)
        result = re.sub(r"([a-z])([A-Z])", r"\1 \2", result)

        # Insert space between letters and numbers
        result = re.sub(r"([a-zA-Z])(\d)", r"\1 \2", result)
        result = re.sub(r"(\d)([a-zA-Z])", r"\1 \2", result)

        # Normalize multiple spaces
        result = re.sub(r"\s+", " ", result).strip()

        # Title case each word
        return result.title()

    def _build_description(
        self, operation: Dict[str, Any], method: str, path: str
    ) -> str:
        """
        Build a comprehensive description for the tool from multiple sources.

        Priority:
        1. operation.description (full description)
        2. operation.summary (brief summary)
        3. Generated fallback
        """
        parts = []

        # Primary description
        summary = operation.get("summary", "").strip()
        description = operation.get("description", "").strip()

        if description:
            parts.append(description)
        elif summary:
            parts.append(summary)
        else:
            parts.append(f"Performs a {method.upper()} request to {path}")

        # Add summary as additional context if both exist and are different
        if summary and description and summary.lower() != description.lower():
            if summary not in description:
                parts.insert(0, f"{summary}.")

        # Add parameter descriptions if available
        parameters = operation.get("parameters", [])
        param_descriptions = []
        for param in parameters:
            param_name = param.get("name")
            param_desc = param.get("description", "").strip()
            param_required = param.get("required", False)
            if param_name and param_desc:
                req_str = " (required)" if param_required else ""
                param_descriptions.append(f"- {param_name}{req_str}: {param_desc}")

        if param_descriptions:
            parts.append("\n\nParameters:\n" + "\n".join(param_descriptions))

        return " ".join(parts) if len(parts) == 1 else "\n".join(parts)

    def parse(self) -> Generator[HttpToolParameters, None, None]:
        """
        Executes the main parsing logic and extracts all necessary parameters
        for generating APISpecTools.

        Returns:
            A generator yielding HttpToolParameters for each API operation.
        """
        # Iterate through paths and operations
        paths = self.openapi_spec.get("paths", {})

        for path, path_item in paths.items():
            for method, operation in path_item.items():
                if method.lower() not in ["get", "post", "put", "delete", "patch"]:
                    continue

                # --- Extract Tool Metadata ---
                operation_id = operation.get("operationId")

                # Generate a fallback key from method and path if no operationId
                fallback_key = f"{method}_{path.strip('/').replace('/', '_').replace('{', '').replace('}', '')}"

                # Key is the operationId or generated fallback
                raw_key = (operation_id or fallback_key).lower()
                # Replace any character that is not a lowercase letter or underscore with an underscore
                tool_key = re.sub(r"[^a-z_]+", "_", raw_key).strip("_")

                # Name is human-readable version
                # Prefer summary for name, fall back to converting the key
                summary = operation.get("summary", "").strip()
                if summary:
                    tool_name = summary
                else:
                    tool_name = self._to_human_readable_name(tool_key)

                # Build comprehensive description
                description = self._build_description(operation, method, path)

                # --- Build Input Schema Components ---

                path_parameters = path_item.get("parameters", [])
                operation_parameters = operation.get("parameters", [])
                all_parameters = path_parameters + operation_parameters

                url_parameters = [p for p in all_parameters if p.get("in") == "path"]
                query_parameters = [p for p in all_parameters if p.get("in") == "query"]

                # Header parameters (exclude security-related headers)
                security_header_names = {
                    "authorization",
                    "x-api-key",
                    "api-key",
                    "apikey",
                    "x-auth-token",
                    "x-access-token",
                    "bearer",
                    "token",
                    "x-csrf-token",
                    "x-xsrf-token",
                    "content-type",
                }
                header_parameters = [
                    p
                    for p in all_parameters
                    if p.get("in") == "header"
                    and p.get("name", "").lower() not in security_header_names
                ]

                # Path/URL Parameters Schema (type: object)
                url_params_schema_content = self._create_json_schema_from_parameters(
                    url_parameters
                )

                # Query Parameters Schema (type: object)
                query_params_schema_content = self._create_json_schema_from_parameters(
                    query_parameters
                )

                # Header Parameters Schema (type: object)
                header_params_schema_content = self._create_json_schema_from_parameters(
                    header_parameters
                )

                # Request Body Schema - detect content type with priority
                body_params_schema_content = None
                request_body = operation.get("requestBody")
                request_body_required = False
                content_type = None  # Will be set based on request body content

                # Content type priority order
                content_type_priority = [
                    "application/json",
                    "application/x-www-form-urlencoded",
                    "multipart/form-data",
                    "text/plain",
                    "application/xml",
                    "text/xml",
                ]

                if request_body:
                    request_body_required = request_body.get("required", False)
                    content = request_body.get("content", {})

                    # Find the best available content type
                    for ct in content_type_priority:
                        if ct in content:
                            content_type = ct
                            body_content = content[ct]
                            if "schema" in body_content:
                                body_params_schema_content = body_content["schema"]
                            break

                    # If no priority content type found, use the first available
                    if content_type is None and content:
                        content_type = next(iter(content.keys()))
                        body_content = content[content_type]
                        if "schema" in body_content:
                            body_params_schema_content = body_content["schema"]

                # --- Construct the FINAL Input Schema (single JSON Schema object) ---

                final_input_schema = {
                    "type": "object",
                    "description": "The required and optional input parameters for this API call.",
                    "properties": {},
                    "required": [],
                }

                # 1. Add URL Parameters
                if url_params_schema_content:
                    final_input_schema["properties"]["url_params"] = {
                        "type": "object",
                        "description": "Parameters needed to replace variables in the URL path (e.g., {userId}).",
                        **url_params_schema_content,
                    }

                # 2. Add Query Parameters
                if query_params_schema_content:
                    final_input_schema["properties"]["query_params"] = {
                        "type": "object",
                        "description": "Parameters added to the URL query string (e.g., ?status=active).",
                        **query_params_schema_content,
                    }

                # 3. Add Header Parameters
                if header_params_schema_content:
                    final_input_schema["properties"]["header_params"] = {
                        "type": "object",
                        "description": "Custom HTTP headers to include in the request.",
                        **header_params_schema_content,
                    }

                # 4. Add Body Parameters
                if body_params_schema_content:
                    # Description varies based on content type
                    body_descriptions = {
                        "application/json": "The JSON payload for the request body.",
                        "application/x-www-form-urlencoded": "Form fields to send as URL-encoded data.",
                        "multipart/form-data": "Form fields and files to send as multipart data.",
                        "text/plain": "Plain text content for the request body.",
                        "application/xml": "XML payload for the request body.",
                        "text/xml": "XML payload for the request body.",
                    }
                    body_description = body_descriptions.get(
                        content_type, f"Request body content ({content_type})."
                    )

                    final_input_schema["properties"]["body_params"] = {
                        "type": "object",
                        "description": body_description,
                        **body_params_schema_content,
                    }

                    # If the requestBody itself was required, mark the 'body_params' wrapper as required.
                    if request_body_required:
                        final_input_schema["required"].append("body_params")

                # Set final schema to None if no parameters were found at all
                if not final_input_schema["properties"]:
                    final_input_schema = None

                # --- Build Output Schema (Success responses) ---
                output_schema = None
                responses = operation.get("responses", {})
                success_response = responses.get("200") or responses.get("201")

                if success_response:
                    content = success_response.get("content", {})
                    json_content = content.get("application/json")

                    if json_content and "schema" in json_content:
                        output_schema = json_content["schema"]

                # --- Resolve all references in schemas (deep inline resolution) ---
                if final_input_schema:
                    final_input_schema = self._resolve_refs(final_input_schema)
                if output_schema:
                    output_schema = self._resolve_refs(output_schema)

                # --- Collect Tool Parameters ---
                yield HttpToolParameters(
                    name=tool_name,
                    description=description,
                    key=tool_key,
                    method=method.upper(),
                    path=path,
                    content_type=content_type
                    or "application/json",  # Default to JSON if no body
                    input_schema=final_input_schema,
                    output_schema=output_schema,
                )
