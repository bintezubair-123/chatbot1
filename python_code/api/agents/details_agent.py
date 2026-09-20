import json
from pathlib import Path
from .utils import get_chatbot_response
from copy import deepcopy
from pathlib import Path



class DetailsAgent():
    def __init__(self):
        BASE_DIR = Path(__file__).resolve().parent.parent.parent
        about_us_path = BASE_DIR / "products" / "Merry's_way_about_us.txt"
        menu_items_path = BASE_DIR / "products" / "menu_items_text.txt"
        products_path = BASE_DIR / "products" / "products.jsonl"

        with open(about_us_path, "r", encoding="utf-8") as file:
            about_us = file.read().strip()
        with open(menu_items_path, "r", encoding="utf-8") as file:
            menu_items = file.read().strip()

        product_details = []
        with open(products_path, "r", encoding="utf-8") as file:
            for line in file:
                if line.strip():
                    product = json.loads(line)
                    product_details.append(
                        f"{product['name']} ({product['category']}): "
                        f"{product['description']} Ingredients: {', '.join(product['ingredients'])}. "
                        f"Price: ${product['price']:.2f}. Rating: {product['rating']}."
                    )

        self.knowledge_base = "\n\n".join(
            [about_us, menu_items, "Product Details:\n" + "\n".join(product_details)]
        )

    def get_response(self, messages):
        messages = deepcopy(messages)

        system_prompt = f"""
You are a customer support agent for a coffee shop called "Merry's way".
Answer the user's questions as a helpful waiter, using ONLY the official coffee-shop knowledge base provided below.
If the answer or menu item is not mentioned in the knowledge base, state politely that you do not have that information. Do NOT invent facts or items outside of this knowledge base.

Knowledge Base:
{self.knowledge_base}
"""
        input_messages = [{"role": "system", "content": system_prompt}] + messages[-3:]
        chatbot_output = get_chatbot_response(input_messages)
        output = self.postprocess(chatbot_output)

        return output

    def postprocess(self, output):
        return {
            "role": "assistant",
            "content": output,
            "memory": {
                "agent": "details_agent",
            },
        }
    
        
