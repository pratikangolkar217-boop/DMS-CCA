import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client
# The user needs to provide GROQ_API_KEY in .env
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None

def get_ai_response(messages):
    """
    General chatbot response logic.
    """
    if not client:
        return "Chatbot is currently offline (API Key missing). Please add GROQ_API_KEY to your .env file."

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Error connecting to AI: {str(e)}"

def refine_estimate_with_ai(estimate_data):
    """
    Takes the rule-based estimate and asks Groq to provide a more detailed, 
    'current-market' perspective or refinement.
    """
    if not client:
        return None

    prompt = f"""
    You are a professional construction cost estimator in India. 
    A user has generated a rule-based estimate for a home build:
    - Location: {estimate_data['location_info']['city']}
    - Total Area: {estimate_data['inputs']['total_area']} sq.ft
    - Quality: {estimate_data['inputs']['quality']}
    - Current Rule-based Total: ₹{estimate_data['total_cost']:,}
    - Breakdown: {estimate_data['breakdown']}
    - Amenities: {estimate_data['inputs']['amenities']}

    Task:
    1. Provide a brief analysis of whether this estimate is realistic for current (2024-2025) market prices in that specific location.
    2. Mention if specific materials (Cement, Steel, Bricks) are currently seeing price spikes or drops.
    3. Suggest a 'Refined Estimate' percentage adjustment if necessary (e.g., 'Increase by 5% due to labor shortage').
    4. Provide 3 specific cost-saving tips for this project.

    Keep your response concise, professional, and formatted in clear sections.
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a senior construction consultant specializing in the Indian real estate market."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"AI Refinement Error: {e}")
        return "AI refinement service is currently unavailable."

def get_city_pricing_ai(city_name):
    """
    Asks Groq to estimate construction pricing factors for a specific city.
    Returns a dict with cost_per_sqft, labor_multiplier, material_multiplier.
    """
    if not client:
        return None

    prompt = f"""
    Provide estimated home construction cost factors for the city: '{city_name}', India.
    Return ONLY a valid JSON object with these keys:
    - cost_per_sqft (integer, base cost for standard construction)
    - labor_multiplier (float, relative to national average of 1.0)
    - material_multiplier (float, relative to national average of 1.0)

    Example format:
    {{"cost_per_sqft": 1600, "labor_multiplier": 1.05, "material_multiplier": 1.02}}
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant", # Faster model for data extraction
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"AI City Pricing Error: {e}")
        return None
