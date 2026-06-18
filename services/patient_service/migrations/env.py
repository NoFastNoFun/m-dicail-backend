import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

from database import Base
from models import Patient  # noqa: F401
import config as app_config

alembic_config = context.config
fileConfig(alembic_config.config_file_name)

alembic_config.set_main_option("sqlalchemy.url", app_config.DATABASE_URL)
target_metadata = Base.metadata


def run_migrations_online():
    connectable = engine_from_config(
        alembic_config.get_section(alembic_config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table="alembic_version_patient",
        )
        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()
