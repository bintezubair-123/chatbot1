# from agent_controller import AgentController

# def main():
#     agent_controller = AgentController()
    
#     # Example usage
#     while True:
#         user_input = input("You: ")
#         if user_input.lower() in ["exit", "quit"]:
#             break
#         response = agent_controller.get_response(user_input)
#         print("Agent:", response)

# if __name__ == "__main__":
#     main()

# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from agent_controller import AgentController

# app = Flask(__name__)
# agent_controller = AgentController()

# @app.route("/api/chat", methods=["POST"])
# def chat():
#     data = request.json
#     messages = data.get("messages", [])

#     # get last user message
#     user_input = messages[-1]["content"] if messages else ""

#     response = agent_controller.get_response(user_input)

#     return jsonify({
#         "response": response
#     })
# @app.route("/api/health", methods=["GET"])
# def health():
#     return jsonify({"status": "ok"})

# if __name__ == "__main__":
#     app.run(debug=True, host="0.0.0.0", port=5000)

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from agent_controller import AgentController

app = Flask(__name__)

# ✅ Production CORS (restrict later to your domain)
CORS(app, resources={r"/api/*": {"origins": "*"}})

agent_controller = AgentController()


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "chatbot-backend"
    })


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True)

        messages = data.get("messages", [])
        if not messages:
            return jsonify({"error": "No messages provided"}), 400

        user_input = messages[-1].get("content", "")

        if not user_input:
            return jsonify({"error": "Empty message"}), 400

        response = agent_controller.get_response(user_input)

        return jsonify({
            "role": "assistant",
            "content": response
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# ✅ Production-safe run config
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False  # ❌ must be False in production
    )