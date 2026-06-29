"""add role and patient_id to users

Revision ID: 002
down_revision: 001
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE TYPE user_role AS ENUM ('PRATICIEN', 'PATIENT')")
    op.add_column("users",
        sa.Column("role", sa.Enum("PRATICIEN", "PATIENT", name="user_role"),
        nullable=False, server_default="PRATICIEN")
    )
    op.add_column("users",
        sa.Column("patient_id", sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column("users", "role")
    op.drop_column("users", "patient_id")
    op.execute("DROP TYPE user_role")
