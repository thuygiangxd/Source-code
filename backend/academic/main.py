# from fastapi import FastAPI
# from academic.router import router as academic_router

# app = FastAPI(
#     title="Academic Service API",
#     description="API quản lý môn học, khóa học, lớp học, buổi học và hồ sơ gia sư",
#     version="1.0.0"
# )

# app.include_router(academic_router)

# @app.get("/")
# def read_root():
#     return {"message": "Academic service is running"}



import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from academic.router import router as academic_router

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
UPLOAD_DIR = os.path.join(BASE_DIR, "upload_cv")

app = FastAPI(
    title="Academic Service API",
    description="API quản lý môn học, khóa học, lớp học, buổi học và hồ sơ gia sư",
    version="1.0.0"
)

# serve file CV
# Debug: in ra xem đường dẫn có đúng không
print("Static upload folder:", UPLOAD_DIR)

# Mount static đúng thư mục
app.mount("/upload_cv", StaticFiles(directory=UPLOAD_DIR), name="upload_cv")

app.include_router(academic_router)

@app.get("/")
def read_root():
    return {"message": "Academic service is running"}
