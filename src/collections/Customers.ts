import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: {
    singular: '👤 Customer',
    plural: '👥 Customers',
  },
  admin: {
    group: 'Bakery Management',
    useAsTitle: 'phone',
    defaultColumns: ['phone', 'name', 'email', 'createdAt'],
    description: 'Registered bakery customers and their saved delivery addresses.',
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Customer 10-digit mobile number (e.g. 9876543210).',
      },
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Customer Full Name.',
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Customer Email address for receipts & order notifications.',
      },
    },
    {
      name: 'addresses',
      type: 'array',
      label: 'Saved Delivery Addresses',
      labels: {
        singular: 'Delivery Address',
        plural: 'Delivery Addresses',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'select',
              defaultValue: 'Home',
              options: [
                { label: '🏠 Home', value: 'Home' },
                { label: '🏢 Work / Office', value: 'Work' },
                { label: '📍 Other', value: 'Other' },
              ],
              admin: { width: '30%' },
            },
            {
              name: 'recipientName',
              type: 'text',
              required: true,
              label: 'Recipient Name',
              admin: { width: '35%' },
            },
            {
              name: 'phone',
              type: 'text',
              required: true,
              label: 'Contact Phone',
              admin: { width: '35%' },
            },
          ],
        },
        {
          name: 'addressLine1',
          type: 'textarea',
          required: true,
          label: 'House No., Building, Street / Area',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'landmark',
              type: 'text',
              label: 'Landmark (Optional)',
              admin: { width: '40%' },
            },
            {
              name: 'pincode',
              type: 'text',
              required: true,
              label: 'Pincode',
              admin: { width: '30%' },
            },
            {
              name: 'city',
              type: 'text',
              defaultValue: 'Samalkot',
              label: 'City / Town',
              admin: { width: '30%' },
            },
          ],
        },
        {
          name: 'isDefault',
          type: 'checkbox',
          defaultValue: false,
          label: 'Set as Default Address',
        },
      ],
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
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Customer mobile number verified via OTP.',
      },
    },
    {
      name: 'passwordHash',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'passwordSalt',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
  ],
}
