from flask import Blueprint, jsonify, request
from mftool import Mftool

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
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        nav_data = mf.get_scheme_historical_nav_year(
            scheme_code, start_date, end_date)

        historical_data = []
        for date, nav in nav_data.items():
            historical_data.append({
                'date': date,
                'nav': float(nav['nav'])
            })

        historical_data.sort(
            key=lambda x: __import__('datetime').datetime.strptime(x['date'], '%d-%m-%Y'))

        return jsonify(historical_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
