"""add language-based sequential learning schema

Revision ID: c7d8e9f0a1b2
Revises: b72ef1234abc
Create Date: 2025-12-29 17:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c7d8e9f0a1b2'
down_revision = '1f99868d94e5'
branch_labels = None
depends_on = None


def upgrade():
    # Create courses table
    op.create_table(
        'courses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('language', sa.String(), nullable=False),
        sa.Column('editor_language', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('language', name='unique_course_language')
    )
    op.create_index('ix_courses_id', 'courses', ['id'])
    op.create_index('ix_courses_language', 'courses', ['language'])
    
    # Create problems table with course_id and step_number
    op.create_table(
        'course_problems',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('step_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('starter_code', sa.Text(), nullable=True),
        sa.Column('solution_code', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('course_id', 'step_number', name='unique_course_step')
    )
    op.create_index('ix_course_problems_id', 'course_problems', ['id'])
    op.create_index('ix_course_problems_course_id', 'course_problems', ['course_id'])
    
    # Create user_course_progress table
    op.create_table(
        'user_course_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('current_step', sa.Integer(), server_default='1', nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'course_id', name='unique_user_course')
    )
    op.create_index('ix_user_course_progress_id', 'user_course_progress', ['id'])
    op.create_index('ix_user_course_progress_user_id', 'user_course_progress', ['user_id'])
    op.create_index('ix_user_course_progress_course_id', 'user_course_progress', ['course_id'])


def downgrade():
    # Drop tables in reverse order (drop dependent tables first)
    op.drop_index('ix_user_course_progress_course_id', table_name='user_course_progress')
    op.drop_index('ix_user_course_progress_user_id', table_name='user_course_progress')
    op.drop_index('ix_user_course_progress_id', table_name='user_course_progress')
    op.drop_table('user_course_progress')
    
    op.drop_index('ix_course_problems_course_id', table_name='course_problems')
    op.drop_index('ix_course_problems_id', table_name='course_problems')
    op.drop_table('course_problems')
    
    op.drop_index('ix_courses_language', table_name='courses')
    op.drop_index('ix_courses_id', table_name='courses')
    op.drop_table('courses')
