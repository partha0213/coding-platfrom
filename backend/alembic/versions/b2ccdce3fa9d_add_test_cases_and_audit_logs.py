"""add_test_cases_and_audit_logs

Revision ID: b2ccdce3fa9d
Revises: c7d8e9f0a1b2
Create Date: 2025-12-29 20:46:59.415668

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2ccdce3fa9d'
down_revision: Union[str, Sequence[str], None] = 'c7d8e9f0a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create course_problem_test_cases table
    op.create_table(
        'course_problem_test_cases',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('problem_id', sa.Integer(), nullable=False),
        sa.Column('input_data', sa.Text(), nullable=True),
        sa.Column('expected_output', sa.Text(), nullable=False),
        sa.Column('is_hidden', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['problem_id'], ['course_problems.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_course_problem_test_cases_id', 'course_problem_test_cases', ['id'])
    op.create_index('ix_course_problem_test_cases_problem_id', 'course_problem_test_cases', ['problem_id'])

    # Create admin_audit_logs table
    op.create_table(
        'admin_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('old_value', sa.JSON(), nullable=True),
        sa.Column('new_value', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_admin_audit_logs_id', 'admin_audit_logs', ['id'])
    op.create_index('ix_admin_audit_logs_admin_id', 'admin_audit_logs', ['admin_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_admin_audit_logs_admin_id', table_name='admin_audit_logs')
    op.drop_index('ix_admin_audit_logs_id', table_name='admin_audit_logs')
    op.drop_table('admin_audit_logs')
    
    op.drop_index('ix_course_problem_test_cases_problem_id', table_name='course_problem_test_cases')
    op.drop_index('ix_course_problem_test_cases_id', table_name='course_problem_test_cases')
    op.drop_table('course_problem_test_cases')
