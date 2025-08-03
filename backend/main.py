from flask import Flask, jsonify, request, Blueprint
from mftool import Mftool
from db import portfolio_collection
from flask_cors import CORS
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import json

fund_routes = Blueprint('fund_routes', __name__)
mf = Mftool()


@fund_routes.route('/funds', methods=['GET'])
def list_all_funds():
    return jsonify(mf.get_scheme_codes())


@fund_routes.route('/fund/<scheme_code>', methods=['GET'])
def get_fund_info(scheme_code):
    return jsonify(mf.get_scheme_details(scheme_code))


@fund_routes.route('/nav/<scheme_code>', methods=['GET'])
def get_nav(scheme_code):
    details = mf.get_scheme_details(scheme_code)
    return jsonify(details)


@fund_routes.route('/historical-nav/<scheme_code>', methods=['GET'])
def get_historical_nav(scheme_code):
    try:
        start_date = request.args.get('start_date')  # Format: DD-MM-YYYY
        end_date = request.args.get('end_date')      # Format: DD-MM-YYYY

        nav_data = mf.get_scheme_historical_nav_year(
            scheme_code, start_date, end_date)

        # Convert the data into a format suitable for the chart
        historical_data = []
        for date, nav in nav_data.items():
            historical_data.append({
                'date': date,
                'nav': float(nav['nav'])
            })

        # Sort by date
        historical_data.sort(
            key=lambda x: datetime.strptime(x['date'], '%d-%m-%Y'))

        return jsonify(historical_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@fund_routes.route('/market-status', methods=['GET'])
def get_market_status():
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        }

        market_data = {
            'sensex': {'value': 0, 'change': 0},
            'nifty': {'value': 0, 'change': 0},
            'marketStatus': 'Closed',
        }

        # First try NSE
        try:
            session = requests.Session()
            # First visit homepage to get cookies
            session.get("https://www.nseindia.com/", headers=headers)
            # Then fetch the market data
            nifty_response = session.get(
                "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050",
                headers=headers
            )
            if nifty_response.status_code == 200:
                nifty_data = nifty_response.json()
                market_data['nifty']['value'] = round(
                    float(nifty_data.get('last', 0)), 2)
                market_data['nifty']['change'] = round(
                    float(nifty_data.get('pChange', 0)), 2)
                market_data['marketStatus'] = 'Open' if nifty_data.get(
                    'marketStatus') == 'Open' else 'Closed'
        except Exception as e:
            print(f"Error fetching Nifty data: {str(e)}")

        # Then try BSE
        try:
            bse_response = requests.get(
                "https://api.bseindia.com/bseindia/api/Sensex/getSensexData", headers=headers)
            if bse_response.status_code == 200:
                sensex_data = bse_response.json()
                market_data['sensex']['value'] = round(
                    float(sensex_data.get('SENSEX', 0)), 2)
                # Calculate percentage change
                prev_close = float(sensex_data.get('PrevClose', 0))
                if prev_close > 0:
                    change = (
                        (market_data['sensex']['value'] - prev_close) / prev_close) * 100
                    market_data['sensex']['change'] = round(change, 2)
        except Exception as e:
            print(f"Error fetching Sensex data: {str(e)}")
            # Fallback to web scraping if API fails
            try:
                bse_response = requests.get(
                    "https://www.bseindia.com/sensex/code/16/", headers=headers)
                if bse_response.status_code == 200:
                    soup = BeautifulSoup(bse_response.text, 'html.parser')
                    sensex_value = soup.find('div', {'id': 'sensexvalue'})
                    sensex_change = soup.find('div', {'id': 'sensexptxt'})
                    if sensex_value:
                        market_data['sensex']['value'] = round(
                            float(sensex_value.text.strip().replace(',', '')), 2)
                    if sensex_change:
                        change_text = sensex_change.text.strip()
                        change_value = float(
                            change_text.split('(')[1].split('%')[0])
                        market_data['sensex']['change'] = round(
                            change_value, 2)
            except Exception as e:
                print(f"Error in BSE fallback: {str(e)}")

        return jsonify(market_data)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'sensex': {'value': 0, 'change': 0},
            'nifty': {'value': 0, 'change': 0},
            'marketStatus': 'Unknown'
        }), 500

        try:
            # Fetch market breadth data
            breadth_response = requests.get(
                "https://www.nseindia.com/api/market-data-pre-open?key=NIFTY", headers=headers)
            if breadth_response.status_code == 200:
                breadth_data = breadth_response.json()
                advances = sum(
                    1 for stock in breadth_data['data'] if stock['finalPrice'] > stock['previousPrice'])
                declines = sum(
                    1 for stock in breadth_data['data'] if stock['finalPrice'] < stock['previousPrice'])
                market_status['gainers_count'] = advances
                market_status['losers_count'] = declines
        except Exception as e:
            print(f"Error fetching market breadth data: {str(e)}")

        return jsonify(market_status)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@fund_routes.route('/portfolio-history', methods=['GET'])
def get_portfolio_history():
    try:
        portfolio = list(portfolio_collection.find({}, {'_id': 0}))
        start_date = request.args.get('start_date')  # Format: DD-MM-YYYY
        end_date = request.args.get('end_date')      # Format: DD-MM-YYYY

        # Calculate portfolio value for each date
        portfolio_history = {}
        total_investment = 0

        for fund in portfolio:
            scheme_code = fund['scheme_code']
            units = fund['units']
            total_investment += fund['amount_invested']

            # Get historical NAV data for this fund
            nav_data = mf.get_scheme_historical_nav_year(
                scheme_code, start_date, end_date)

            # Calculate portfolio value for each date
            for date, nav_info in nav_data.items():
                nav = float(nav_info['nav'])
                value = nav * units

                if date in portfolio_history:
                    portfolio_history[date]['value'] += value
                else:
                    portfolio_history[date] = {
                        'date': date,
                        'value': value,
                        'investment': total_investment
                    }

        # Convert to list and sort by date
        history_list = list(portfolio_history.values())
        history_list.sort(
            key=lambda x: datetime.strptime(x['date'], '%d-%m-%Y'))

        return jsonify(history_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
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
        scheme_code = None
        for code, name in schemes.items():
            if name == scheme_name:
                scheme_code = code
                break
        amount = float(data.get('amount'))
        date = data.get('buy_date')  # Format: YYYY-MM-DD
        formatted_date = datetime.strptime(
            date, "%Y-%m-%d").strftime("%d-%m-%Y")

        nav_data = mf.get_scheme_historical_nav(scheme_code, as_Dataframe=True)
        buy_price = float(nav_data.loc[formatted_date, "nav"])
        print("------------Buy Price-------------", buy_price)

        units = round(amount / buy_price, 4)

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
                fund["current_price"] = float(
                    details["scheme_start_date"]["nav"])
            except Exception as e:
                print(f"Error fetching NAV for {fund['scheme_name']}: {e}")
                fund["current_price"] = None
        return jsonify(funds)


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(fund_routes)
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
