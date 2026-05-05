"""
Config Blueprint — /config
Handles getting and updating the dynamic survey configuration (cities, amenities, quality).
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from db import get_config_collection
from auth import admin_required

config_bp = Blueprint("config", __name__)

def _col():
    col = get_config_collection()
    if col is None:
        raise RuntimeError("Database unavailable")
    return col

@config_bp.route("/config", methods=["GET"])
def get_config():
    """Returns the current dynamic config. Falls back to empty arrays if none."""
    try:
        col = _col()
        # Find the single config document (we assume there's only one, identified by a fixed _id or just the first one)
        doc = col.find_one({"_id": "app_config"})
        
        if not doc:
            # Fallback default structure
            doc = {
                "cities": [],
                "qualities": [],
                "amenities": [],
                "breakdown": {
                    "foundation": 0.20,
                    "structure": 0.40,
                    "interior": 0.25,
                    "labor": 0.10,
                    "miscellaneous": 0.05,
                }
            }
            
        return jsonify({
            "cities": doc.get("cities", []),
            "qualities": doc.get("qualities", []),
            "amenities": doc.get("amenities", []),
            "breakdown": doc.get("breakdown", {
                "foundation": 0.20,
                "structure": 0.40,
                "interior": 0.25,
                "labor": 0.10,
                "miscellaneous": 0.05,
            })
        }), 200
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@config_bp.route("/admin/config", methods=["PUT"])
@admin_required
def update_config():
    """Updates the entire dynamic config document."""
    try:
        col = _col()
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Invalid body"}), 400
            
        allowed_keys = ["cities", "qualities", "amenities", "breakdown"]
        update_data = {k: v for k, v in data.items() if k in allowed_keys}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Upsert the single config document
        col.update_one(
            {"_id": "app_config"},
            {"$set": update_data},
            upsert=True
        )
        
        return jsonify({"success": True}), 200
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500
