"""sync missing columns and tables

Revision ID: 1f99868d94e5
Revises: b72ef1234abc
Create Date: 2025-12-29 00:05:23.158548

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f99868d94e5'
down_revision: Union[str, Sequence[str], None] = 'b72ef1234abc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Problems table
    op.execute(sa.text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS starter_codes JSON DEFAULT '{}'::json"))
    op.execute(sa.text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS creator_id INTEGER REFERENCES users(id)"))
    op.execute(sa.text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_test_problem BOOLEAN DEFAULT false NOT NULL"))

    # Submissions table
    op.execute(sa.text("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS test_id INTEGER REFERENCES scheduled_tests(id)"))
    op.execute(sa.text("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS error_message TEXT"))
    op.execute(sa.text("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_test_submission BOOLEAN DEFAULT false NOT NULL"))

    # Behavior logs
    op.execute(sa.text("ALTER TABLE behavior_logs ADD COLUMN IF NOT EXISTS test_id INTEGER REFERENCES scheduled_tests(id)"))
    op.execute(sa.text("ALTER TABLE behavior_logs ADD COLUMN IF NOT EXISTS severity VARCHAR DEFAULT 'LOW' NOT NULL"))

    # Scheduled tests
    op.execute(sa.text("ALTER TABLE scheduled_tests ADD COLUMN IF NOT EXISTS problem_ids JSON DEFAULT '[]'::json"))

    # Test problems table
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS test_problems (
            id SERIAL PRIMARY KEY,
            test_id INTEGER NOT NULL REFERENCES scheduled_tests(id),
            problem_id INTEGER NOT NULL REFERENCES problems(id),
            "order" INTEGER DEFAULT 0 NOT NULL
        )
    """))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_test_problems_test_id ON test_problems (test_id)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_test_problems_problem_id ON test_problems (problem_id)"))


def downgrade() -> None:
    # Since this is a sync/repair migration, downgrade is destructive if we drop columns.
    # But for completeness:
    op.execute(sa.text("DROP TABLE IF EXISTS test_problems CASCADE"))
    op.execute(sa.text("ALTER TABLE behavior_logs DROP COLUMN IF EXISTS severity"))
    op.execute(sa.text("ALTER TABLE behavior_logs DROP COLUMN IF EXISTS test_id"))
    op.execute(sa.text("ALTER TABLE submissions DROP COLUMN IF EXISTS is_test_submission"))
    op.execute(sa.text("ALTER TABLE submissions DROP COLUMN IF EXISTS error_message"))
    op.execute(sa.text("ALTER TABLE submissions DROP COLUMN IF EXISTS test_id"))
    op.execute(sa.text("ALTER TABLE scheduled_tests DROP COLUMN IF EXISTS problem_ids"))
    op.execute(sa.text("ALTER TABLE problems DROP COLUMN IF EXISTS is_test_problem"))
    op.execute(sa.text("ALTER TABLE problems DROP COLUMN IF EXISTS creator_id"))
    op.execute(sa.text("ALTER TABLE problems DROP COLUMN IF EXISTS starter_codes"))
