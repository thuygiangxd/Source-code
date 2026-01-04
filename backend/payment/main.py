from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from payment.router import router as payment_router

app = FastAPI(title="Payment Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(payment_router, tags=["payment"])

@app.get("/")
def root():
    return {"message": "Payment Service OK"}
