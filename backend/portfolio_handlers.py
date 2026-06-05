from flask import Blueprint, jsonify, request
from datetime import datetime
from services.portfolio_service import (
    get_portfolio_history as svc_get_portfolio_history,
    add_portfolio_entry,
    get_portfolio_summary,
    get_fund_details,
    update_investment,
    update_sip,
)

portfolio_routes = Blueprint('portfolio_routes', __name__)


@portfolio_routes.route('/portfolio-history', methods=['GET'])
def get_portfolio_history():
    try:
        end_date = request.args.get(
            'end_date') or datetime.now().strftime('%d-%m-%Y')
        start_date = request.args.get('start_date') or (
            datetime.strptime(end_date, '%d-%m-%Y') -
            __import__('datetime').timedelta(days=365)
        ).strftime('%d-%m-%Y')

        history = svc_get_portfolio_history(start_date, end_date)
        return jsonify(history)
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@portfolio_routes.route('/portfolio', methods=['POST', 'GET'])
def portfolio():
    if request.method == 'POST':
        data = request.get_json()
        add_portfolio_entry(data.get('scheme_name'),
                            data.get('amount'), data.get('buy_date'))
        return jsonify({"message": "Fund added to portfolio"}), 201

    else:
        summary = get_portfolio_summary()
        return jsonify(summary)


@portfolio_routes.route('/portfolio/<scheme_code>', methods=['GET', 'PUT', 'PATCH'])
def manage_fund(scheme_code):
    if request.method == 'PATCH':
        try:
            data = request.get_json()
            res = update_investment(scheme_code, data.get('amount'))
            if res is None:
                return jsonify({"error": "Fund not found"}), 404
            return jsonify({"message": "Investment amount updated successfully", **res}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    if request.method == 'GET':
        try:
            details = get_fund_details(scheme_code)
            if details is None:
                return jsonify({"error": "Fund not found"}), 404
            return jsonify(details)
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    elif request.method == 'PUT':
        try:
            data = request.get_json()
            res = update_sip(scheme_code, data.get('sip_amount', 0), data.get(
                'sip_start_date'), int(data.get('sip_day', 1)))
            if res is None:
                return jsonify({"error": "Fund not found"}), 404
            return jsonify({"message": "SIP updated successfully", **res})
        except Exception as e:
            return jsonify({"error": str(e)}), 400
