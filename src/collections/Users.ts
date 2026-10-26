import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: '👤 Staff & Admin',
    plural: '👥 Staff & Admins',
  },
  admin: {
    group: 'Settings',
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'email', 'role', 'status'],
    description: 'Manage admin logins, kitchen staff, and mobile OTP access.',
  },
  access: {
    // Only approved users can access admin
    admin: ({ req }) => {
      if (!req.user) return false
      // If status is not set (e.g. legacy user), allow, otherwise check approved
      return !req.user.status || req.user.status === 'approved'
    },
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Staff / Admin Name',
      required: true,
      admin: {
        description: 'Name or role of this user (e.g. Mom, Vihari, Bakery Manager)',
      },
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Mobile Number (10 Digits)',
      index: true,
      admin: {
        description: 'Used for password-free Mobile OTP login at /admin-login.',
      },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'admin',
      options: [
        { label: '👑 Store Admin (Full Access)', value: 'admin' },
        { label: '👨‍🍳 Kitchen Staff (Orders & Delivery Only)', value: 'staff' },
      ],
      admin: {
        description: 'User permission level.',
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
        description: 'Only "Approved" users can access the Admin Dashboard.',
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
