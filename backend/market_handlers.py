from flask import Blueprint, jsonify
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup

market_routes = Blueprint('market_routes', __name__)


@market_routes.route('/market-status', methods=['GET'])
def get_market_status():
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0',
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

        try:
            session = requests.Session()
            session.get("https://www.nseindia.com/", headers=headers)
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
        except Exception:
            pass

        try:
            session = requests.Session()
            bse_home = session.get(
                "https://www.bseindia.com/", headers=headers)
            bse_response = session.get(
                "https://www.bseindia.com/markets/MarketInfo/BhavCopy.aspx",
                headers={**headers, 'Referer': 'https://www.bseindia.com/'}
            )
            if bse_response.status_code == 200:
                soup = BeautifulSoup(bse_response.text, 'html.parser')
                sensex_div = soup.find('div', {'class': 'sensexbluetext'})
                if sensex_div:
                    value_text = sensex_div.find('strong').text.strip()
                    market_data['sensex']['price'] = round(
                        float(value_text.replace(',', '')), 2)
                    change_div = sensex_div.find('div', {'class': 'sensexgrntxt'}) or sensex_div.find(
                        'div', {'class': 'sensexredtxt'})
                    if change_div:
                        change_text = change_div.text.strip()
                        try:
                            change_value = float(
                                change_text.split('(')[1].replace('%)', ''))
                            market_data['sensex']['change_percent'] = round(
                                change_value, 2)
                        except Exception:
                            pass
        except Exception:
            pass

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
