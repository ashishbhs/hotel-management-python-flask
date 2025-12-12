from supabase import create_client, Client
from marshmallow import Schema, fields, ValidationError, validate
import os
import json

# Initialize Supabase client
supabase: Client = create_client(
    os.environ.get('SUPABASE_URL'),
    os.environ.get('SUPABASE_SERVICE_KEY')
)

# Validation schema
class RoomSchema(Schema):
    room_number = fields.Str(required=True)
    room_type = fields.Str(required=True, validate=validate.OneOf(['single', 'double', 'suite', 'dorm']))
    capacity = fields.Int(required=True, validate=validate.Range(min=1))
    price_per_night = fields.Float(required=True, validate=validate.Range(min=0))

room_schema = RoomSchema()

def handler(event, context):
    """Vercel serverless function handler for rooms endpoint"""
    # Parse the request
    method = event.get('httpMethod', event.get('method', 'GET'))
    query_params = event.get('queryStringParameters', {}) or {}
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }
    
    # Handle OPTIONS for CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        if method == 'GET':
            return handle_get_rooms(query_params, headers)
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return handle_create_room(body, headers)
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            return handle_update_room(query_params, body, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    except Exception as e:
        print(f'Rooms API Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
        }

def handle_get_rooms(params, headers):
    """Get all rooms with optional filtering"""
    skip = int(params.get('skip', 0))
    limit = int(params.get('limit', 100))
    available = params.get('available')
    room_type = params.get('room_type')
    
    query = supabase.table('rooms').select('*')
    
    if available is not None:
        is_available = available.lower() == 'true'
        query = query.eq('is_available', is_available)
    
    if room_type:
        query = query.eq('room_type', room_type)
    
    response = query.range(skip, skip + limit - 1).order('created_at', desc=True).execute()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response.data)
    }

def handle_create_room(data, headers):
    """Create a new room"""
    try:
        # Validate input
        validated_data = room_schema.load(data)
        
        # Check if room number already exists
        existing = supabase.table('rooms').select('id').eq('room_number', validated_data['room_number']).execute()
        if existing.data:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Room number already exists'})
            }
        
        # Add default availability
        validated_data['is_available'] = True
        
        # Create room
        response = supabase.table('rooms').insert(validated_data).execute()
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps(response.data[0])
        }
    
    except ValidationError as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Validation failed', 'details': e.messages})
        }

def handle_update_room(params, data, headers):
    """Update room details"""
    room_id = params.get('id')
    
    if not room_id:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Room ID is required'})
        }
    
    try:
        # Update room
        response = supabase.table('rooms').update(data).eq('id', room_id).execute()
        
        if not response.data:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Room not found'})
            }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(response.data[0])
        }
    
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
