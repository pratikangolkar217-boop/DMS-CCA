import jwt
import os
from functools import wraps
from flask import request, jsonify
from datetime import datetime, timedelta, timezone

JWT_SECRET = os.getenv("JWT_SECRET", "default_secret_key_change_me")

def generate_token(username):
    """Generates a JWT token valid for 24 hours."""
    payload = {
        "sub": username,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def admin_required(f):
    """Decorator to protect routes with JWT admin authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check Authorization header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"error": "Authentication token missing"}), 401
            
        try:
            # Decode and verify token
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            # In this simple implementation, we just verify it's a valid token.
            # You could check if the username matches ADMIN_USERNAME if needed.
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(*args, **kwargs)
        
    return decorated
