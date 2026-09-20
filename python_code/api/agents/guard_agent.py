from .utils import get_chatbot_response, load_json
from copy import deepcopy

class GuardAgent():
    def get_response(self,messages):
        messages=deepcopy(messages)
        system_prompt = """
         You are a helpful AI assistant for a coffee shop application which serves drinks and pastries.
         Your task is to determine whether the user is asking something relevant to the coffee shop or not.
         The user is allowed to:

         1. Ask questions about the coffee shop, like location, working hours, menu items and coffee shop related questions.
         2. Ask questions about menu items, they can ask for ingredients in an item and more details about the item.
         3. Make an order.
         4. Ask about recommendations of what to buy.


         The user is not allowed to:
         1. Ask questions about anything other than our coffee shop.
         2. Ask questions about the staff or how to make a certain menu item.

         Your output must be a valid JSON object matching this format exactly:
         {
           "chain of thought": "Write your reasoning here.",
           "decision": "allowed",
           "message": ""
         }
         Set "decision" to either "allowed" or "not allowed".
         Leave "message" empty ("") if allowed, otherwise set it to "Sorry, I can't help with that. Can I help you with your order?"
        """
        input_messages = [{"role": "system", "content": system_prompt}] + messages[-3:]
        chatbot_output = get_chatbot_response(input_messages)
        output = self.postprocess(chatbot_output)

        return output

    def postprocess(self, output):
        parsed = load_json(output)
        raw_decision = str(parsed.get("decision", "allowed")).strip().lower()
        decision = "not allowed" if "not allowed" in raw_decision else "allowed"

        message = parsed.get("message", "")
        if decision == "not allowed" and not message:
            message = "Sorry, I can't help with that. Can I help you with your order?"

        dict_output = {
            "role": "assistant",
            "content": message,
            "memory": {
                "agent": "guard_agent",
                "guard_decision": decision,
            },
        }
        return dict_output
 