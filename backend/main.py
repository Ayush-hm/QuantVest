from flask import Flask, jsonify, request, Blueprint
from mftool import Mftool
from db import portfolio_collection
from flask_cors import CORS
from datetime import datetime, timedelta
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
            'sensex': {'price': 0, 'change_percent': 0},
            'nifty': {'price': 0, 'change_percent': 0},
            'market_status': 'Closed',
            'last_updated': datetime.now().strftime('%H:%M:%S'),
            'gainers_count': 0,
            'losers_count': 0
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
                market_data['nifty']['price'] = round(
                    float(nifty_data.get('last', 0)), 2)
                market_data['nifty']['change_percent'] = round(
                    float(nifty_data.get('pChange', 0)), 2)
                market_data['market_status'] = 'Open' if nifty_data.get(
                    'marketStatus', '').lower() == 'open' else 'Closed'
        except Exception as e:
            print(f"Error fetching Nifty data: {str(e)}")

        # Try BSE data using modern API
        try:
            session = requests.Session()
            # First visit the homepage to get cookies and tokens
            bse_home = session.get(
                "https://www.bseindia.com/", headers=headers)
            # Then try the modern API endpoint
            bse_response = session.get(
                "https://www.bseindia.com/markets/MarketInfo/BhavCopy.aspx",
                headers={
                    **headers,
                    'Referer': 'https://www.bseindia.com/',
                    'sec-fetch-site': 'same-origin',
                    'sec-fetch-mode': 'cors'
                }
            )
            if bse_response.status_code == 200:
                soup = BeautifulSoup(bse_response.text, 'html.parser')
                # Find Sensex value and change
                sensex_div = soup.find('div', {'class': 'sensexbluetext'})
                if sensex_div:
                    # Extract current value
                    value_text = sensex_div.find('strong').text.strip()
                    market_data['sensex']['price'] = round(
                        float(value_text.replace(',', '')), 2)

                    # Extract change percentage
                    change_div = sensex_div.find('div', {'class': 'sensexgrntxt'}) or \
                        sensex_div.find('div', {'class': 'sensexredtxt'})
                    if change_div:
                        change_text = change_div.text.strip()
                        try:
                            # Extract percentage from text like "(+1.23%)"
                            change_value = float(change_text.split(
                                '(')[1].replace('%)', ''))
                            market_data['sensex']['change_percent'] = round(
                                change_value, 2)
                        except (IndexError, ValueError) as e:
                            print(f"Error parsing change value: {str(e)}")

        except Exception as e:
            print(f"Error fetching Sensex data: {str(e)}")
            # Fallback to alternative BSE endpoint
            try:
                alt_response = session.get(
                    "https://www.bseindia.com/stock-share-price/stock-quotes/",
                    headers=headers
                )
                if alt_response.status_code == 200:
                    soup = BeautifulSoup(alt_response.text, 'html.parser')
                    sensex_value = soup.find('span', {'id': 'SENSEX'})
                    sensex_change = soup.find('span', {'id': 'SENSEXchange'})

                    if sensex_value:
                        market_data['sensex']['price'] = round(
                            float(sensex_value.text.strip().replace(',', '')), 2)
                    if sensex_change:
                        change_text = sensex_change.text.strip()
                        try:
                            change_value = float(change_text.replace('%', ''))
                            market_data['sensex']['change_percent'] = round(
                                change_value, 2)
                        except ValueError as e:
                            print(
                                f"Error parsing alternative change value: {str(e)}")
            except Exception as e:
                print(f"Error in BSE fallback: {str(e)}")

        return jsonify(market_data)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'sensex': {'price': 0, 'change_percent': 0},
            'nifty': {'price': 0, 'change_percent': 0},
            'market_status': 'Unknown',
            'last_updated': datetime.now().strftime('%H:%M:%S'),
            'gainers_count': 0,
            'losers_count': 0
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
        if not portfolio:
            return jsonify([]), 200

        # If dates not provided, get last 1 year of data
        end_date = request.args.get(
            'end_date') or datetime.now().strftime('%d-%m-%Y')
        start_date = request.args.get('start_date') or (
            datetime.strptime(end_date, '%d-%m-%Y') -
            datetime.timedelta(days=365)
        ).strftime('%d-%m-%Y')

        # Calculate portfolio value for each date
        portfolio_history = {}
        total_investment = sum(fund['amount_invested'] for fund in portfolio)

        for fund in portfolio:
            try:
                scheme_code = fund['scheme_code']
                units = fund['units']

                # Get historical NAV data for this fund
                nav_data = mf.get_scheme_historical_nav_year(
                    scheme_code, start_date, end_date)
                if not nav_data:
                    continue

                # Calculate portfolio value for each date
                for date, nav_info in nav_data.items():
                    try:
                        nav = float(nav_info['nav'])
                        value = nav * units

                        if date in portfolio_history:
                            portfolio_history[date]['value'] += value
                        else:
                            portfolio_history[date] = {
                                'date': date,
                                'value': value,
                                'investment': total_investment,
                                'returns': 0  # Will calculate after aggregating all values
                            }
                    except (ValueError, KeyError) as e:
                        print(
                            f"Error processing NAV for date {date}: {str(e)}")
                        continue

            except Exception as e:
                print(f"Error processing fund {scheme_code}: {str(e)}")
                continue

        # Calculate returns and convert to list
        history_list = []
        for date_data in portfolio_history.values():
            if total_investment > 0:
                date_data['returns'] = ((date_data['value'] - date_data['investment']) /
                                        date_data['investment']) * 100
            history_list.append(date_data)

        # Sort by date
        history_list.sort(
            key=lambda x: datetime.strptime(x['date'], '%d-%m-%Y'))

        return jsonify(history_list)
    except Exception as e:
        print(f"Error in portfolio history: {str(e)}")
        return jsonify({'error': str(e)}), 400


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
        total_value = 0
        total_investment = 0

        for fund in funds:
            try:
                details = mf.get_scheme_details(fund["scheme_code"])
                current_nav = float(details.get("nav", 0))
                fund["current_price"] = current_nav

                # Calculate current value and returns
                current_value = current_nav * fund["units"]
                investment = fund["amount_invested"]

                fund["current_value"] = round(current_value, 2)
                fund["returns"] = round(
                    ((current_value - investment) / investment) * 100, 2) if investment > 0 else 0

                total_value += current_value
                total_investment += investment

            except Exception as e:
                print(f"Error fetching NAV for {fund['scheme_name']}: {e}")
                fund["current_price"] = None
                fund["current_value"] = None
                fund["returns"] = None

        # Add portfolio summary
        portfolio_data = {
            "funds": funds,
            "summary": {
                "total_investment": round(total_investment, 2),
                "total_value": round(total_value, 2),
                "total_returns": round(((total_value - total_investment) / total_investment) * 100, 2) if total_investment > 0 else 0
            }
        }

        return jsonify(portfolio_data)


@fund_routes.route('/portfolio/<scheme_code>', methods=['GET', 'PUT', 'PATCH'])
def manage_fund(scheme_code):
    if request.method == 'PATCH':
        try:
            data = request.get_json()
            new_amount = float(data.get('amount'))

            # Get current fund details
            fund = portfolio_collection.find_one({"scheme_code": scheme_code})
            if not fund:
                return jsonify({"error": "Fund not found"}), 404

            # Calculate new units based on original buy price
            new_units = round(new_amount / fund['buy_price'], 4)

            # Update the database
            portfolio_collection.update_one(
                {"scheme_code": scheme_code},
                {
                    "$set": {
                        "amount_invested": new_amount,
                        "units": new_units
                    }
                }
            )

            return jsonify({
                "message": "Investment amount updated successfully",
                "new_amount": new_amount,
                "new_units": new_units
            }), 200

        except Exception as e:
            print(f"Error updating investment amount: {str(e)}")
            return jsonify({"error": str(e)}), 400

    if request.method == 'GET':
        try:
            # Get fund details
            fund = portfolio_collection.find_one(
                {"scheme_code": scheme_code}, {"_id": 0})
            if not fund:
                return jsonify({"error": "Fund not found"}), 404

            # Get fund's NAV history
            details = mf.get_scheme_details(scheme_code)
            end_date = datetime.now()
            start_date = datetime.strptime(fund['buy_date'], '%d-%m-%Y')

            # Get NAV history
            nav_history = mf.get_scheme_historical_nav_year(
                scheme_code,
                start_date.strftime('%d-%m-%Y'),
                end_date.strftime('%d-%m-%Y')
            )

            # Calculate monthly performance
            monthly_data = {}
            total_investment = fund['amount_invested']
            current_units = fund['units']

            for date, nav_info in nav_history.items():
                date_obj = datetime.strptime(date, '%d-%m-%Y')
                month_key = date_obj.strftime('%Y-%m')

                if month_key not in monthly_data:
                    monthly_data[month_key] = {
                        'month': date_obj.strftime('%b %Y'),
                        'nav': float(nav_info['nav']),
                        'value': float(nav_info['nav']) * current_units,
                        'units': current_units,
                        'investment': total_investment
                    }

            # Convert to list and sort
            monthly_performance = list(monthly_data.values())
            monthly_performance.sort(
                key=lambda x: datetime.strptime(x['month'], '%b %Y'))

            response_data = {
                **fund,
                'scheme_details': details,
                'monthly_performance': monthly_performance,
                'current_nav': details.get('nav', 0),
                'current_value': round(float(details.get('nav', 0)) * fund['units'], 2)
            }

            return jsonify(response_data)

        except Exception as e:
            print(f"Error fetching fund details: {str(e)}")
            return jsonify({"error": str(e)}), 400

    elif request.method == 'PUT':
        try:
            data = request.get_json()
            sip_amount = float(data.get('sip_amount', 0))
            sip_day = int(data.get('sip_day', 1))  # Day of month for SIP

            fund = portfolio_collection.find_one({"scheme_code": scheme_code})
            if not fund:
                return jsonify({"error": "Fund not found"}), 404

            # Calculate SIP investments
            today = datetime.now()
            start_date = datetime.strptime(
                data.get('sip_start_date'), '%Y-%m-%d')

            # Get NAV data for the period
            nav_data = mf.get_scheme_historical_nav_year(
                scheme_code,
                start_date.strftime('%d-%m-%Y'),
                today.strftime('%d-%m-%Y')
            )

            # Calculate units for each SIP installment
            total_units = fund['units']  # Existing units
            total_investment = fund['amount_invested']  # Existing investment
            sip_investments = []

            current_date = start_date
            while current_date <= today:
                # Find closest available NAV date
                target_date = current_date.strftime('%d-%m-%Y')
                closest_nav = None
                closest_date = None

                # Look for NAV within 5 days of SIP date
                for i in range(5):
                    check_date = (current_date + timedelta(days=i)
                                  ).strftime('%d-%m-%Y')
                    if check_date in nav_data:
                        closest_nav = float(nav_data[check_date]['nav'])
                        closest_date = check_date
                        break

                if closest_nav:
                    new_units = round(sip_amount / closest_nav, 4)
                    total_units += new_units
                    total_investment += sip_amount

                    sip_investments.append({
                        'date': closest_date,
                        'amount': sip_amount,
                        'nav': closest_nav,
                        'units': new_units
                    })

                # Move to next month
                if current_date.month == 12:
                    current_date = current_date.replace(
                        year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(
                        month=current_date.month + 1)

            # Update the database
            portfolio_collection.update_one(
                {"scheme_code": scheme_code},
                {
                    "$set": {
                        "units": total_units,
                        "amount_invested": total_investment,
                        "sip_details": {
                            "amount": sip_amount,
                            "day": sip_day,
                            "start_date": start_date.strftime('%Y-%m-%d'),
                            "investments": sip_investments
                        }
                    }
                }
            )

            return jsonify({
                "message": "SIP updated successfully",
                "total_units": total_units,
                "total_investment": total_investment,
                "sip_investments": sip_investments
            })

        except Exception as e:
            print(f"Error updating SIP: {str(e)}")
            return jsonify({"error": str(e)}), 400


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
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
