import os
from datetime import datetime, timezone
from db import get_config_collection

def seed_config():
    col = get_config_collection()
    if col is None:
        print("Failed to connect to DB.")
        return

    # From locations.py
    cities = [
        {"name": "Ahmedabad", "cost_per_sqft": 1700, "labor_multiplier": 1.02, "material_multiplier": 1.00},
        {"name": "Bangalore", "cost_per_sqft": 2100, "labor_multiplier": 1.20, "material_multiplier": 1.15},
        {"name": "Bengaluru", "cost_per_sqft": 2100, "labor_multiplier": 1.20, "material_multiplier": 1.15},
        {"name": "Bhopal", "cost_per_sqft": 1500, "labor_multiplier": 0.90, "material_multiplier": 0.90},
        {"name": "Chandigarh", "cost_per_sqft": 1850, "labor_multiplier": 1.10, "material_multiplier": 1.08},
        {"name": "Chennai", "cost_per_sqft": 1950, "labor_multiplier": 1.15, "material_multiplier": 1.12},
        {"name": "Coimbatore", "cost_per_sqft": 1800, "labor_multiplier": 1.05, "material_multiplier": 1.05},
        {"name": "Delhi", "cost_per_sqft": 2200, "labor_multiplier": 1.25, "material_multiplier": 1.20},
        {"name": "Hyderabad", "cost_per_sqft": 1900, "labor_multiplier": 1.15, "material_multiplier": 1.10},
        {"name": "Indore", "cost_per_sqft": 1550, "labor_multiplier": 0.92, "material_multiplier": 0.92},
        {"name": "Jaipur", "cost_per_sqft": 1600, "labor_multiplier": 0.98, "material_multiplier": 0.95},
        {"name": "Kochi", "cost_per_sqft": 1900, "labor_multiplier": 1.12, "material_multiplier": 1.15},
        {"name": "Kolkata", "cost_per_sqft": 1750, "labor_multiplier": 1.05, "material_multiplier": 1.05},
        {"name": "Lucknow", "cost_per_sqft": 1550, "labor_multiplier": 0.95, "material_multiplier": 0.92},
        {"name": "Mumbai", "cost_per_sqft": 2500, "labor_multiplier": 1.40, "material_multiplier": 1.30},
        {"name": "Nagpur", "cost_per_sqft": 1600, "labor_multiplier": 0.95, "material_multiplier": 0.95},
        {"name": "Patna", "cost_per_sqft": 1450, "labor_multiplier": 0.88, "material_multiplier": 0.90},
        {"name": "Pune", "cost_per_sqft": 2000, "labor_multiplier": 1.18, "material_multiplier": 1.15},
        {"name": "Surat", "cost_per_sqft": 1650, "labor_multiplier": 1.00, "material_multiplier": 0.98},
        {"name": "Visakhapatnam", "cost_per_sqft": 1700, "labor_multiplier": 1.00, "material_multiplier": 1.00}
    ]

    # From SurveyPage.jsx
    qualities = [
        {"key": "basic", "label": "Basic", "icon": "🧱", "desc": "Cost-effective materials. Good for budget builds.", "multiplier": 0.8, "color": "#f59e0b"},
        {"key": "standard", "label": "Standard", "icon": "🏠", "desc": "Balanced quality. Most popular choice.", "multiplier": 1.0, "color": "#4f8ef7", "recommended": True},
        {"key": "premium", "label": "Premium", "icon": "🏰", "desc": "Top-tier finishes. Luxury construction.", "multiplier": 1.35, "color": "#7c3aed"}
    ]

    # From SurveyPage.jsx and .env
    amenities = [
        {"key": "parking", "label": "Parking", "icon": "🚗", "cost": 150000},
        {"key": "garden", "label": "Garden", "icon": "🌿", "cost": 200000},
        {"key": "security_room", "label": "Security Room", "icon": "🛡️", "cost": 100000},
        {"key": "solar_panels", "label": "Solar Panels", "icon": "☀️", "cost": 350000},
        {"key": "swimming_pool", "label": "Swimming Pool", "icon": "🏊", "cost": 800000},
        {"key": "modular_kitchen", "label": "Modular Kitchen", "icon": "🍳", "cost": 250000},
        {"key": "home_theater", "label": "Home Theater", "icon": "🎬", "cost": 400000}
    ]

    doc = {
        "_id": "app_config",
        "cities": cities,
        "qualities": qualities,
        "amenities": amenities,
        "updated_at": datetime.now(timezone.utc)
    }

    col.update_one({"_id": "app_config"}, {"$set": doc}, upsert=True)
    print("Successfully seeded dynamic configuration!")

if __name__ == "__main__":
    seed_config()
