from supabase import create_client, Client
from marshmallow import Schema, fields, ValidationError, validate
from datetime import datetime
import os
import json

# Initialize Supabase client
supabase: Client = create_client(
    os.environ.get('SUPABASE_URL'),
    os.environ.get('SUPABASE_SERVICE_KEY')
)

# Validation schemas
class BookingSchema(Schema):
    guest_id = fields.Int(required=True, validate=validate.Range(min=1))
    room_id = fields.Int(required=True, validate=validate.Range(min=1))
    check_in_date = fields.Date(required=True)
    check_out_date = fields.Date(required=True)
    total_amount = fields.Float(required=True, validate=validate.Range(min=0))

booking_schema = BookingSchema()

def handler(event, context):
    """Vercel serverless function handler for bookings endpoint"""
    # Parse the request
    method = event.get('httpMethod', event.get('method', 'GET'))
    query_params = event.get('queryStringParameters', {}) or {}
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            return handle_get_bookings(query_params, headers)
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return handle_create_booking(body, headers)
        elif method == 'PUT':
            action = query_params.get('action')
            if action == 'checkin':
                return handle_check_in(query_params, headers)
            elif action == 'checkout':
                return handle_check_out(query_params, headers)
            else:
                body = json.loads(event.get('body', '{}'))
                return handle_update_booking(query_params, body, headers)
        elif method == 'DELETE':
            return handle_cancel_booking(query_params, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    except Exception as e:
        print(f'Bookings API Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
        }

def handle_get_bookings(params, headers):
    """Get all bookings with optional filtering"""
    skip = int(params.get('skip', 0))
    limit = int(params.get('limit', 100))
    status = params.get('status')
    guest_id = params.get('guest_id')
    room_id = params.get('room_id')
    
    query = supabase.table('bookings').select('''
        *,
        guest:guests(id, name, email),
        room:rooms(id, room_number, room_type, price_per_night)
    ''')
    
    if status:
        query = query.eq('status', status)
    
    if guest_id:
        query = query.eq('guest_id', int(guest_id))
    
    if room_id:
        query = query.eq('room_id', int(room_id))
    
    response = query.range(skip, skip + limit - 1).order('created_at', desc=True).execute()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response.data)
    }

def handle_create_booking(data, headers):
    """Create a new booking"""
    try:
        # Validate input
        validated_data = booking_schema.load(data)
        
        # Verify guest exists
        guest = supabase.table('guests').select('id').eq('id', validated_data['guest_id']).execute()
        if not guest.data:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Guest not found'})
            }
        
        # Verify room exists and is available
        room = supabase.table('rooms').select('id, is_available').eq('id', validated_data['room_id']).execute()
        if not room.data:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Room not found'})
            }
        
        if not room.data[0]['is_available']:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Room is not available'})
            }
        
        # Check for booking conflicts
        conflicts = supabase.table('bookings').select('*').eq('room_id', validated_data['room_id']).in_('status', ['booked', 'checked_in']).execute()
        
        check_in = validated_data['check_in_date']
        check_out = validated_data['check_out_date']
        
        for conflict in conflicts.data:
            conflict_in = datetime.fromisoformat(conflict['check_in_date'].replace('Z', '+00:00')).date()
            conflict_out = datetime.fromisoformat(conflict['check_out_date'].replace('Z', '+00:00')).date()
            
            if (check_in <= conflict_out and check_out >= conflict_in):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Room is already booked for these dates'})
                }
        
        # Create booking
        validated_data['status'] = 'booked'
        validated_data['check_in_date'] = validated_data['check_in_date'].isoformat()
        validated_data['check_out_date'] = validated_data['check_out_date'].isoformat()
        
        response = supabase.table('bookings').insert(validated_data).execute()
        
        # Update room availability
        supabase.table('rooms').update({'is_available': False}).eq('id', validated_data['room_id']).execute()
        
        # Fetch complete booking data
        booking = supabase.table('bookings').select('''
            *,
            guest:guests(id, name, email),
            room:rooms(id, room_number, room_type)
        ''').eq('id', response.data[0]['id']).execute()
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps(booking.data[0])
        }
    
    except ValidationError as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Validation failed', 'details': e.messages})
        }

def handle_check_in(params, headers):
    """Check in a guest"""
    booking_id = params.get('id')
    
    if not booking_id:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Booking ID is required'})
        }
    
    # Get booking
    booking = supabase.table('bookings').select('*').eq('id', booking_id).execute()
    
    if not booking.data:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Booking not found'})
        }
    
    if booking.data[0]['status'] != 'booked':
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Only booked reservations can be checked in'})
        }
    
    # Update booking
    response = supabase.table('bookings').update({
        'status': 'checked_in',
        'actual_check_in': datetime.utcnow().isoformat()
    }).eq('id', booking_id).execute()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Guest checked in successfully', 'booking': response.data[0]})
    }

def handle_check_out(params, headers):
    """Check out a guest"""
    booking_id = params.get('id')
    
    if not booking_id:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Booking ID is required'})
        }
    
    # Get booking
    booking = supabase.table('bookings').select('*').eq('id', booking_id).execute()
    
    if not booking.data:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Booking not found'})
        }
    
    if booking.data[0]['status'] != 'checked_in':
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Only checked-in guests can be checked out'})
        }
    
    # Update booking
    response = supabase.table('bookings').update({
        'status': 'checked_out',
        'actual_check_out': datetime.utcnow().isoformat()
    }).eq('id', booking_id).execute()
    
    # Make room available again
    supabase.table('rooms').update({'is_available': True}).eq('id', booking.data[0]['room_id']).execute()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Guest checked out successfully', 'booking': response.data[0]})
    }

def handle_update_booking(params, data, headers):
    """Update booking details"""
    booking_id = params.get('id')
    
    if not booking_id:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Booking ID is required'})
        }
    
    # Update booking
    response = supabase.table('bookings').update(data).eq('id', booking_id).execute()
    
    if not response.data:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Booking not found'})
        }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response.data[0])
    }

def handle_cancel_booking(params, headers):
    """Cancel a booking"""
    booking_id = params.get('id')
    
    if not booking_id:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Booking ID is required'})
        }
    
    # Get booking
    booking = supabase.table('bookings').select('*').eq('id', booking_id).execute()
    
    if not booking.data:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Booking not found'})
        }
    
    status = booking.data[0]['status']
    
    if status == 'checked_in':
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Cannot cancel a booking for a checked-in guest'})
        }
    
    if status == 'cancelled':
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Booking is already cancelled'})
        }
    
    if status == 'checked_out':
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Cannot cancel a completed booking'})
        }
    
    # Cancel booking
    supabase.table('bookings').update({'status': 'cancelled'}).eq('id', booking_id).execute()
    
    # Make room available again
    supabase.table('rooms').update({'is_available': True}).eq('id', booking.data[0]['room_id']).execute()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Booking cancelled successfully'})
    }
