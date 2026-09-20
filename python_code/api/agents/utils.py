import json

from llm_provider import get_llm_response


def _messages_to_prompt(messages):
    prompt_parts = []
    for message in messages:
        role = message["role"].upper()
        content = message["content"]
        prompt_parts.append(f"{role}:\n{content}")
    prompt_parts.append("ASSISTANT:")
    return "\n\n".join(prompt_parts)


import re

def extract_json_string(text):
    text = text.strip()
    # Strip markdown code blocks if present
    code_block_match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if code_block_match:
        text = code_block_match.group(1).strip()

    # Find boundaries for JSON object or array
    obj_start = text.find("{")
    obj_end = text.rfind("}")
    arr_start = text.find("[")
    arr_end = text.rfind("]")

    start = -1
    end = -1

    if obj_start != -1 and (arr_start == -1 or obj_start < arr_start):
        start = obj_start
        end = obj_end
    elif arr_start != -1:
        start = arr_start
        end = arr_end

    if start != -1 and end != -1 and end >= start:
        return text[start : end + 1]
    return text


def get_chatbot_response(messages, temperature=0):
    system_prompt = None
    conversation_messages = messages

    if messages and messages[0]["role"] == "system":
        system_prompt = messages[0]["content"]
        conversation_messages = messages[1:]

    prompt = _messages_to_prompt(conversation_messages)
    return get_llm_response(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=temperature,
    )


def double_check_json_output(json_string):
    prompt = f"""You will check this JSON string and correct any mistakes that make it invalid.
Return only the corrected JSON string.
If the JSON is already valid, return it unchanged.

{json_string}
"""
    response = get_llm_response(prompt)
    return extract_json_string(response)


def load_json(text):
    extracted = extract_json_string(text)
    try:
        return json.loads(extracted)
    except Exception:
        # Fallback: fix trailing commas in objects/lists
        cleaned = re.sub(r",\s*([\]}])", r"\1", extracted)
        try:
            return json.loads(cleaned)
        except Exception:
            # Second fallback: ask LLM to correct json if initial parse failed
            corrected = double_check_json_output(extracted)
            return json.loads(corrected)