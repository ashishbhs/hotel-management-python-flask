import os
import json

def handler(event, context):
    """Simple health check endpoint to verify environment variables"""
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    # Check if environment variables are set (without exposing the actual values)
    env_check = {
        'SUPABASE_URL': 'SET' if os.environ.get('SUPABASE_URL') else 'MISSING',
        'SUPABASE_SERVICE_KEY': 'SET' if os.environ.get('SUPABASE_SERVICE_KEY') else 'MISSING',
        'status': 'ok'
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(env_check)
    }
