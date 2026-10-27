const { createClient } = require('@libsql/client')
const path = require('path')

async function migrate() {
  const localDb = path.resolve(__dirname, '../payload.db')
  const local = createClient({ url: `file:${localDb}` })

  console.log('Running local schema migrations...')

  const statements = [
    `CREATE TABLE IF NOT EXISTS store_settings_hero_banners (
      _order integer not null,
      _parent_id integer not null,
      id text primary key not null,
      title text not null,
      description text,
      button_text text,
      button_link text,
      image_id text,
      color_theme text default '#FDFBF7',
      is_active integer default 1
    )`,
    `CREATE INDEX IF NOT EXISTS store_settings_hero_banners_order_idx ON store_settings_hero_banners (_order)`,
    `CREATE INDEX IF NOT EXISTS store_settings_hero_banners_parent_idx ON store_settings_hero_banners (_parent_id)`,

    `CREATE TABLE IF NOT EXISTS orders_audit_log (
      _order integer not null,
      _parent_id integer not null,
      id text primary key not null,
      edited_by text,
      edited_at text,
      role text,
      reason text,
      changes text
    )`,
    `CREATE INDEX IF NOT EXISTS orders_audit_log_order_idx ON orders_audit_log (_order)`,
    `CREATE INDEX IF NOT EXISTS orders_audit_log_parent_idx ON orders_audit_log (_parent_id)`,
  ]

  for (const sql of statements) {
    try {
      await local.execute(sql)
      console.log('Executed:', sql.split('\n')[0])
    } catch (e) {
      console.warn('Local note:', e.message)
    }
  }

  // Add columns to orders if not existing
  const orderCols = [
    { name: 'is_locked', type: 'integer default 1' },
    { name: 'last_edit_reason', type: 'text' },
  ]

  for (const col of orderCols) {
    try {
      await local.execute(`ALTER TABLE orders ADD COLUMN "${col.name}" ${col.type}`)
      console.log(`Added column ${col.name} to orders`)
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.warn(`Column note for orders.${col.name}:`, e.message)
      }
    }
  }

  console.log('Local schema migration complete!')
}

migrate().catch(console.error)
