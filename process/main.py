from typing import Final
from fastapi import FastAPI
from backend import *
from fastapi.middleware.cors import CORSMiddleware



app: Final = FastAPI(openapi_url="/api/openapi.json", docs_url="/api/docs")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    #allow_origins=["*"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(backend, prefix='/api', tags=['backend'])