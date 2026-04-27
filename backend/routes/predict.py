"""
Predict Blueprint — POST /predict
"""
from flask import Blueprint, request, jsonify
from engine.calculator import estimate

predict_bp = Blueprint("predict", __name__)


@predict_bp.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    required = ["location", "area", "floors", "rooms", "quality"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    try:
        result = estimate(data)
        
        # Add AI refinement if API key exists
        from engine.ai_engine import refine_estimate_with_ai
        ai_refinement = refine_estimate_with_ai(result)
        if ai_refinement:
            result["ai_analysis"] = ai_refinement
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@predict_bp.route("/cities", methods=["GET"])
def cities():
    from data.locations import get_all_cities
    return jsonify({"cities": get_all_cities()}), 200
