import { GlobalConfig } from 'payload'

export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  label: '⚙️ Store & Payment Settings',
  admin: {
    group: 'Storefront',
    description: 'Configure store contact details, announcement bar, online payment gateway, and delivery partner settings.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: '🏪 Bakery Info & Announcement',
          fields: [
            { name: 'storeName', type: 'text', defaultValue: 'Flavourite Cafe & Bakery', admin: { description: 'Store Name' } },
            { name: 'contactEmail', type: 'text', defaultValue: 'flavouritefood@gmail.com', admin: { description: 'Customer support email' } },
            { name: 'phoneSupport', type: 'text', defaultValue: '+91 70132 05977', admin: { description: 'Support phone number displayed in header/footer.' } },
            { name: 'fssaiNumber', type: 'text', admin: { description: 'FSSAI Food License / Registration Number (e.g. 1012XXXXXXXXXX). Displayed in footer for legal food safety compliance.' } },
            { name: 'businessAddress', type: 'textarea', defaultValue: 'Main Road, Samalkot, Kakinada District, Andhra Pradesh - 533440', admin: { description: 'Bakery kitchen address' } },
            { 
              name: 'announcementBarText', 
              type: 'text', 
              defaultValue: '🌿 100% Vegetarian Artisanal Goodies • Handcrafted in Samalkot • Pan-India Courier Available!',
              admin: { description: 'Top announcement message displayed on the very top bar of the storefront.' } 
            },
            { name: 'announcementBarActive', type: 'checkbox', defaultValue: true, admin: { description: 'Enable top announcement banner on storefront.' } },
          ],
        },
        {
          label: '🧭 Header Navigation Bar',
          fields: [
            {
              name: 'headerNav',
              type: 'array',
              label: 'Menu Links',
              labels: {
                singular: 'Menu Link',
                plural: 'Menu Links',
              },
              admin: {
                description: 'Manage the top menu tabs. Mom can drag to re-order, rename, or add category links (e.g. Chocolates, Hampers, Brownies, Festive Specials). Leave empty to use standard defaults.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      label: 'Menu Label',
                      admin: {
                        width: '40%',
                        description: 'e.g. Chocolates, Gift Hampers, Brownies, Bestsellers',
                      },
                    },
                    {
                      name: 'link',
                      type: 'text',
                      required: true,
                      label: 'Link / Destination',
                      admin: {
                        width: '40%',
                        description: 'e.g. /shop?category=chocolates, /shop, /about, /track-order',
                      },
                    },
                    {
                      name: 'isActive',
                      type: 'checkbox',
                      defaultValue: true,
                      label: 'Show in Menu',
                      admin: {
                        width: '20%',
                      },
                    },
                  ],
                },
                {
                  name: 'badge',
                  type: 'text',
                  label: 'Optional Highlight Badge',
                  admin: {
                    description: 'Small highlight tag next to text (e.g. "New", "Hot", "Festive", "Diwali")',
                  },
                },
              ],
            },
          ],
        },
        {
          label: '💳 Payment & Delivery Charges',
          fields: [
            { 
              name: 'whatsappNumber', 
              type: 'text', 
              required: true,
              defaultValue: '917013205977', 
              admin: { description: 'Bakery WhatsApp phone number with country code (e.g. 917013205977).' } 
            },
            {
              name: 'upiId',
              type: 'text',
              defaultValue: '7013205977@upi',
              admin: { description: 'Bakery UPI ID (e.g. 7013205977@upi).' }
            },
            {
              name: 'razorpayKeyId',
              type: 'text',
              admin: { description: 'Payment Gateway Key ID (Public API Key for online payments).' }
            },
            {
              name: 'razorpayKeySecret',
              type: 'text',
              admin: { description: 'Payment Gateway Key Secret (Private API Secret Key).' }
            },
            { 
              name: 'taxRate', 
              type: 'number', 
              defaultValue: 5, 
              admin: { description: 'GST percentage (e.g. 5 for 5%).' } 
            },
            { 
              name: 'shippingFlatRate', 
              type: 'number', 
              defaultValue: 50,
              admin: { description: 'Standard flat delivery fee in ₹.' }
            },
            { 
              name: 'freeShippingThreshold', 
              type: 'number', 
              defaultValue: 500,
              admin: { description: 'Minimum order amount in ₹ for free delivery (e.g. 500).' }
            },
            {
              name: 'restrictPincodes',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Restrict local bakery delivery to serviceable Samalkot & Kakinada region pincodes.' }
            },
            {
              name: 'serviceablePincodePrefixes',
              type: 'text',
              defaultValue: '533',
              admin: { description: 'Allowed pincode prefixes (e.g. 533 for Samalkot, Kakinada, Peddapuram & nearby) or comma-separated list of pincodes.' }
            },
            {
              name: 'sameDayCutoffHour',
              type: 'number',
              defaultValue: 18,
              admin: { description: 'Cutoff hour for same-day delivery (24h format, e.g. 18 for 6:00 PM). Past this hour, same-day delivery is restricted to next-day.' }
            },
          ],
        },
        {
          label: '✉️ Automated Email Notifications (Free)',
          fields: [
            {
              name: 'enableOrderEmails',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Automatically send HTML order confirmation emails to customers and store staff.' }
            },
            {
              name: 'resendApiKey',
              type: 'text',
              admin: { description: 'Optional: Resend API Key (re_...) from resend.com for 3,000 free emails/month. Leave blank to log to console.' }
            },
            {
              name: 'fromEmail',
              type: 'text',
              defaultValue: 'Flavourite Bakery <onboarding@resend.dev>',
              admin: { description: 'Sender email address (e.g. orders@flavouritefood.com or onboarding@resend.dev)' }
            },
            {
              name: 'staffNotificationEmail',
              type: 'text',
              defaultValue: 'flavouritefood@gmail.com',
              admin: { description: 'Bakery kitchen email to receive new order alerts.' }
            },
          ],
        },
        {
          label: '🚚 Delivery & Courier Partner',
          fields: [
            {
              name: 'shiprocketAutoPush',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Automatically push every paid order to delivery partner immediately upon payment verification.',
              },
            },
            {
              name: 'shiprocketEmail',
              type: 'text',
              admin: {
                description: 'Courier Partner API User Email / Client ID.',
              },
            },
            {
              name: 'shiprocketPassword',
              type: 'text',
              admin: {
                description: 'Courier Partner API User Password / Secret.',
              },
            },
            {
              name: 'shiprocketPickupLocation',
              type: 'text',
              defaultValue: 'Primary',
              admin: {
                description: 'Kitchen Pickup Location name registered with delivery partner.',
              },
            },
            {
              name: 'shiprocketDefaultWeight',
              type: 'number',
              defaultValue: 0.5,
              admin: {
                description: 'Default package weight in kilograms (e.g. 0.5 for 500g).',
              },
            },
          ],
        },
        {
          label: '📱 Social Links',
          fields: [
            { name: 'instagramUrl', type: 'text', admin: { description: 'Instagram profile URL' } },
            { name: 'facebookUrl', type: 'text', admin: { description: 'Facebook page URL' } },
          ],
        },
        {
          label: '🔐 Admin Phone Access & Registration',
          fields: [
            {
              name: 'adminRegistrationMode',
              type: 'select',
              defaultValue: 'open',
              label: 'Admin Account Registration Mode',
              options: [
                { 
                  label: '🟢 Open Registration — Anyone with valid OTP can create an admin account (Active for Mom & You now)', 
                  value: 'open' 
                },
                { 
                  label: '🟡 Require Manual Approval — New admins can register with OTP, but stay pending until approved in Staff & Admins', 
                  value: 'require_approval' 
                },
                { 
                  label: '🔒 Closed / Login Only — Only existing / pre-approved admins can log in via OTP', 
                  value: 'closed' 
                },
              ],
              admin: {
                description: 'Set to "Open Registration" now so Mom can create her account. Switch to "Closed / Login Only" or "Require Manual Approval" once both of you have registered.',
              },
            },
            {
              name: 'adminWhitelistPhones',
              type: 'text',
              label: 'Auto-Approved Phone Whitelist (Optional)',
              admin: {
                description: 'Comma-separated 10-digit mobile numbers that are ALWAYS auto-approved even if registration is closed or requires approval (e.g. 7013205977, 9876543210).',
              },
            },
          ],
        },
      ],
    },
  ],
}
