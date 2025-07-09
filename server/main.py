from flask import Flask, render_template, request, jsonify
from config.settings import settings_bp
from server.auth.auth_routes import auth_bp

app = Flask("keepsake")
app.secret_key = "1234qwer"
app.register_blueprint(settings_bp)
app.register_blueprint(auth_bp)

@app.route('/')
def landing_page():
    return jsonify({"message":"Success", "status":"success"}), 200

if __name__ == "__main__":
    app.run(debug = True)