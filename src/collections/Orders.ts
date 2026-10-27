import { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: '📦 Order',
    plural: '📦 Orders & Deliveries',
  },
  admin: {
    group: 'Bakery Kitchen',
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerName', 'total', 'orderStatus', 'paymentStatus', 'createdAt'],
    description: '📋 Track incoming bakery orders, update oven baking status, and organize delivery packing.',
  },
  access: {
    create: () => true, // Customers can submit orders via checkout API
    read: () => true,
    update: ({ req: { user } }) => Boolean(user), // Authenticated staff only
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        if (operation === 'update' && originalDoc) {
          const changes: string[] = []

          // Detect status changes
          if (data.orderStatus && data.orderStatus !== originalDoc.orderStatus) {
            changes.push(`Order Status: "${originalDoc.orderStatus}" → "${data.orderStatus}"`)
          }
          if (data.paymentStatus && data.paymentStatus !== originalDoc.paymentStatus) {
            changes.push(`Payment Status: "${originalDoc.paymentStatus}" → "${data.paymentStatus}"`)
          }

          // Detect billing changes
          if (data.total !== undefined && Number(data.total) !== Number(originalDoc.total)) {
            changes.push(`Grand Total: ₹${originalDoc.total} → ₹${data.total}`)
          }
          if (data.subtotal !== undefined && Number(data.subtotal) !== Number(originalDoc.subtotal)) {
            changes.push(`Subtotal: ₹${originalDoc.subtotal} → ₹${data.subtotal}`)
          }
          if (data.shipping !== undefined && Number(data.shipping) !== Number(originalDoc.shipping)) {
            changes.push(`Delivery Fee: ₹${originalDoc.shipping} → ₹${data.shipping}`)
          }

          // Detect customer & delivery details changes
          if (data.customerName && data.customerName !== originalDoc.customerName) {
            changes.push(`Customer Name: "${originalDoc.customerName}" → "${data.customerName}"`)
          }
          if (data.customerPhone && data.customerPhone !== originalDoc.customerPhone) {
            changes.push(`Customer Phone: "${originalDoc.customerPhone}" → "${data.customerPhone}"`)
          }
          if (data.customerEmail && data.customerEmail !== originalDoc.customerEmail) {
            changes.push(`Customer Email: "${originalDoc.customerEmail}" → "${data.customerEmail}"`)
          }
          if (data.deliveryAddress && data.deliveryAddress !== originalDoc.deliveryAddress) {
            changes.push(`Delivery Address updated`)
          }
          if (data.pincode && data.pincode !== originalDoc.pincode) {
            changes.push(`Pincode: "${originalDoc.pincode}" → "${data.pincode}"`)
          }
          if (data.deliverySlot && data.deliverySlot !== originalDoc.deliverySlot) {
            changes.push(`Delivery Slot: "${originalDoc.deliverySlot}" → "${data.deliverySlot}"`)
          }
          if (data.deliveryDate && data.deliveryDate !== originalDoc.deliveryDate) {
            changes.push(`Delivery Date: "${originalDoc.deliveryDate}" → "${data.deliveryDate}"`)
          }

          // Detect courier tracking updates
          if (data.courierName && data.courierName !== originalDoc.courierName) {
            changes.push(`Courier: "${originalDoc.courierName || 'None'}" → "${data.courierName}"`)
          }
          if (data.awbCode && data.awbCode !== originalDoc.awbCode) {
            changes.push(`AWB Tracking Code: "${originalDoc.awbCode || 'None'}" → "${data.awbCode}"`)
          }
          if (data.trackingUrl && data.trackingUrl !== originalDoc.trackingUrl) {
            changes.push(`Tracking URL updated`)
          }

          // Detect notes updates
          if (data.adminNotes !== undefined && data.adminNotes !== originalDoc.adminNotes) {
            changes.push(`Kitchen Admin Notes modified`)
          }
          if (data.specialInstructions !== undefined && data.specialInstructions !== originalDoc.specialInstructions) {
            changes.push(`Customer Special Instructions modified`)
          }

          // Record audit log entry if any meaningful change was made
          if (changes.length > 0) {
            const userName = req?.user?.name || req?.user?.email || 'Authorized Staff'
            const userEmail = req?.user?.email || 'system'
            const userRole = (req?.user as any)?.role === 'admin' ? '👑 Administrator' : '👨‍🍳 Staff'

            const now = new Date()
            const dateStr = now.toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              dateStyle: 'medium',
              timeStyle: 'short',
            })

            const logEntry = {
              editedBy: `${userName} (${userEmail})`,
              editedAt: `${dateStr} IST`,
              role: userRole,
              reason: data.lastEditReason?.trim() || 'Direct order details update',
              changes: changes.join('\n• '),
            }

            const existingHistory = Array.isArray(originalDoc.auditLog) ? originalDoc.auditLog : []
            data.auditLog = [logEntry, ...existingHistory]
          }

          // Automatically lock the order back in protected mode after saving
          data.isLocked = true
          data.lastEditReason = ''
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'orderLockControls',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/OrderLockBanner#OrderLockBanner',
        },
      },
    },
    {
      name: 'isLocked',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'lastEditReason',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      index: true,
      validate: async (val: unknown, { req, id }: { req?: any; id?: string | number } = {}) => {
        if (!val || typeof val !== 'string') return 'Order number is required'
        if (!req?.payload) return true
        try {
          const existing = await req.payload.find({
            collection: 'orders',
            where: {
              orderNumber: { equals: val },
              ...(id ? { id: { not_equals: id } } : {}),
            },
            limit: 1,
          })
          if (existing?.docs?.length > 0) return 'An order with this order number already exists.'
        } catch {
          return true
        }
        return true
      },
      admin: {
        description: 'Auto-generated unique Order ID (e.g. FLV-1001)',
        readOnly: true,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'orderStatus',
          type: 'select',
          defaultValue: 'new',
          options: [
            { label: '🆕 New Order (Received)', value: 'new' },
            { label: '✅ Confirmed', value: 'confirmed' },
            { label: '🧁 In the Oven / Baking', value: 'preparing' },
            { label: '🛵 Out for Delivery (Rider Dispatched)', value: 'out_for_delivery' },
            { label: '🎉 Delivered Successfully', value: 'delivered' },
            { label: '❌ Cancelled', value: 'cancelled' },
          ],
          admin: {
            width: '50%',
            description: '👉 Change status as you prepare and dispatch the order.',
          },
        },
        {
          name: 'paymentStatus',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: '⏳ Pending Payment', value: 'pending' },
            { label: '💳 Paid (Online Payment)', value: 'paid_razorpay' },
            { label: '📱 Paid (UPI / WhatsApp)', value: 'paid_upi' },
            { label: '💵 Cash on Delivery', value: 'paid_cod' },
            { label: '↩️ Refunded', value: 'refunded' },
          ],
          admin: {
            width: '50%',
            description: 'Payment verification status.',
          },
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: '🍰 What to Bake & Pack',
          description: 'Items ordered and special instructions for the kitchen.',
          fields: [
            {
              name: 'specialInstructions',
              type: 'textarea',
              admin: {
                description: '⚠️ Special cake messages, custom notes, or dietary preferences requested by the customer (e.g. "Write Happy Birthday Rohit", "Eggless only").',
              },
            },
            {
              name: 'items',
              type: 'array',
              required: true,
              labels: {
                singular: 'Item',
                plural: 'Ordered Items',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true, admin: { width: '40%', description: 'Product' } },
                    { name: 'variantName', type: 'text', admin: { width: '25%', description: 'Size / Flavour' } },
                    { name: 'quantity', type: 'number', required: true, admin: { width: '15%', description: 'Qty' } },
                    { name: 'price', type: 'number', required: true, admin: { width: '20%', description: 'Price (₹)' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: '📍 Customer & Delivery',
          description: 'Customer contact info, delivery address, date, and time slot.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'customerName',
                  type: 'text',
                  required: true,
                  admin: { width: '50%', description: 'Customer Name' },
                },
                {
                  name: 'customerPhone',
                  type: 'text',
                  required: true,
                  admin: { width: '50%', description: 'Phone Number (for call or WhatsApp)' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'deliveryDate',
                  type: 'date',
                  admin: {
                    width: '50%',
                    description: '📅 Requested Delivery Date',
                  },
                },
                {
                  name: 'deliverySlot',
                  type: 'select',
                  options: [
                    { label: '🌅 Morning (10:00 AM - 1:00 PM)', value: 'morning' },
                    { label: '☀️ Afternoon (1:00 PM - 5:00 PM)', value: 'afternoon' },
                    { label: '🌙 Evening (5:00 PM - 9:00 PM)', value: 'evening' },
                    { label: '⚡ ASAP / Standard Delivery', value: 'asap' },
                  ],
                  defaultValue: 'asap',
                  admin: {
                    width: '50%',
                    description: '⏰ Requested Time Slot',
                  },
                },
              ],
            },
            {
              name: 'deliveryAddress',
              type: 'textarea',
              required: true,
              admin: { description: 'Complete street address, apartment / flat number' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'landmark',
                  type: 'text',
                  admin: { width: '34%', description: 'Landmark' },
                },
                {
                  name: 'city',
                  type: 'text',
                  defaultValue: 'Samalkot',
                  admin: { width: '33%', description: 'City' },
                },
                {
                  name: 'state',
                  type: 'text',
                  defaultValue: 'Andhra Pradesh',
                  admin: { width: '33%', description: 'State' },
                },
              ],
            },
            {
              name: 'pincode',
              type: 'text',
              required: true,
              admin: { description: 'Pincode (6 digits)' },
            },
            {
              name: 'customerEmail',
              type: 'email',
              admin: { description: 'Customer Email (for automated invoice & updates)' },
            },
          ],
        },
        {
          label: '💰 Billing & Payment',
          description: 'Payment breakdown and transaction references.',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'subtotal', type: 'number', required: true, admin: { width: '25%', description: 'Subtotal (₹)' } },
                { name: 'tax', type: 'number', defaultValue: 0, admin: { width: '25%', description: 'GST (₹)' } },
                { name: 'shipping', type: 'number', defaultValue: 0, admin: { width: '25%', description: 'Delivery (₹)' } },
                { name: 'total', type: 'number', required: true, admin: { width: '25%', description: 'Grand Total (₹)' } },
              ],
            },
            {
              name: 'paymentMethod',
              type: 'select',
              defaultValue: 'razorpay',
              options: [
                { label: 'Online Payment (UPI / Cards / Netbanking)', value: 'razorpay' },
                { label: 'Cash on Delivery', value: 'cod' },
                { label: 'Direct UPI / WhatsApp', value: 'upi_whatsapp' },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'razorpayOrderId',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'Online Payment Order / Reference ID',
                  },
                },
                {
                  name: 'razorpayPaymentId',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'Payment Receipt / Reference ID',
                  },
                },
              ],
            },
          ],
        },
        {
          label: '🚚 Delivery & Courier',
          description: 'Courier partner dispatch, driver tracking, and delivery status.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'courierName',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'Assigned Courier (e.g. BlueDart, Delhivery, Dunzo, Shadowfax)',
                  },
                },
                {
                  name: 'awbCode',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'Courier Tracking / AWB Code',
                  },
                },
              ],
            },
            {
              name: 'trackingUrl',
              type: 'text',
              admin: {
                description: 'Live Courier Tracking Link',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'shiprocketOrderId',
                  type: 'text',
                  admin: {
                    width: '33%',
                    description: 'Courier Reference / Order ID',
                  },
                },
                {
                  name: 'shiprocketShipmentId',
                  type: 'text',
                  admin: {
                    width: '33%',
                    description: 'Courier Shipment ID',
                  },
                },
                {
                  name: 'shiprocketStatus',
                  type: 'text',
                  admin: {
                    width: '34%',
                    description: 'Delivery Partner Status',
                  },
                },
              ],
            },
          ],
        },
        {
          label: '📝 Kitchen Notes',
          description: 'Private bakery notes and reminders.',
          fields: [
            {
              name: 'adminNotes',
              type: 'textarea',
              admin: {
                description: 'Private kitchen reminders (e.g. "Sent with Dunzo runner Suresh", "Customer called to request 4pm delivery").',
              },
            },
          ],
        },
        {
          label: '📜 Order Audit & Activity Log',
          description: 'Traceable history of all staff edits, status updates, and notes with timestamps and staff names.',
          fields: [
            {
              name: 'auditLog',
              type: 'array',
              label: 'Audit & Edit History Entries',
              labels: {
                singular: 'Edit Entry',
                plural: 'Edit Entries',
              },
              admin: {
                readOnly: true,
                description: 'Chronological activity log recorded automatically whenever an order is unlocked and updated by staff.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'editedBy', type: 'text', admin: { width: '40%', description: 'Staff Name & Email' } },
                    { name: 'editedAt', type: 'text', admin: { width: '30%', description: 'Date & Time' } },
                    { name: 'role', type: 'text', admin: { width: '30%', description: 'Role' } },
                  ],
                },
                {
                  name: 'reason',
                  type: 'text',
                  admin: { description: 'Reason for edit' },
                },
                {
                  name: 'changes',
                  type: 'textarea',
                  admin: { description: 'Specific fields changed' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
