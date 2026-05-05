"""
Predict Blueprint — POST /predict
"""
from flask import Blueprint, request, jsonify
from engine.calculator import estimate
from datetime import datetime, timezone

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

        # ── Persist to MongoDB ────────────────────────────────────────────
        try:
            from db import get_estimates_collection
            col = get_estimates_collection()
            if col is not None:
                doc = {
                    **result,
                    "raw_input": data,
                    "created_at": datetime.now(timezone.utc),
                    "deleted": False,
                    "admin_notes": "",
                }
                inserted = col.insert_one(doc)
                result["_db_id"] = str(inserted.inserted_id)
        except Exception as db_err:
            print(f"[DB] Failed to save estimate: {db_err}")
        # ─────────────────────────────────────────────────────────────────

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@predict_bp.route("/cities", methods=["GET"])
def cities():
    from data.locations import get_all_cities
    return jsonify({"cities": get_all_cities()}), 200

@predict_bp.route("/vastu-layout", methods=["POST"])
def vastu_layout():
    data = request.get_json(silent=True)
    if not data or "rooms" not in data:
        return jsonify({"error": "Missing rooms data"}), 400

    amenities = data.get("amenities", [])

    from engine.ai_engine import generate_vastu_layout_ai
    # Ask AI to generate mapping
    mapping = generate_vastu_layout_ai(data["rooms"], amenities)

    if mapping and "mapping" in mapping:
        return jsonify(mapping), 200
    else:
        # Fallback to empty if AI fails (frontend will handle fallback)
        return jsonify({"mapping": None}), 200
