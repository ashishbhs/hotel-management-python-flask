from flask import Flask, render_template, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import sys
import json

# Add the current directory to the path so we can import from api/
sys.path.insert(0, os.path.dirname(__file__))

app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

# Enable CORS for all routes
CORS(app)

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)

# Helper function to convert Flask request to Vercel event format
def flask_to_vercel_event(flask_request):
    """Convert Flask request to Vercel event format"""
    return {
        'httpMethod': flask_request.method,
        'method': flask_request.method,
        'queryStringParameters': dict(flask_request.args),
        'body': flask_request.get_data(as_text=True) if flask_request.data else '{}'
    }

# Helper function to convert Vercel response to Flask response
def vercel_to_flask_response(vercel_response):
    """Convert Vercel response to Flask response"""
    response = jsonify(json.loads(vercel_response['body']) if vercel_response.get('body') else {})
    response.status_code = vercel_response.get('statusCode', 200)
    for key, value in vercel_response.get('headers', {}).items():
        response.headers[key] = value
    return response

# API Routes - Import and use the handlers from api/ modules
@app.route('/api/guests', methods=['GET', 'POST', 'DELETE', 'OPTIONS'])
def guests_api():
    """Guests API endpoint"""
    from api.guests import handler
    event = flask_to_vercel_event(request)
    vercel_response = handler(event, {})
    return vercel_to_flask_response(vercel_response)

@app.route('/api/rooms', methods=['GET', 'POST', 'PUT', 'OPTIONS'])
def rooms_api():
    """Rooms API endpoint"""
    from api.rooms import handler
    event = flask_to_vercel_event(request)
    vercel_response = handler(event, {})
    return vercel_to_flask_response(vercel_response)

@app.route('/api/bookings', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def bookings_api():
    """Bookings API endpoint"""
    from api.bookings import handler
    event = flask_to_vercel_event(request)
    vercel_response = handler(event, {})
    return vercel_to_flask_response(vercel_response)

if __name__ == '__main__':
    # For local development only
    # In production, Vercel will use the serverless functions in api/
    print("=" * 60)
    print("Hotel Management System - Flask Development Server")
    print("=" * 60)
    print("Server running at: http://127.0.0.1:5000")
    print("Make sure your .env file has valid Supabase credentials!")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
