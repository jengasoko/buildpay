"""phase 5 6 leases invoices rooms maintenance

Revision ID: f7a2c9e3d456
Revises: e13d86e42168
Create Date: 2026-09-14 12:00:00.000000
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'f7a2c9e3d456'
down_revision: str | None = 'e13d86e42168'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    lease_status = sa.Enum('DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'TERMINATED', 'EXPIRED', name='leasestatus')

    block_type = sa.Enum('PRIVATE', 'SHARED', 'DORMITORY', 'OTHER', name='blocktype')

    invoice_status = sa.Enum('OPEN', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID', name='invoicestatus')

    charge_type = sa.Enum('RENT', 'DEPOSIT', 'UTILITY', 'LATE_FEE', 'OTHER', name='chargetype')

    maintenance_status = sa.Enum('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', name='maintenancestatus')

    maintenance_category = sa.Enum('PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'PEST_CONTROL', 'APPLIANCE', 'OTHER', name='maintenancecategory')

    op.create_table('rooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('house_id', sa.Integer(), nullable=False),
        sa.Column('room_number', sa.String(length=50), nullable=False),
        sa.Column('block_type', block_type, nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('is_available', sa.Boolean(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['house_id'], ['houses.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_rooms_house_id', 'rooms', ['house_id'])

    op.create_table('leases',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('occupancy_id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('house_id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=True),
        sa.Column('status', lease_status, nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rent_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('deposit_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('deposit_paid', sa.Boolean(), nullable=False),
        sa.Column('billing_day', sa.Integer(), nullable=False),
        sa.Column('late_fee_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('signed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('signed_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('terminated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id']),
        sa.ForeignKeyConstraint(['house_id'], ['houses.id']),
        sa.ForeignKeyConstraint(['occupancy_id'], ['occupancies.id']),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id']),
        sa.ForeignKeyConstraint(['signed_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_leases_occupancy_id', 'leases', ['occupancy_id'])
    op.create_index('ix_leases_employee_id', 'leases', ['employee_id'])

    op.create_table('invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lease_id', sa.Integer(), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('paid_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('late_fee_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('status', invoice_status, nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lease_id'], ['leases.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_invoices_lease_id', 'invoices', ['lease_id'])

    op.create_table('charges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=False),
        sa.Column('charge_type', charge_type, nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_charges_invoice_id', 'charges', ['invoice_id'])

    op.create_table('maintenance_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('house_id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=True),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('reported_by_id', sa.Integer(), nullable=True),
        sa.Column('category', maintenance_category, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('status', maintenance_status, nullable=False),
        sa.Column('assigned_to_id', sa.Integer(), nullable=True),
        sa.Column('assigned_by_id', sa.Integer(), nullable=True),
        sa.Column('resolution_note', sa.Text(), nullable=True),
        sa.Column('photos', sa.Text(), nullable=True),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['assigned_by_id'], ['users.id']),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id']),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id']),
        sa.ForeignKeyConstraint(['house_id'], ['houses.id']),
        sa.ForeignKeyConstraint(['reported_by_id'], ['users.id']),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_maintenance_requests_house_id', 'maintenance_requests', ['house_id'])
    op.create_index('ix_maintenance_requests_employee_id', 'maintenance_requests', ['employee_id'])

    op.add_column('applications', sa.Column('review_note', sa.Text(), nullable=True))
    op.add_column('applications', sa.Column('reviewed_by_id', sa.Integer(), nullable=True))
    op.add_column('applications', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key('fk_applications_reviewed_by_id', 'applications', 'users', ['reviewed_by_id'], ['id'])

    op.add_column('payments', sa.Column('invoice_id', sa.Integer(), nullable=True))
    payment_method = sa.Enum('CASH', 'EFT', 'CARD', 'PAYROLL_DEDUCTION', name='paymentmethod')
    payment_method.create(op.get_bind(), checkfirst=True)
    op.add_column('payments', sa.Column('method', payment_method, nullable=False, server_default='CASH'))
    op.create_index('ix_payments_invoice_id', 'payments', ['invoice_id'])
    op.create_foreign_key('fk_payments_invoice_id', 'payments', 'invoices', ['invoice_id'], ['id'])

    op.add_column('occupancies', sa.Column('room_id', sa.Integer(), nullable=True))
    op.add_column('occupancies', sa.Column('lease_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_occupancies_room_id', 'occupancies', 'rooms', ['room_id'], ['id'])
    op.create_foreign_key('fk_occupancies_lease_id', 'occupancies', 'leases', ['lease_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_occupancies_lease_id', 'occupancies', type_='foreignkey')
    op.drop_constraint('fk_occupancies_room_id', 'occupancies', type_='foreignkey')
    op.drop_column('occupancies', 'lease_id')
    op.drop_column('occupancies', 'room_id')

    op.drop_constraint('fk_payments_invoice_id', 'payments', type_='foreignkey')
    op.drop_index('ix_payments_invoice_id', 'payments')
    op.drop_column('payments', 'method')
    op.drop_column('payments', 'invoice_id')
    sa.Enum(name='paymentmethod').drop(op.get_bind(), checkfirst=True)

    op.drop_constraint('fk_applications_reviewed_by_id', 'applications', type_='foreignkey')
    op.drop_column('applications', 'reviewed_at')
    op.drop_column('applications', 'reviewed_by_id')
    op.drop_column('applications', 'review_note')

    op.drop_table('maintenance_requests')
    sa.Enum(name='maintenancecategory').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='maintenancestatus').drop(op.get_bind(), checkfirst=True)

    op.drop_table('charges')
    op.drop_table('invoices')
    sa.Enum(name='invoicestatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='chargetype').drop(op.get_bind(), checkfirst=True)

    op.drop_table('leases')
    sa.Enum(name='leasestatus').drop(op.get_bind(), checkfirst=True)

    op.drop_table('rooms')
    sa.Enum(name='blocktype').drop(op.get_bind(), checkfirst=True)
