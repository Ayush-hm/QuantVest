from flask import Flask, jsonify, request, Blueprint
from mftool import Mftool
from db import portfolio_collection
from flask_cors import CORS
from datetime import datetime

# Blueprint setup
fund_routes = Blueprint('fund_routes', __name__)
mf = Mftool()

# Services
@fund_routes.route('/funds', methods=['GET'])
def list_all_funds():
    return jsonify(mf.get_scheme_codes())

@fund_routes.route('/fund/<scheme_code>', methods=['GET'])
def get_fund_info(scheme_code):
    return jsonify(mf.get_scheme_details(scheme_code))

@fund_routes.route('/nav/<scheme_code>', methods=['GET'])
def get_nav(scheme_code):
    details = mf.get_scheme_details(scheme_code)
    return jsonify({
        "scheme_code": scheme_code,
        "scheme_name": details.get("scheme_name"),
        "nav": details.get("nav"),
        "last_updated": details.get("last_updated")
    })

@fund_routes.route('/portfolio', methods=['POST', 'GET']) 
def portfolio():
    if request.method == 'POST':
        data = request.get_json()
        scheme_name = data.get('scheme_name')
        schemes = mf.get_available_schemes(scheme_name)
        scheme_code=None
        for code, name in schemes.items():
            if name == scheme_name:
                scheme_code = code
                break
        amount = float(data.get('amount'))
        date = data.get('buy_date')  # Format: YYYY-MM-DD
        formatted_date = datetime.strptime(date, "%Y-%m-%d").strftime("%d-%m-%Y")
        
        # 1. Get NAV on buy_date
        nav_data = mf.get_scheme_historical_nav(scheme_code,as_Dataframe=True)
        buy_price=float(nav_data.loc[formatted_date, "nav"])
        print("------------Buy Price-------------", buy_price)

        # 2. Calculate units
        units = round(amount / buy_price, 4)

        # 3. Store in MongoDB
        portfolio_collection.insert_one({
            "scheme_code": scheme_code,
            "scheme_name": scheme_name,
            "amount_invested": amount,
            "buy_date": formatted_date,
            "buy_price": buy_price,
            "units": units
        })

        return jsonify({"message": "Fund added to portfolio"}), 201

    else:
        funds = list(portfolio_collection.find({}, {"_id": 0}))
        for fund in funds:
            try:
                details = mf.get_scheme_details(fund["scheme_code"])
                fund["current_price"] = float(details["scheme_start_date"]["nav"])
            except Exception as e:
                print(f"Error fetching NAV for {fund['scheme_name']}: {e}")
                fund["current_price"] = None
        return jsonify(funds)

# App factory
def create_app():
    app = Flask(__name__)
    CORS(app) 
    app.register_blueprint(fund_routes)
    return app

# Entry point
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
