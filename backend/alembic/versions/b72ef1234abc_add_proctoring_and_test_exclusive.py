"""add proctoring and test exclusive features

Revision ID: b72ef1234abc
Revises: a63df0063486
Create Date: 2025-12-28 03:27:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b72ef1234abc'
down_revision = 'a63df0063486'
branch_labels = None
depends_on = None


def upgrade():
    # Get current connection
    conn = op.get_bind()
    
    # Check if is_test_problem exists
    op.execute(sa.text('ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_test_problem BOOLEAN DEFAULT false NOT NULL'))
    
    # Add test_id column to behavior_logs table (foreign key to scheduled_tests)
    op.execute(sa.text('ALTER TABLE behavior_logs ADD COLUMN IF NOT EXISTS test_id INTEGER'))
    
    # Try to add the foreign key constraint
    try:
        op.create_foreign_key(
            'fk_behavior_logs_test_id',
            'behavior_logs', 'scheduled_tests',
            ['test_id'], ['id']
        )
    except Exception:
        pass # Probably already exists
    
    # Add severity column to behavior_logs table
    op.execute(sa.text("ALTER TABLE behavior_logs ADD COLUMN IF NOT EXISTS severity VARCHAR DEFAULT 'LOW' NOT NULL"))
    
    # Add problem_ids column to scheduled_tests table (from the python migration)
    op.execute(sa.text("ALTER TABLE scheduled_tests ADD COLUMN IF NOT EXISTS problem_ids JSON DEFAULT '[]'::json"))

    # Submission table updates
    op.execute(sa.text("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS test_id INTEGER REFERENCES scheduled_tests(id)"))
    op.execute(sa.text("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS error_message TEXT"))
    op.execute(sa.text("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_test_submission BOOLEAN DEFAULT false"))

    # Problem table updates
    op.execute(sa.text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS starter_codes JSON DEFAULT '{}'::json"))
    op.execute(sa.text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS creator_id INTEGER REFERENCES users(id)"))
    
    # Create test_problems junction table for many-to-many relationship
    # Standard op.create_table doesn't have IF NOT EXISTS, so use raw SQL or check
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS test_problems (
            id SERIAL PRIMARY KEY,
            test_id INTEGER NOT NULL REFERENCES scheduled_tests(id),
            problem_id INTEGER NOT NULL REFERENCES problems(id),
            "order" INTEGER DEFAULT 0 NOT NULL
        )
    """))
    
    # Create indices if they don't exist
    op.execute(sa.text('CREATE INDEX IF NOT EXISTS ix_test_problems_test_id ON test_problems (test_id)'))
    op.execute(sa.text('CREATE INDEX IF NOT EXISTS ix_test_problems_problem_id ON test_problems (problem_id)'))


def downgrade():
    # Remove test_problems logic
    op.execute(sa.text('DROP TABLE IF EXISTS test_problems CASCADE'))
    
    # Remove behavior log columns
    op.execute(sa.text('ALTER TABLE behavior_logs DROP COLUMN IF EXISTS severity'))
    op.execute(sa.text('ALTER TABLE behavior_logs DROP COLUMN IF EXISTS test_id'))
    
    # Remove scheduled_tests column
    op.execute(sa.text('ALTER TABLE scheduled_tests DROP COLUMN IF EXISTS problem_ids'))
    
    # Remove problems column
    op.execute(sa.text('ALTER TABLE problems DROP COLUMN IF EXISTS is_test_problem'))
