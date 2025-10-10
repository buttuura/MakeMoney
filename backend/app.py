from flask import Flask, request, jsonify
import logging
import os

app = Flask(__name__)

# Set up error logging
if not os.path.exists('logs'):
    os.makedirs('logs')
logging.basicConfig(filename='logs/error.log', level=logging.ERROR)

# Dummy user store (replace with database in production)
users = {}

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    phone = data.get('phone')
    password = data.get('password')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    email = data.get('email')
    if not phone or not password:
        logging.error('Registration error: Missing phone or password')
        return jsonify({'error': 'Phone and password required'}), 400
    if phone in users:
        logging.error(f'Registration error: Phone {phone} already registered')
        return jsonify({'error': 'Phone already registered'}), 400
    users[phone] = {
        'password': password,
        'first_name': first_name,
        'last_name': last_name,
        'email': email
    }
    return jsonify({'message': 'Registration successful'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    phone = data.get('phone')
    password = data.get('password')
    user = users.get(phone)
    if not user or user['password'] != password:
        logging.error(f'Login error: Invalid credentials for phone {phone}')
        return jsonify({'error': 'Invalid phone or password'}), 401
    return jsonify({'message': 'Login successful'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
