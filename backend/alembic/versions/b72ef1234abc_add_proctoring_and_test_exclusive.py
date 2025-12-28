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
    # Add is_test_problem column to problems table
    op.add_column('problems', 
        sa.Column('is_test_problem', sa.Boolean(), server_default='false', nullable=False)
    )
    
    # Add test_id column to behavior_logs table (foreign key to scheduled_tests)
    op.add_column('behavior_logs',
        sa.Column('test_id', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_behavior_logs_test_id',
        'behavior_logs', 'scheduled_tests',
        ['test_id'], ['id']
    )
    
    # Add severity column to behavior_logs table
    op.add_column('behavior_logs',
        sa.Column('severity', sa.String(), server_default='LOW', nullable=False)
    )
    
    # Create test_problems junction table for many-to-many relationship
    op.create_table(
        'test_problems',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('test_id', sa.Integer(), nullable=False),
        sa.Column('problem_id', sa.Integer(), nullable=False),
        sa.Column('order', sa.Integer(), server_default='0', nullable=False),
        sa.ForeignKeyConstraint(['test_id'], ['scheduled_tests.id'], ),
        sa.ForeignKeyConstraint(['problem_id'], ['problems.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_test_problems_test_id', 'test_problems', ['test_id'])
    op.create_index('ix_test_problems_problem_id', 'test_problems', ['problem_id'])


def downgrade():
    # Remove test_problems junction table
    op.drop_index('ix_test_problems_problem_id', table_name='test_problems')
    op.drop_index('ix_test_problems_test_id', table_name='test_problems')
    op.drop_table('test_problems')
    
    # Remove behavior log columns
    op.drop_column('behavior_logs', 'severity')
    op.drop_constraint('fk_behavior_logs_test_id', 'behavior_logs', type_='foreignkey')
    op.drop_column('behavior_logs', 'test_id')
    
    # Remove is_test_problem column
    op.drop_column('problems', 'is_test_problem')
