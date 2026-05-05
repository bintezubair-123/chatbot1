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


def extract_json_string(text):
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end >= start:
        return text[start:end + 1]
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
    return json.loads(extract_json_string(text))