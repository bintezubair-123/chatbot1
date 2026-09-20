import json
import pandas as pd
import os
from pathlib import Path
from .utils import get_chatbot_response, load_json
from copy import deepcopy


class RecommendationAgent():
    def __init__(self,apriori_recommendation_path,popular_recommendation_path):
        base_dir = Path(__file__).resolve().parent.parent
        apriori_path = base_dir / apriori_recommendation_path
        popular_path = base_dir / popular_recommendation_path

        if apriori_path.exists():
            with open(apriori_path, "r", encoding="utf-8") as file:
                self.apriori_recommendations = json.load(file)
        else:
            self.apriori_recommendations = {}

        self.popular_recommendations = pd.read_csv(popular_path)
        self.products = self.popular_recommendations['product'].tolist()
        self.product_categories = self.popular_recommendations['product_category'].tolist()
    
    def get_apriori_recommendation(self, products, top_k=5):
        if isinstance(products, str):
            products = [products]
        if not isinstance(products, list):
            products = []

        recommendation_list = []
        for product in products:
            if product in self.apriori_recommendations:
                recommendation_list += self.apriori_recommendations[product]

        # Sort recommendation list by "confidence"
        recommendation_list = sorted(
            recommendation_list, key=lambda x: x["confidence"], reverse=True
        )

        recommendations = []
        recommendations_per_category = {}
        for recommendation in recommendation_list:
            # Skip duplicates
            if recommendation["product"] in recommendations:
                continue

            # Limit 2 recommendations per category
            product_category = recommendation["product_category"]
            if product_category not in recommendations_per_category:
                recommendations_per_category[product_category] = 0

            if recommendations_per_category[product_category] >= 2:
                continue

            recommendations_per_category[product_category] += 1
            recommendations.append(recommendation["product"])

            if len(recommendations) >= top_k:
                break

        return recommendations

    def get_popular_recommendation(self, product_categories=None, top_k=5):
        recommendations_df = self.popular_recommendations

        if isinstance(product_categories, str):
            product_categories = [product_categories]

        if product_categories:
            recommendations_df = self.popular_recommendations[
                self.popular_recommendations["product_category"].isin(product_categories)
            ]
        recommendations_df = recommendations_df.sort_values(
            by="number_of_transactions", ascending=False
        )

        if recommendations_df.shape[0] == 0:
            return []

        recommendations = recommendations_df["product"].tolist()[:top_k]
        return recommendations

    def recommendation_classification(self, messages):
        system_prompt = (
            """You are a helpful AI assistant for a coffee shop application which serves drinks and pastries. We have 3 types of recommendations:

        1. Apriori Recommendations: Based on item co-occurrence in order history.
        2. Popular Recommendations: Based on overall popularity.
        3. Popular Recommendations by Category: Popular items within a specific category.

        List of items: """
            + ", ".join(self.products)
            + """
        List of categories: """
            + ", ".join(set(self.product_categories))
            + """

        Your task is to determine which type of recommendation to provide based on the user message.

        Your output must be a valid JSON object matching this format exactly:
        {
          "chain of thought": "Write your reasoning here.",
          "recommendation_type": "popular",
          "parameters": []
        }
        Set "recommendation_type" to exactly one of: "apriori", "popular", or "popular by category".
        Set "parameters" to a JSON list of item names or category names matching the lists above.
        """
        )

        input_messages = [{"role": "system", "content": system_prompt}] + messages[-3:]

        chatbot_output = get_chatbot_response(input_messages)
        output = self.postprocess_classification(chatbot_output)
        return output

    def get_response(self, messages):
        messages = deepcopy(messages)

        recommendation_classification = self.recommendation_classification(messages)
        recommendation_type = recommendation_classification["recommendation_type"]
        params = recommendation_classification["parameters"]

        recommendations = []
        if recommendation_type == "apriori":
            recommendations = self.get_apriori_recommendation(params)
        elif recommendation_type == "popular":
            recommendations = self.get_popular_recommendation()
        elif recommendation_type == "popular by category":
            recommendations = self.get_popular_recommendation(params)

        if not recommendations:
            recommendations = self.get_popular_recommendation(top_k=3)

        if not recommendations:
            return {
                "role": "assistant",
                "content": "Sorry, I can't help with that. Can I help you with your order?",
            }

        recommendations_str = ", ".join(recommendations)

        system_prompt = f"""
        You are a helpful AI assistant for a coffee shop application which serves drinks and pastries.
        Your task is to recommend ONLY the items specified below: {recommendations_str}
        Respond in a friendly, concise manner using an unordered list with brief item descriptions.
        STRICT RULE: Do NOT invent, name, or describe any outside items, bakery products, or flavors not in this list: {recommendations_str}.
        """

        prompt = f"""
        User Message: {messages[-1]['content']}

        Recommend ONLY these items: {recommendations_str}
        """

        messages[-1]["content"] = prompt
        input_messages = [{"role": "system", "content": system_prompt}] + messages[-3:]

        chatbot_output = get_chatbot_response(input_messages)
        output = self.postprocess(chatbot_output)

        return output

    def postprocess_classification(self, output):
        parsed = load_json(output)
        rec_type = str(parsed.get("recommendation_type", "popular")).strip().lower()
        params = parsed.get("parameters", [])

        if isinstance(params, str):
            params = [params]

        valid_types = ["apriori", "popular", "popular by category"]
        if rec_type not in valid_types:
            rec_type = "popular"

        dict_output = {
            "recommendation_type": rec_type,
            "parameters": params,
        }
        return dict_output

    def get_recommendations_from_order(self, messages, order):
        products = []
        for product in order:
            if isinstance(product, dict) and "item" in product:
                products.append(product["item"])

        recommendations = self.get_apriori_recommendation(products, top_k=2)
        if not recommendations:
            recommendations = self.get_popular_recommendation(top_k=2)

        if not recommendations:
            return self.postprocess("")

        recommendations_str = ", ".join(recommendations)

        system_prompt = f"""
        You are a helpful AI assistant for a coffee shop application.
        Recommend ONLY the exact items provided to pair with their order in a short, friendly 1-2 sentence suggestion: {recommendations_str}
        STRICT RULE: Do NOT invent, name, or suggest any outside items, bakery products, or flavors (such as muffins, cakes, or unlisted scones) that are not in this list: {recommendations_str}.
        """

        prompt = f"Please suggest these exact complementary items to pair with the order: {recommendations_str}"

        messages_copy = deepcopy(messages)
        messages_copy[-1]["content"] = prompt
        input_messages = [{"role": "system", "content": system_prompt}] + messages_copy[-3:]

        chatbot_output = get_chatbot_response(input_messages)
        output = self.postprocess(chatbot_output)

        return output

    def postprocess(self, output):
        return {
            "role": "assistant",
            "content": output,
            "memory": {"agent": "recommendation_agent"},
        }
