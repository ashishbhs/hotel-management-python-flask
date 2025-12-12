from supabase import create_client, Client
from marshmallow import Schema, fields, ValidationError
import os
import json

# Validation schema
class GuestSchema(Schema):
    name = fields.Str(required=True)
    email = fields.Email(required=True)
    phone = fields.Str(required=True)
    address = fields.Str(allow_none=True)
    id_proof = fields.Str(allow_none=True)

guest_schema = GuestSchema()

# Lazy initialization of Supabase client
_supabase_client = None

def get_supabase():
    """Get or create Supabase client"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            os.environ.get('SUPABASE_URL'),
            os.environ.get('SUPABASE_SERVICE_KEY')
        )
    return _supabase_client

def handler(event, context):
    """Vercel serverless function handler for guests endpoint"""
    # Parse the request
    method = event.get('httpMethod', event.get('method', 'GET'))
    query_params = event.get('queryStringParameters', {}) or {}
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
            return handle_get_guests(query_params, headers)
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return handle_create_guest(body, headers)
        elif method == 'DELETE':
            return handle_delete_guest(query_params, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    except Exception as e:
        print(f'Guests API Error: {str(e)}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
        }

def handle_get_guests(params, headers):
    """Get all guests with optional filtering"""
    supabase = get_supabase()
    skip = int(params.get('skip', 0))
    limit = int(params.get('limit', 100))
    search = params.get('search', '')
    
    query = supabase.table('guests').select('*')
    
    if search:
        query = query.or_(f'name.ilike.%{search}%,email.ilike.%{search}%,phone.ilike.%{search}%')
    
    response = query.range(skip, skip + limit - 1).order('created_at', desc=True).execute()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response.data)
    }

def handle_create_guest(data, headers):
    """Create a new guest"""
    supabase = get_supabase()
    try:
        # Validate input
        validated_data = guest_schema.load(data)
        
        # Check if email already exists
        existing = supabase.table('guests').select('id').eq('email', validated_data['email']).execute()
        if existing.data:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Guest with this email already exists'})
            }
        
        # Create guest
        response = supabase.table('guests').insert(validated_data).execute()
        
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

def handle_delete_guest(params, headers):
    """Delete a guest by ID"""
    supabase = get_supabase()
    guest_id = params.get('id')
    
    if not guest_id:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Guest ID is required'})
        }
    
    # Check if guest has any bookings
    bookings = supabase.table('bookings').select('id').eq('guest_id', guest_id).execute()
    if bookings.data:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Cannot delete guest with existing bookings'})
        }
    
    # Delete guest
    supabase.table('guests').delete().eq('id', guest_id).execute()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Guest deleted successfully'})
    }
