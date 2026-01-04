#!/bin/bash

# Script to start all backend services, including the gateway
cd "$(dirname "$0")"

echo "======================================"
echo "Stopping any running Uvicorn processes..."
sudo pkill -f uvicorn 2>/dev/null
echo "All old Uvicorn processes stopped (if any)."
echo "======================================"

echo "Starting all backend services..."

# Start Auth Service on port 8001
echo "Starting Auth Service on port 8001..."
python -m uvicorn auth.main:app --host 0.0.0.0 --port 8001 --reload &
AUTH_PID=$!

# Start User Service on port 8002
echo "Starting User Service on port 8002..."
python -m uvicorn users.main:app --host 0.0.0.0 --port 8002 --reload &
USER_PID=$!

# Start Academic Service on port 8003
echo "Starting Academic Service on port 8003..."
python -m uvicorn academic.main:app --host 0.0.0.0 --port 8003 --reload &
ACADEMIC_PID=$!



# Start Learning Service on port 8004
echo "Starting Learning Service on port 8004..."
python -m uvicorn learning.main:app --host 0.0.0.0 --port 8004 --reload &
LEARNING_PID=$!


# Start Payment Service on port 8005
echo "Starting Payment Service on port 8005..."
python -m uvicorn payment.main:app --host 0.0.0.0 --port 8005 --reload &
PAYMENT_PID=$!




# Start Gateway Service on port 8000
echo "Starting Gateway Service on port 8000..."
python -m uvicorn gateway.main:app --host 0.0.0.0 --port 8000 --reload &
GATEWAY_PID=$!







echo ""
echo "Services started:"
echo "- Auth Service: http://localhost:8001 (PID: $AUTH_PID)"
echo "- User Service: http://localhost:8002 (PID: $USER_PID)"
echo "- Academic Service: http://localhost:8003 (PID: $ACADEMIC_PID)"
echo "- Academic Service: http://localhost:8004 (PID: $LEARNING_PID)"
echo "- Payment Service: http://localhost:8005 (PID: $PAYMENT_PID)"
echo "- Gateway Service: http://localhost:8000 (PID: $GATEWAY_PID)"
echo ""
echo "Press Ctrl+C to stop all services"


# Trap SIGINT and SIGTERM to kill all background processes
trap "echo 'Stopping services...'; kill $AUTH_PID $USER_PID $ACADEMIC_PID $PAYMENT_PID $GATEWAY_PID  2>/dev/null; exit" SIGINT SIGTERM

# Wait for all background processes
wait
