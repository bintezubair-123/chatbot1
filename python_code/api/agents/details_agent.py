import json
from pathlib import Path
from .utils import get_chatbot_response
from copy import deepcopy


class DetailsAgent():
    def __init__(self):
        base_dir = Path(__file__).resolve().parents[2]
        about_us_path = base_dir / "products" / "Merry's_way_about_us.txt"
        menu_items_path = base_dir / "products" / "menu_items_text.txt"
        products_path = base_dir / "products" / "products.jsonl"

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

    def get_response(self,messages):
        messages = deepcopy(messages)
        user_message = messages[-1]["content"]
        prompt = f"""
        Using the knowledge base below, answer the user's coffee-shop question accurately and concisely.
        If the answer is not present in the knowledge base, say that you do not have that information.

        Knowledge Base:
        {self.knowledge_base}

        User Query:
        {user_message}
        """

        system_prompt = """
        You are a customer support agent for a coffee shop called Merry's way. 
        You should answer as a helpful waiter and only use the provided coffee-shop information.
        """
        messages[-1]["content"] = prompt
        input_messages = [{"role": "system", "content": system_prompt}] + messages[-3:]
        chatbot_output = get_chatbot_response(input_messages)
        output = self.postprocess(chatbot_output)

        return output
    def postprocess(self,output):
        output={
            "role":"assistant",
            "content":output,
            "memory":{
                "agent":"details_agent"
            }
        }
        return output
    
        
