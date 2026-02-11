from pydantic import BaseModel, Field


class CreateDatabaseRequest(BaseModel):
    db_name: str = Field(min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_]+$")
    user: str = Field(min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)
