from .utils import get_chatbot_response, load_json
from copy import deepcopy

class ClassificationAgent():
    def get_response(self,messages):
        messages = deepcopy(messages)

        system_prompt = """
            You are a helpful AI assistant for a coffee shop application.
            Your task is to determine which agent should handle the user input. You have 3 agents to choose from:
            1. details_agent: Responsible for answering questions about the coffee shop, like location, delivery options, working hours, menu item details, ingredients, or listing menu items.
            2. order_taking_agent: Responsible for taking orders from the user and managing the order conversation.
            3. recommendation_agent: Responsible for giving recommendations to the user about what to buy.

            Your output must be a valid JSON object matching this format exactly:
            {
              "chain of thought": "Write your reasoning here.",
              "decision": "details_agent",
              "message": ""
            }
            Set "decision" to exactly one of: "details_agent", "order_taking_agent", or "recommendation_agent".
            Leave "message" empty ("").
            """

        input_messages = [
            {"role": "system", "content": system_prompt},
        ]

        input_messages += messages[-3:]

        chatbot_output = get_chatbot_response(input_messages)
        output = self.postprocess(chatbot_output)
        return output

    def postprocess(self, output):
        parsed = load_json(output)
        decision = str(parsed.get("decision", "details_agent")).strip().lower()

        valid_agents = ["details_agent", "order_taking_agent", "recommendation_agent"]
        if decision not in valid_agents:
            # Fallback based on substring matching or default
            if "order" in decision:
                decision = "order_taking_agent"
            elif "recommend" in decision:
                decision = "recommendation_agent"
            else:
                decision = "details_agent"

        message = parsed.get("message", "")

        dict_output = {
            "role": "assistant",
            "content": message,
            "memory": {
                "agent": "classification_agent",
                "classification_decision": decision,
            },
        }
        return dict_output

    