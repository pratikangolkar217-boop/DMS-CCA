"""
Flask Application Entry Point
"""
from flask import Flask
from flask_cors import CORS
import sys
import os

# Allow imports from parent directory
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(override=True)

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    "allow_headers": ["Content-Type", "Authorization"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}})

from routes.predict import predict_bp
from routes.chat import chat_bp
from routes.admin import admin_bp
from routes.config import config_bp
app.register_blueprint(predict_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(config_bp)


@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok", "service": "Home Cost Estimator API"}


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
