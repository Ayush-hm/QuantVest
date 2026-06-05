from db import portfolio_collection
from mftool import Mftool
from datetime import datetime, timedelta

mf = Mftool()


def get_portfolio_history(start_date, end_date):
    portfolio = list(portfolio_collection.find({}, {'_id': 0}))
    if not portfolio:
        return []

    portfolio_history = {}
    total_investment = sum(fund['amount_invested'] for fund in portfolio)

    for fund in portfolio:
        scheme_code = fund.get('scheme_code')
        units = fund.get('units', 0)
        nav_data = mf.get_scheme_historical_nav_year(
            scheme_code, start_date, end_date)
        if not nav_data:
            continue

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
                        'returns': 0
                    }
            except Exception:
                continue

    history_list = []
    for date_data in portfolio_history.values():
        if total_investment > 0:
            date_data['returns'] = (
                (date_data['value'] - date_data['investment']) / date_data['investment']) * 100
        history_list.append(date_data)

    history_list.sort(key=lambda x: datetime.strptime(x['date'], '%d-%m-%Y'))
    return history_list


def add_portfolio_entry(scheme_name, amount, buy_date):
    schemes = mf.get_available_schemes(scheme_name)
    scheme_code = None
    for code, name in schemes.items():
        if name == scheme_name:
            scheme_code = code
            break

    formatted_date = datetime.strptime(
        buy_date, "%Y-%m-%d").strftime("%d-%m-%Y")
    nav_data = mf.get_scheme_historical_nav(scheme_code, as_Dataframe=True)
    buy_price = float(nav_data.loc[formatted_date, "nav"])
    units = round(float(amount) / buy_price, 4)

    portfolio_collection.insert_one({
        "scheme_code": scheme_code,
        "scheme_name": scheme_name,
        "amount_invested": float(amount),
        "buy_date": formatted_date,
        "buy_price": buy_price,
        "units": units
    })

    return True


def get_portfolio_summary():
    funds = list(portfolio_collection.find({}, {"_id": 0}))
    total_value = 0
    total_investment = 0

    result_funds = []
    for fund in funds:
        try:
            details = mf.get_scheme_details(fund["scheme_code"])
            current_nav = float(details.get("nav", 0))
            current_value = current_nav * fund["units"]
            investment = fund["amount_invested"]

            fund["current_price"] = current_nav
            fund["current_value"] = round(current_value, 2)
            fund["returns"] = round(
                ((current_value - investment) / investment) * 100, 2) if investment > 0 else 0

            total_value += current_value
            total_investment += investment
        except Exception:
            fund["current_price"] = None
            fund["current_value"] = None
            fund["returns"] = None

        result_funds.append(fund)

    portfolio_data = {
        "funds": result_funds,
        "summary": {
            "total_investment": round(total_investment, 2),
            "total_value": round(total_value, 2),
            "total_returns": round(((total_value - total_investment) / total_investment) * 100, 2) if total_investment > 0 else 0
        }
    }

    return portfolio_data


def get_fund_details(scheme_code):
    fund = portfolio_collection.find_one(
        {"scheme_code": scheme_code}, {"_id": 0})
    if not fund:
        return None

    details = mf.get_scheme_details(scheme_code)
    end_date = datetime.now()
    start_date = datetime.strptime(fund['buy_date'], '%d-%m-%Y')

    nav_history = mf.get_scheme_historical_nav_year(
        scheme_code,
        start_date.strftime('%d-%m-%Y'),
        end_date.strftime('%d-%m-%Y')
    )

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

    return response_data


def update_investment(scheme_code, new_amount):
    fund = portfolio_collection.find_one({"scheme_code": scheme_code})
    if not fund:
        return None
    new_units = round(float(new_amount) / fund['buy_price'], 4)
    portfolio_collection.update_one({"scheme_code": scheme_code}, {
                                    "$set": {"amount_invested": float(new_amount), "units": new_units}})
    return {"new_amount": float(new_amount), "new_units": new_units}


def update_sip(scheme_code, sip_amount, sip_start_date, sip_day=1):
    fund = portfolio_collection.find_one({"scheme_code": scheme_code})
    if not fund:
        return None

    today = datetime.now()
    start_date = datetime.strptime(sip_start_date, '%Y-%m-%d')

    nav_data = mf.get_scheme_historical_nav_year(
        scheme_code,
        start_date.strftime('%d-%m-%Y'),
        today.strftime('%d-%m-%Y')
    )

    total_units = fund['units']
    total_investment = fund['amount_invested']
    sip_investments = []

    current_date = start_date
    while current_date <= today:
        closest_nav = None
        closest_date = None
        for i in range(5):
            check_date = (current_date + timedelta(days=i)
                          ).strftime('%d-%m-%Y')
            if check_date in nav_data:
                closest_nav = float(nav_data[check_date]['nav'])
                closest_date = check_date
                break

        if closest_nav:
            new_units = round(float(sip_amount) / closest_nav, 4)
            total_units += new_units
            total_investment += float(sip_amount)
            sip_investments.append({'date': closest_date, 'amount': float(
                sip_amount), 'nav': closest_nav, 'units': new_units})

        if current_date.month == 12:
            current_date = current_date.replace(
                year=current_date.year + 1, month=1)
        else:
            current_date = current_date.replace(month=current_date.month + 1)

    portfolio_collection.update_one({"scheme_code": scheme_code}, {"$set": {"units": total_units, "amount_invested": total_investment, "sip_details": {
                                    "amount": float(sip_amount), "day": sip_day, "start_date": start_date.strftime('%Y-%m-%d'), "investments": sip_investments}}})

    return {"total_units": total_units, "total_investment": total_investment, "sip_investments": sip_investments}
