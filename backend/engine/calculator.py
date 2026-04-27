"""
Cost Calculation Engine
Formula: Total Cost = Area × Base Rate × Quality Multiplier × Location Factor + Extras

Cost Breakdown Percentages:
  Foundation:    20%
  Structure:     40%
  Interior:      25%
  Labor:         10%
  Miscellaneous:  5%
"""

import os
from data.locations import get_location_data

# Quality level multipliers
QUALITY_MULTIPLIERS = {
    "basic": 0.85,
    "standard": 1.00,
    "premium": 1.50,
}

# Amenity add-on costs in INR (read from environment or use defaults)
AMENITY_COSTS = {
    "parking": int(os.getenv("PRICE_PARKING", 150000)),
    "garden": int(os.getenv("PRICE_GARDEN", 200000)),
    "security_room": int(os.getenv("PRICE_SECURITY_ROOM", 100000)),
    "solar_panels": int(os.getenv("PRICE_SOLAR_PANELS", 350000)),
    "swimming_pool": int(os.getenv("PRICE_SWIMMING_POOL", 800000)),
    "modular_kitchen": int(os.getenv("PRICE_MODULAR_KITCHEN", 250000)),
    "home_theater": int(os.getenv("PRICE_HOME_THEATER", 400000)),
}

# Breakdown percentages
BREAKDOWN_RATIOS = {
    "foundation": 0.20,
    "structure": 0.40,
    "interior": 0.25,
    "labor": 0.10,
    "miscellaneous": 0.05,
}


def calculate_room_count(rooms: dict) -> dict:
    """Aggregate room counts across all floors."""
    totals = {
        "bedrooms": 0,
        "bathrooms": 0,
        "kitchens": 0,
        "halls": 0,
        "optional": 0,
    }
    for floor_key, floor_data in rooms.items():
        totals["bedrooms"] += floor_data.get("bedroom", 0)
        totals["bathrooms"] += floor_data.get("bathroom", 0)
        totals["kitchens"] += floor_data.get("kitchen", 0)
        totals["halls"] += floor_data.get("hall", 0)
        totals["optional"] += floor_data.get("optional", 0)
    return totals


def estimate(payload: dict) -> dict:
    """
    Main estimation function.

    Args:
        payload: dict with keys:
            location (str), area (float), floors (int),
            rooms (dict), quality (str), amenities (list[str])

    Returns:
        dict with total_cost (int), breakdown (dict), location_info (dict),
              room_summary (dict), recommendations (list[str])
    """
    location = payload.get("location", "")
    area = float(payload.get("area", 1000))
    floors = int(payload.get("floors", 1))
    rooms = payload.get("rooms", {})
    quality = payload.get("quality", "standard").lower()
    amenities = payload.get("amenities", [])

    # Clamp area
    area = max(200, min(area, 50000))
    floors = max(1, min(floors, 10))

    # Location data
    location_data, is_fallback = get_location_data(location)
    
    # AI-powered pricing for unlisted cities
    is_ai_estimated = False
    if is_fallback and location:
        from engine.ai_engine import get_city_pricing_ai
        ai_data = get_city_pricing_ai(location)
        if ai_data:
            location_data = {
                "display": location,
                "cost_per_sqft": ai_data.get("cost_per_sqft", location_data["cost_per_sqft"]),
                "labor_multiplier": ai_data.get("labor_multiplier", location_data["labor_multiplier"]),
                "material_multiplier": ai_data.get("material_multiplier", location_data["material_multiplier"]),
            }
            is_fallback = False
            is_ai_estimated = True

    base_rate = location_data["cost_per_sqft"]
    labor_mult = location_data["labor_multiplier"]
    material_mult = location_data["material_multiplier"]
    location_factor = (labor_mult + material_mult) / 2

    # Quality multiplier
    quality_mult = QUALITY_MULTIPLIERS.get(quality, 1.00)

    # Total area accounting for all floors
    total_area = area * floors

    # Base construction cost
    base_cost = total_area * base_rate * quality_mult * location_factor

    # Amenity extras
    extras = 0
    amenity_breakdown = {}
    for amenity in amenities:
        amenity_key = amenity.lower().replace(" ", "_")
        cost = AMENITY_COSTS.get(amenity_key, 0)
        if cost:
            amenity_breakdown[amenity] = cost
            extras += cost

    total_cost = base_cost + extras

    # Breakdown (applied proportionally to base cost only)
    breakdown = {
        key: round(base_cost * ratio)
        for key, ratio in BREAKDOWN_RATIOS.items()
    }

    # Add amenity extras into miscellaneous for display clarity
    breakdown["miscellaneous"] += extras

    # Room summary
    room_summary = calculate_room_count(rooms)

    # Recommendations
    recommendations = _generate_recommendations(
        quality, room_summary, amenities, location_factor, is_fallback
    )

    # Material quantities estimation (approximate)
    material_estimate = {
        "cement": round(total_area * 0.4),          # bags
        "steel": round(total_area * 3.5),           # kg
        "bricks": round(total_area * 9),            # numbers
        "sand": round(total_area * 1.8),            # cu.ft
        "aggregate": round(total_area * 1.3),       # cu.ft
    }

    return {
        "total_cost": round(total_cost),
        "breakdown": breakdown,
        "location_info": {
            "city": location_data["display"],
            "cost_per_sqft": base_rate,
            "is_fallback": is_fallback,
            "is_ai_estimated": is_ai_estimated,
        },
        "inputs": {
            "area": area,
            "floors": floors,
            "quality": quality,
            "amenities": amenities,
            "total_area": total_area,
        },
        "room_summary": room_summary,
        "recommendations": recommendations,
        "amenity_costs": amenity_breakdown,
        "material_estimate": material_estimate,
    }


def _generate_recommendations(quality, rooms, amenities, location_factor, is_fallback):
    tips = []

    if is_fallback:
        tips.append(
            "Your city wasn't found in our database. We used national average pricing — actual costs may vary."
        )

    if rooms["bathrooms"] > 0 and rooms["bedrooms"] > 0:
        ratio = rooms["bedrooms"] / rooms["bathrooms"]
        if ratio > 2.5:
            tips.append(
                f"You have {rooms['bedrooms']} bedrooms but only {rooms['bathrooms']} bathrooms. "
                "Consider adding one more bathroom for comfort (recommended: 1 per 2 bedrooms)."
            )

    if quality == "premium":
        tips.append(
            "Premium materials can increase your property resale value by up to 20-25%."
        )
    elif quality == "basic":
        tips.append(
            "Basic materials keep upfront costs low, but may require renovations in 8-10 years."
        )

    if "solar_panels" not in amenities and "solar panels" not in amenities:
        tips.append(
            "Adding solar panels (≈ ₹3.5 L) can reduce electricity bills by 60-80% over 10 years."
        )

    if rooms["optional"] == 0:
        tips.append(
            "Consider adding a home office or storage room — remote work has made these high-value additions."
        )

    if location_factor > 1.2:
        tips.append(
            "Construction costs in your city are above average. Sourcing materials locally can save 5-10%."
        )

    return tips
