"""
MongoDB connection singleton.
Connects lazily on first use so the app can still run without MongoDB.
"""
import os
from dotenv import load_dotenv

load_dotenv(override=True)

_client = None
_db = None


def get_db():
    """Return the MongoDB database instance, connecting if necessary."""
    global _client, _db
    if _db is not None:
        return _db

    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("MONGO_DB_NAME", "buildsmart")

    if not mongo_uri:
        print("[DB] MONGO_URI not set — database features disabled.")
        return None
        
    mongo_uri = mongo_uri.strip()

    try:
        from pymongo import MongoClient
        _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Ping to verify connection
        _client.admin.command("ping")
        _db = _client[db_name]
        print(f"[DB] Connected to MongoDB Atlas - database: '{db_name}'")
        return _db
    except Exception as e:
        if _client is not None:
            _client.close()
            _client = None
        err_msg = str(e)
        print(f"[DB] MongoDB connection failed: {err_msg}")
        raise RuntimeError(f"Database unavailable: {err_msg}")


def get_estimates_collection():
    """Return the 'estimates' collection or None if DB is unavailable."""
    db = get_db()
    if db is None:
        return None
    return db["estimates"]

def get_config_collection():
    """Return the 'config' collection or None if DB is unavailable."""
    db = get_db()
    if db is None:
        return None
    return db["config"]
