# Backend Services

## Prerequisites
- Python 3.11 or higher
- pip

## Installation

1. Install dependencies:
```bash
pip3 install -r requirements.txt
```

Or if using Python 3.11 specifically:
```bash
python3.11 -m pip install -r requirements.txt
```

## Running Services

### Start all services:
```bash
./start_services.sh
```

### Start individual services:

**Auth Service (Port 8001):**
```bash
python3.11 -m uvicorn auth.main:app --host 0.0.0.0 --port 8001 --reload
```

**User Service (Port 8002):**
```bash
python3.11 -m uvicorn user.main:app --host 0.0.0.0 --port 8002 --reload
```

## API Documentation

Once services are running, access the Swagger UI:
- Auth Service: http://localhost:8001/docs
- User Service: http://localhost:8002/docs

## Environment Variables

Make sure to configure the `.env` file with:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- Other service URLs and SMTP settings
