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
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

from routes.predict import predict_bp
from routes.chat import chat_bp
app.register_blueprint(predict_bp)
app.register_blueprint(chat_bp)


@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok", "service": "Home Cost Estimator API"}


if __name__ == "__main__":
    app.run(debug=True, port=5000)
