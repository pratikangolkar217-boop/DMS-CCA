from flask import Blueprint, request, jsonify
from engine.ai_engine import get_ai_response

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    if not data or "messages" not in data:
        return jsonify({"error": "Missing messages"}), 400

    # Ensure the system prompt is present if it's a new conversation
    messages = data["messages"]
    
    # Optional: Add context about the app to the system message if not present
    has_system = any(m["role"] == "system" for m in messages)
    if not has_system:
        messages.insert(0, {
            "role": "system", 
            "content": "You are 'BuildSmart Assistant', an AI specialized in Indian home construction. You help users estimate costs, choose materials, and understand the construction process. Be helpful, concise, and professional."
        })

    response = get_ai_response(messages)
    return jsonify({"response": response})
