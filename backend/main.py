from flask import Flask
from flask_cors import CORS

# Register blueprints from handler modules
from fund_handlers import fund_routes
from market_handlers import market_routes
from portfolio_handlers import portfolio_routes


def create_app():
    app = Flask(__name__)
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    app.register_blueprint(fund_routes)
    app.register_blueprint(market_routes)
    app.register_blueprint(portfolio_routes)
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
