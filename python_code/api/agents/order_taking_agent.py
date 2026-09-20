import os
import json
from .utils import get_chatbot_response, load_json
from copy import deepcopy

import unicodedata

MENU_PRICES = {
    "Cappuccino": 4.50,
    "Jumbo Savory Scone": 3.25,
    "Latte": 4.75,
    "Chocolate Chip Biscotti": 2.50,
    "Espresso shot": 2.00,
    "Hazelnut Biscotti": 2.75,
    "Chocolate Croissant": 3.75,
    "Dark chocolate (Drinking Chocolate)": 5.00,
    "Cranberry Scone": 3.50,
    "Croissant": 3.25,
    "Almond Croissant": 4.00,
    "Ginger Biscotti": 2.50,
    "Oatmeal Scone": 3.25,
    "Ginger Scone": 3.50,
    "Chocolate syrup": 1.50,
    "Hazelnut syrup": 1.50,
    "Carmel syrup": 1.50,
    "Sugar Free Vanilla syrup": 1.50,
    "Dark chocolate (Packaged Chocolate)": 3.00,
    "Flat White": 4.75,
    "Caffè Mocha": 5.00,
    "Caffè Panna": 4.50,
    "Mocha Fusi": 5.25,
}


def normalize_str(s: str) -> str:
    # Normalize unicode accents e.g. Caffè -> Caffe
    normalized = unicodedata.normalize("NFKD", s)
    return "".join(c for c in normalized if not unicodedata.combining(c)).lower().strip()


def calculate_order_prices(order_list):
    validated_order = []
    total_price = 0.0
    for item_dict in order_list:
        if not isinstance(item_dict, dict):
            continue
        item_name = str(item_dict.get("item", "")).strip()
        quantity = item_dict.get("quantity", item_dict.get("quanitity", 1))
        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            quantity = 1

        price_per_unit = 0.0
        matched_name = item_name
        normalized_input = normalize_str(item_name)
        for menu_name, price in MENU_PRICES.items():
            if normalize_str(menu_name) == normalized_input:
                price_per_unit = price
                matched_name = menu_name
                break

        item_total = price_per_unit * quantity
        total_price += item_total
        validated_order.append(
            {
                "item": matched_name,
                "quantity": quantity,
                "price": round(item_total, 2),
            }
        )
    return validated_order, round(total_price, 2)


class OrderTakingAgent():
    def __init__(self, recommendation_agent):
        self.recommendation_agent = recommendation_agent

    def get_response(self, messages):
        messages = deepcopy(messages)
        system_prompt = """
            You are a customer support Bot for a coffee shop called "Merry's way"

            Here is the menu for this coffee shop:
            Cappuccino - $4.50
            Jumbo Savory Scone - $3.25
            Latte - $4.75
            Chocolate Chip Biscotti - $2.50
            Espresso shot - $2.00
            Hazelnut Biscotti - $2.75
            Chocolate Croissant - $3.75
            Dark chocolate (Drinking Chocolate) - $5.00
            Cranberry Scone - $3.50
            Croissant - $3.25
            Almond Croissant - $4.00
            Ginger Biscotti - $2.50
            Oatmeal Scone - $3.25
            Ginger Scone - $3.50
            Chocolate syrup - $1.50
            Hazelnut syrup - $1.50
            Carmel syrup - $1.50
            Sugar Free Vanilla syrup - $1.50
            Dark chocolate (Packaged Chocolate) - $3.00
            Flat White - $4.75
            Caffè Mocha - $5.00
            Caffè Panna - $4.50
            Mocha Fusi - $5.25

            Things to NOT DO:
            * Don't ask how to pay by cash or Card.
            * Don't tell the user to go to the counter.
            * Don't tell the user to go to another place to get the order.

            Your task is as follows:
            1. Take the User's Order.
            2. Validate that all their items are in the menu.
            3. If an item is not in the menu, inform the user and repeat back the remaining valid order.
            4. Ask them if they need anything else.
            5. If they do, repeat starting from step 3.
            6. If they don't want anything else:
                - List down all the ordered items with prices.
                - State the calculated grand total.
                - Thank the user and close the conversation nicely.

            Your output must be a valid JSON object matching this format exactly:
            {
              "chain of thought": "Write your reasoning about current order state and next response.",
              "step number": "1",
              "order": [
                {"item": "Latte", "quantity": 1, "price": 4.75}
              ],
              "response": "Write response to the user here."
            }
        """

        last_order_taking_status = ""
        asked_recommendation_before = False
        for message_index in range(len(messages) - 1, -1, -1):
            message = messages[message_index]

            agent_name = message.get("memory", {}).get("agent", "")
            if message["role"] == "assistant" and agent_name == "order_taking_agent":
                step_number = message["memory"].get("step number", "1")
                order = message["memory"].get("order", [])
                asked_recommendation_before = message["memory"].get(
                    "asked_recommendation_before", False
                )
                last_order_taking_status = f"""
                step number: {step_number}
                order: {order}
                """
                break

        if last_order_taking_status:
            messages[-1]["content"] = (
                last_order_taking_status + " \n " + messages[-1]["content"]
            )

        input_messages = [{"role": "system", "content": system_prompt}] + messages

        chatbot_output = get_chatbot_response(input_messages)
        output = self.postprocess(chatbot_output, messages, asked_recommendation_before)

        return output

    def postprocess(self, output, messages, asked_recommendation_before):
        parsed = load_json(output)

        raw_order = parsed.get("order", [])
        if isinstance(raw_order, str):
            try:
                raw_order = json.loads(raw_order)
            except Exception:
                raw_order = []

        validated_order, total_price = calculate_order_prices(raw_order)
        response = parsed.get("response", "")

        # Append recommendations without destroying the order response
        if not asked_recommendation_before and len(validated_order) > 0:
            rec_output = self.recommendation_agent.get_recommendations_from_order(
                messages, validated_order
            )
            rec_text = rec_output.get("content", "")
            if rec_text:
                response = f"{response}\n\n{rec_text}".strip()
            asked_recommendation_before = True

        dict_output = {
            "role": "assistant",
            "content": response,
            "memory": {
                "agent": "order_taking_agent",
                "step number": str(parsed.get("step number", "1")),
                "order": validated_order,
                "total_price": total_price,
                "asked_recommendation_before": asked_recommendation_before,
            },
        }

        return dict_output

    