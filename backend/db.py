from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")  # or use your Atlas URI
db = client['fundmate']
portfolio_collection = db['portfolio']
