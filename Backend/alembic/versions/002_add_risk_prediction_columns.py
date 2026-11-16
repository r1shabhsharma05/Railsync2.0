"""Add missing columns to risk_predictions (overrun_probability, cold_start_fallback).

The 001 initial migration predates these two model fields, so the live
Postgres schema (built by alembic) lacked them while the app selects and
inserts them. Local SQLite runs never hit this because create_all builds
tables from the models.

Revision ID: 002_risk_columns
Revises: 001_initial
Create Date: 2026-11-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_risk_columns"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("risk_predictions", sa.Column("overrun_probability", sa.Float(), nullable=True))
    op.add_column("risk_predictions", sa.Column("cold_start_fallback", sa.Boolean(), nullable=True, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("risk_predictions", "cold_start_fallback")
    op.drop_column("risk_predictions", "overrun_probability")
