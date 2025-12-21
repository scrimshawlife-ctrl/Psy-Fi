from fastapi import FastAPI
from psyfi.exports import EXPORTS

app = FastAPI()

@app.get("/abx/functions")
def abx_functions():
    return {
        "owner": "psyfi",
        "functions": EXPORTS
    }
