import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: '👤 Staff & Administrator',
    plural: '👥 Staff & Admins',
  },
  admin: {
    group: 'Settings',
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'email', 'role', 'status'],
    description: 'Manage staff and administrator accounts, roles, and access approval.',
  },
  access: {
    // Only approved users can access the administration dashboard
    admin: ({ req }) => {
      if (!req.user) return false
      return !req.user.status || req.user.status === 'approved'
    },
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Full Name',
      required: true,
      admin: {
        description: 'Full name of the staff member or administrator.',
      },
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Mobile Number',
      index: true,
      admin: {
        description: '10-digit mobile number for password-free OTP login.',
      },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'admin',
      options: [
        { label: '👑 Administrator (Full Store Access)', value: 'admin' },
        { label: '👨‍🍳 Staff Member (Orders & Fulfillment Only)', value: 'staff' },
      ],
      admin: {
        description: 'Access permissions level for this account.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'approved',
      options: [
        { label: '✅ Approved (Active Access)', value: 'approved' },
        { label: '⏳ Pending Approval', value: 'pending' },
        { label: '🚫 Suspended', value: 'suspended' },
      ],
      admin: {
        description: 'Only accounts marked as "Approved" have active access to the administration panel.',
      },
    },
    {
      name: 'otp',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'otpExpiresAt',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
  ],
}
