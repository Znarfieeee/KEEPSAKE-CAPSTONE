from flask import Flask, jsonify
from config.settings import settings_bp
from routes.auth_routes import auth_bp
from routes.facility_routes import facility_bp
from flask_cors import CORS

app = Flask("keepsake")
app.secret_key = "1234qwer"
app.register_blueprint(settings_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(facility_bp)

# Allow local Vite dev server
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS(
    app,
    resources={r"/*": {"origins": allowed_origins}},
    supports_credentials=True,
)


@app.route("/")
def landing_page():
    return jsonify({"message": "Success", "status": "success"}), 200

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)