from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone, timedelta
from auth import generate_token, admin_required
import os

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def _col():
    """Helper — returns estimates collection or raises."""
    from db import get_estimates_collection
    col = get_estimates_collection()
    if col is None:
        raise RuntimeError("Database unavailable")
    return col


def _serialize(doc):
    """Convert a MongoDB document to a JSON-safe dict."""
    doc["id"] = str(doc.pop("_id"))
    if "created_at" in doc and isinstance(doc["created_at"], datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    # Remove heavy fields not needed in list view
    doc.pop("ai_analysis", None)
    return doc



# ── Authentication ─────────────────────────────────────────────────────────

@admin_bp.route("/login", methods=["POST"])
def login():
    """Authenticates the admin and returns a JWT token."""
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    
    # Check against environment variables
    env_user = os.getenv("ADMIN_USERNAME", "admin")
    env_pass = os.getenv("ADMIN_PASSWORD", "buildsmart123")
    
    if username == env_user and password == env_pass:
        token = generate_token(username)
        return jsonify({"token": token}), 200
        
    return jsonify({"error": "Invalid username or password"}), 401


# ── Dashboard Stats ────────────────────────────────────────────────────────

@admin_bp.route("/stats", methods=["GET"])
@admin_required
def stats():
    """
    Returns KPI data for the dashboard:
    - total_estimates, avg_cost, max_cost, min_cost
    - quality_breakdown  {standard: N, premium: N, luxury: N}
    - top_cities         [{city, count}]
    - daily_trend        [{date, count}] for last 30 days
    - recent_estimates   last 5 entries
    """
    try:
        col = _col()
        base_filter = {"deleted": {"$ne": True}}

        total = col.count_documents(base_filter)

        # Aggregate cost stats
        cost_agg = list(col.aggregate([
            {"$match": base_filter},
            {"$group": {
                "_id": None,
                "avg": {"$avg": "$total_cost"},
                "max": {"$max": "$total_cost"},
                "min": {"$min": "$total_cost"},
            }}
        ]))
        cost_stats = cost_agg[0] if cost_agg else {"avg": 0, "max": 0, "min": 0}
        cost_stats.pop("_id", None)

        # Quality breakdown
        quality_agg = list(col.aggregate([
            {"$match": base_filter},
            {"$group": {"_id": "$inputs.quality", "count": {"$sum": 1}}}
        ]))
        quality_breakdown = {item["_id"]: item["count"] for item in quality_agg if item["_id"]}

        # Top 5 cities
        city_agg = list(col.aggregate([
            {"$match": base_filter},
            {"$group": {"_id": "$location_info.city", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]))
        top_cities = [{"city": c["_id"], "count": c["count"]} for c in city_agg if c["_id"]]

        # Daily trend — last 30 days
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        trend_agg = list(col.aggregate([
            {"$match": {**base_filter, "created_at": {"$gte": thirty_days_ago}}},
            {"$group": {
                "_id": {
                    "y": {"$year": "$created_at"},
                    "m": {"$month": "$created_at"},
                    "d": {"$dayOfMonth": "$created_at"},
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.y": 1, "_id.m": 1, "_id.d": 1}}
        ]))
        daily_trend = [
            {
                "date": f"{t['_id']['y']}-{t['_id']['m']:02d}-{t['_id']['d']:02d}",
                "count": t["count"]
            }
            for t in trend_agg
        ]

        # Recent 5 estimates
        recent_docs = list(col.find(base_filter).sort("created_at", -1).limit(5))
        recent = [_serialize(d) for d in recent_docs]

        return jsonify({
            "total_estimates": total,
            "cost_stats": {
                "avg": round(cost_stats.get("avg") or 0),
                "max": round(cost_stats.get("max") or 0),
                "min": round(cost_stats.get("min") or 0),
            },
            "quality_breakdown": quality_breakdown,
            "top_cities": top_cities,
            "daily_trend": daily_trend,
            "recent_estimates": recent,
        }), 200

    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Estimate List ──────────────────────────────────────────────────────────

@admin_bp.route("/estimates", methods=["GET"])
@admin_required
def list_estimates():
    """
    GET /admin/estimates?page=1&limit=20&search=Mumbai&quality=premium
    Returns paginated list of estimates.
    """
    try:
        col = _col()
        page  = max(1, int(request.args.get("page", 1)))
        limit = min(100, int(request.args.get("limit", 20)))
        search = request.args.get("search", "").strip()
        quality = request.args.get("quality", "").strip().lower()

        query = {"deleted": {"$ne": True}}
        if search:
            query["location_info.city"] = {"$regex": search, "$options": "i"}
        if quality:
            query["inputs.quality"] = quality

        total = col.count_documents(query)
        skip = (page - 1) * limit
        docs = list(col.find(query).sort("created_at", -1).skip(skip).limit(limit))
        items = [_serialize(d) for d in docs]

        return jsonify({
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": max(1, -(-total // limit)),  # ceiling division
        }), 200

    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Single Estimate ────────────────────────────────────────────────────────

@admin_bp.route("/estimates/<string:estimate_id>", methods=["GET"])
@admin_required
def get_estimate(estimate_id):
    try:
        col = _col()
        doc = col.find_one({"_id": ObjectId(estimate_id)})
        if not doc:
            return jsonify({"error": "Not found"}), 404
        return jsonify(_serialize(doc)), 200
    except InvalidId:
        return jsonify({"error": "Invalid ID format"}), 400
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Update Estimate ────────────────────────────────────────────────────────

@admin_bp.route("/estimates/<string:estimate_id>", methods=["PUT"])
@admin_required
def update_estimate(estimate_id):
    """
    Accepts a JSON body with any editable fields:
      total_cost, admin_notes, inputs.quality, inputs.total_area, location_info.city
    """
    try:
        col = _col()
        body = request.get_json(silent=True) or {}

        allowed = {
            "total_cost", "admin_notes",
            "inputs.quality", "inputs.total_area",
            "inputs.floors", "location_info.city"
        }
        updates = {k: v for k, v in body.items() if k in allowed}
        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        updates["updated_at"] = datetime.now(timezone.utc)

        result = col.update_one(
            {"_id": ObjectId(estimate_id)},
            {"$set": updates}
        )
        if result.matched_count == 0:
            return jsonify({"error": "Not found"}), 404

        return jsonify({"success": True, "modified": result.modified_count}), 200

    except InvalidId:
        return jsonify({"error": "Invalid ID format"}), 400
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Soft-Delete Estimate ───────────────────────────────────────────────────

@admin_bp.route("/estimates/<string:estimate_id>", methods=["DELETE"])
@admin_required
def delete_estimate(estimate_id):
    try:
        col = _col()
        result = col.update_one(
            {"_id": ObjectId(estimate_id)},
            {"$set": {"deleted": True, "deleted_at": datetime.now(timezone.utc)}}
        )
        if result.matched_count == 0:
            return jsonify({"error": "Not found"}), 404
        return jsonify({"success": True}), 200

    except InvalidId:
        return jsonify({"error": "Invalid ID format"}), 400
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500
