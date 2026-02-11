from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request

from .database import init_storage
from .schemas import ChangePasswordRequest, CreateDatabaseRequest
from .services import (
    DatabaseAlreadyExistsError,
    DatabaseNotFoundError,
    InvalidAdminTokenError,
    change_user_password,
    create_admin_token,
    create_database_and_user,
    delete_database,
    inspect_sqlite_database,
    list_audit_logs,
    list_databases,
    validate_admin_token,
)

app = FastAPI(title="BreachRabbit Web Panel")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.on_event("startup")
def startup() -> None:
    init_storage()


@app.get("/", response_class=HTMLResponse)
def databases_page(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("databases.html", {"request": request})


@app.get("/api/databases")
def get_databases() -> dict[str, list[dict[str, str]]]:
    return {"items": list_databases()}


@app.post("/api/databases", status_code=201)
def create_database(payload: CreateDatabaseRequest) -> dict[str, str]:
    try:
        create_database_and_user(payload.db_name, payload.user, payload.password)
    except DatabaseAlreadyExistsError as exc:
        raise HTTPException(status_code=409, detail=f"Database {exc} already exists") from exc
    return {"status": "created"}


@app.delete("/api/databases/{db_name}")
def remove_database(db_name: str) -> dict[str, str]:
    try:
        delete_database(db_name)
    except DatabaseNotFoundError as exc:
        raise HTTPException(status_code=404, detail=f"Database {exc} not found") from exc
    return {"status": "deleted"}


@app.post("/api/databases/{db_name}/password")
def rotate_password(db_name: str, payload: ChangePasswordRequest) -> dict[str, str]:
    try:
        change_user_password(db_name, payload.new_password)
    except DatabaseNotFoundError as exc:
        raise HTTPException(status_code=404, detail=f"Database {exc} not found") from exc
    return {"status": "password_updated"}


@app.post("/api/databases/{db_name}/adminer-token")
def issue_admin_token(db_name: str) -> dict[str, str]:
    try:
        token = create_admin_token(db_name)
    except DatabaseNotFoundError as exc:
        raise HTTPException(status_code=404, detail=f"Database {exc} not found") from exc
    return {"token": token, "url": f"/adminer/{token}"}


@app.get("/adminer/{token}", response_class=HTMLResponse)
def adminer_page(token: str, request: Request) -> HTMLResponse:
    try:
        db_name, db_path = validate_admin_token(token)
    except InvalidAdminTokenError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    tables = inspect_sqlite_database(db_path)
    return templates.TemplateResponse(
        "adminer.html",
        {"request": request, "db_name": db_name, "tables": tables},
    )


@app.get("/api/audit-logs")
def audit_logs() -> dict[str, list[dict[str, str]]]:
    return {"items": list_audit_logs()}
