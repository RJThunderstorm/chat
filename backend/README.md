# PDF Chatter Backend

This directory contains the Flask backend server for the PDF Chatter application.

## Prerequisites

- Python 3.x installed.
- Ollama installed and running. You can download it from [https://ollama.com/](https://ollama.com/).
- At least one model downloaded via Ollama (e.g., `ollama pull llama3`).

## Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd path/to/your/project/backend
    ```

2.  **Create a Python virtual environment (recommended):**
    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**
    - On macOS/Linux:
      ```bash
      source venv/bin/activate
      ```
    - On Windows:
      ```bash
      venv\Scripts\activate
      ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Running the Server

1.  **Ensure Ollama is running.**
    (The application typically starts Ollama automatically if it's installed as a desktop app. If you run Ollama in a container or manually, ensure it's active.)

2.  **Start the Flask server:**
    With the virtual environment activated and from within the `backend` directory:
    ```bash
    python app.py
    ```

    The server will start on `http://localhost:5000` by default. The Electron frontend application expects the backend to be running at this address.

## API Endpoints

-   **GET `/api/list_ollama_models`**: Returns a JSON list of available Ollama models that are downloaded locally.
    Example: `{"models": ["llama3:latest", "mistral:latest"]}`
