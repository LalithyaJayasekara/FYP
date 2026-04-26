from pydantic import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    app_name: str = "carelink-python-backend"
    host: str = "0.0.0.0"
    port: int = 8083
    google_cloud_project: str | None = None
    google_cloud_region: str = "us-central1"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
