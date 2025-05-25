from flask import Flask, jsonify
from flask_cors import CORS
import requests # To make HTTP requests to Ollama

app = Flask(__name__)
CORS(app) # Enable CORS for all routes, allowing requests from the Electron frontend

OLLAMA_BASE_URL = "http://localhost:11434" # Default Ollama API URL

@app.route('/api/list_ollama_models', methods=['GET'])
def list_ollama_models():
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        
        ollama_data = response.json()
        # The structure of Ollama's /api/tags response is typically {"models": [{"name": "model_name:tag", ...}, ...]}
        # We want to extract just the name field.
        models = [model.get("name") for model in ollama_data.get("models", []) if model.get("name")]
        
        return jsonify({"models": models})
    except requests.exceptions.RequestException as e:
        # Handle network errors, Ollama not running, etc.
        error_message = f"Could not connect to Ollama or error fetching models: {str(e)}"
        # It might be useful to distinguish between Ollama not running vs. other errors
        if isinstance(e, requests.exceptions.ConnectionError):
            error_message = "Ollama server not found at " + OLLAMA_BASE_URL + ". Please ensure Ollama is running."
        
        return jsonify({"error": error_message, "models": []}), 503 # 503 Service Unavailable
    except Exception as e:
        # Handle other potential errors (e.g., unexpected response format)
        return jsonify({"error": f"An unexpected error occurred: {str(e)}", "models": []}), 500

if __name__ == '__main__':
    # Port 5000 is a common default for Flask development
    app.run(debug=True, port=5000)
