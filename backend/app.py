from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'farmease-secret-key-2024')

# In-memory storage for demo
users = {}
farms = {}
user_counter = 1
farm_counter = 1



# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    global user_counter
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user exists
    if data['email'] in users:
        return jsonify({'error': 'User already exists'}), 400
    
    # Store user
    user_id = user_counter
    users[data['email']] = {
        'id': user_id,
        'name': data['name'],
        'email': data['email'],
        'password': data['password'],
        'location': data.get('location', '')
    }
    user_counter += 1
    
    # Generate token
    token = jwt.encode({
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': {
            'id': user_id,
            'name': data['name'],
            'email': data['email'],
            'location': data.get('location', '')
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    # Check user exists and password matches
    user = users.get(data['email'])
    if not user or user['password'] != data['password']:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate token
    token = jwt.encode({
        'user_id': user['id'],
        'exp': datetime.utcnow() + timedelta(days=30)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'location': user['location']
        }
    })

# Farm Management Routes
@app.route('/api/farms', methods=['GET'])
def get_farms():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        token = token.replace('Bearer ', '')
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Get user farms
    user_farms = [farm for farm in farms.values() if farm['user_id'] == user_id]
    
    result = []
    for farm in user_farms:
        # Calculate progress based on sowing date
        sowing_date = datetime.strptime(farm['sowingDate'], '%Y-%m-%d').date()
        days_since_sowing = (datetime.now().date() - sowing_date).days
        crop_harvest_days = get_crop_harvest_days(farm['cropType'])
        progress = min((days_since_sowing / crop_harvest_days) * 100, 100)
        
        result.append({
            'id': farm['id'],
            'cropType': farm['cropType'],
            'soilType': farm['soilType'],
            'area': farm['area'],
            'sowingDate': farm['sowingDate'],
            'status': farm['status'],
            'progress': round(progress, 1),
            'daysToHarvest': max(crop_harvest_days - days_since_sowing, 0)
        })
    
    return jsonify(result)

@app.route('/api/farms', methods=['POST'])
def add_farm():
    global farm_counter
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        token = token.replace('Bearer ', '')
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    
    data = request.get_json()
    required_fields = ['cropType', 'soilType', 'area', 'sowingDate']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Store farm
    farm_id = farm_counter
    farms[farm_id] = {
        'id': farm_id,
        'user_id': user_id,
        'cropType': data['cropType'],
        'soilType': data['soilType'],
        'area': float(data['area']),
        'sowingDate': data['sowingDate'],
        'status': 'Growing'
    }
    farm_counter += 1
    
    return jsonify({
        'message': 'Farm added successfully',
        'farmId': farm_id
    }), 201

@app.route('/api/farms/<int:farm_id>', methods=['DELETE'])
def delete_farm(farm_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        token = token.replace('Bearer ', '')
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Check if farm exists and belongs to user
    farm = farms.get(farm_id)
    if not farm or farm['user_id'] != user_id:
        return jsonify({'error': 'Farm not found'}), 404
    
    # Delete farm
    del farms[farm_id]
    
    return jsonify({'message': 'Farm deleted successfully'})

# Growth data route
@app.route('/api/farms/<int:farm_id>/growth', methods=['GET'])
def get_growth_data(farm_id):
    farm = farms.get(farm_id)
    if not farm:
        return jsonify({'error': 'Farm not found'}), 404
    
    sowing_date = datetime.strptime(farm['sowingDate'], '%Y-%m-%d').date()
    growth_data = generate_growth_data(farm['cropType'], farm['soilType'], sowing_date)
    
    return jsonify(growth_data)

# Weather route
@app.route('/api/weather', methods=['GET'])
def get_weather():
    location = request.args.get('location', 'Delhi')
    
    # Mock weather data (replace with actual API call)
    weather_data = {
        'temperature': 28,
        'humidity': 65,
        'windSpeed': 12,
        'condition': 'Partly Cloudy',
        'location': location,
        'forecast': [
            {'day': 'Today', 'high': 32, 'low': 24, 'condition': 'Sunny'},
            {'day': 'Tomorrow', 'high': 30, 'low': 22, 'condition': 'Cloudy'},
            {'day': 'Wednesday', 'high': 28, 'low': 20, 'condition': 'Rainy'},
            {'day': 'Thursday', 'high': 26, 'low': 18, 'condition': 'Stormy'},
            {'day': 'Friday', 'high': 29, 'low': 21, 'condition': 'Partly Cloudy'}
        ]
    }
    
    return jsonify(weather_data)

# Market prices route
@app.route('/api/market', methods=['GET'])
def get_market_prices():
    # Mock market data
    market_data = [
        {'crop': 'Rice', 'price': 2500, 'change': 2.5, 'market': 'Delhi Mandi'},
        {'crop': 'Wheat', 'price': 2200, 'change': -1.2, 'market': 'Punjab Mandi'},
        {'crop': 'Cotton', 'price': 5800, 'change': 3.2, 'market': 'Gujarat Mandi'},
        {'crop': 'Tomato', 'price': 1200, 'change': -5.8, 'market': 'Karnataka Mandi'},
        {'crop': 'Onion', 'price': 800, 'change': 8.5, 'market': 'Maharashtra Mandi'}
    ]
    
    return jsonify(market_data)

# Helper functions
def get_crop_harvest_days(crop_type):
    harvest_days = {
        'Rice': 120, 'Wheat': 110, 'Maize': 90, 'Cotton': 180,
        'Sugarcane': 365, 'Tomato': 75, 'Potato': 90, 'Onion': 120
    }
    return harvest_days.get(crop_type, 100)

def generate_growth_data(crop_type, soil_type, sowing_date):
    crop_factors = {
        'Rice': {'baseGrowth': 15, 'moistureRange': [70, 90], 'rainfallRange': [10, 25]},
        'Wheat': {'baseGrowth': 12, 'moistureRange': [60, 80], 'rainfallRange': [5, 15]},
        'Maize': {'baseGrowth': 18, 'moistureRange': [65, 85], 'rainfallRange': [8, 20]},
        'Cotton': {'baseGrowth': 10, 'moistureRange': [50, 70], 'rainfallRange': [3, 12]}
    }
    
    soil_factors = {
        'Clay': {'moistureBonus': 10, 'growthPenalty': -2},
        'Sandy': {'moistureBonus': -10, 'growthPenalty': 3},
        'Loamy': {'moistureBonus': 5, 'growthPenalty': 0}
    }
    
    crop = crop_factors.get(crop_type, crop_factors['Rice'])
    soil = soil_factors.get(soil_type, soil_factors['Loamy'])
    
    days_since_sowing = (datetime.now().date() - sowing_date).days
    weeks_since_sowing = max(1, days_since_sowing // 7)
    
    growth_data = []
    for week in range(1, 7):
        if week <= weeks_since_sowing:
            progress = min(week * (crop['baseGrowth'] + soil['growthPenalty']) + (week * 2), 100)
        else:
            progress = min(weeks_since_sowing * crop['baseGrowth'] + (week * 1), 100)
        
        growth_data.append({
            'week': week,
            'progress': round(progress, 1),
            'soilMoisture': round(crop['moistureRange'][0] + 
                                (crop['moistureRange'][1] - crop['moistureRange'][0]) * 0.7 + 
                                soil['moistureBonus'], 1),
            'rainfall': round(crop['rainfallRange'][0] + 
                            (crop['rainfallRange'][1] - crop['rainfallRange'][0]) * 0.6, 1)
        })
    
    return growth_data

if __name__ == '__main__':
    print("🌾 FarmEase API Server Starting...")
    print("📍 Server: http://localhost:5001")
    print("📊 Status: Ready for connections")
    app.run(debug=True, port=5001, host='0.0.0.0')