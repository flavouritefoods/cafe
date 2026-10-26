import { createClient } from '@libsql/client'
import path from 'path'
import fs from 'fs'

export async function syncLocalDbToRemote(targetUrl: string, authToken?: string) {
  const localDbPath = path.resolve(process.cwd(), 'payload.db')
  if (!fs.existsSync(localDbPath)) {
    return { success: false, error: 'Local payload.db file not found on disk' }
  }

  const local = createClient({ url: `file:${localDbPath}` })
  const target = createClient({ url: targetUrl, authToken })

  // Check connection to target
  try {
    await target.execute('SELECT 1')
  } catch (err: any) {
    return { success: false, error: `Could not connect to target database: ${err?.message}` }
  }

  // 1. Get all tables and indexes DDL from local
  const schemaRes = await local.execute(`
    SELECT type, name, tbl_name, sql 
    FROM sqlite_master 
    WHERE sql IS NOT NULL 
      AND name NOT LIKE 'sqlite_%' 
      AND name NOT LIKE '_litestream%'
    ORDER BY CASE WHEN type='table' THEN 1 ELSE 2 END
  `)

  // Create tables and indexes
  for (const row of schemaRes.rows) {
    const sql = String(row.sql)
    try {
      await target.execute(sql)
    } catch (createErr: any) {
      if (!createErr?.message?.includes('already exists')) {
        console.warn(`DDL note for ${row.name}:`, createErr?.message)
      }
    }
  }

  // Check for any newly added columns in existing tables and ALTER TABLE on remote
  const tableRows = schemaRes.rows.filter((r) => r.type === 'table')
  for (const table of tableRows) {
    const tableName = String(table.name)
    try {
      const localColsRes = await local.execute(`PRAGMA table_info("${tableName}")`)
      const remoteColsRes = await target.execute(`PRAGMA table_info("${tableName}")`)
      const remoteColNames = new Set(remoteColsRes.rows.map((r) => String(r.name)))

      for (const colRow of localColsRes.rows) {
        const colName = String(colRow.name)
        if (!remoteColNames.has(colName)) {
          const colType = String(colRow.type || 'TEXT')
          try {
            await target.execute(`ALTER TABLE "${tableName}" ADD COLUMN "${colName}" ${colType}`)
            console.log(`[SYNC] Added column ${colName} (${colType}) to remote table ${tableName}`)
          } catch (alterErr: any) {
            console.warn(`[SYNC] Alter note for ${tableName}.${colName}:`, alterErr?.message)
          }
        }
      }
    } catch (colErr: any) {
      console.warn(`[SYNC] Column check note for ${tableName}:`, colErr?.message)
    }
  }

  // Disable FK constraints during bulk data import
  try {
    await target.execute('PRAGMA foreign_keys = OFF')
  } catch {}

  const summary: string[] = []

  // 2. Copy data for each table
  for (const table of tableRows) {
    const tableName = String(table.name)
    try {
      const dataRes = await local.execute(`SELECT * FROM "${tableName}"`)
      if (dataRes.rows.length === 0) continue

      const columns = dataRes.columns
      const colNames = columns.map((c) => `"${c}"`).join(', ')
      const placeholders = columns.map(() => '?').join(', ')
      const insertSql = `INSERT OR REPLACE INTO "${tableName}" (${colNames}) VALUES (${placeholders})`

      for (const row of dataRes.rows) {
        const values = columns.map((col) => row[col])
        await target.execute({ sql: insertSql, args: values })
      }

      summary.push(`${tableName} (${dataRes.rows.length} rows)`)
    } catch (dataErr: any) {
      console.warn(`Data copy note for ${tableName}:`, dataErr?.message)
    }
  }

  try {
    await target.execute('PRAGMA foreign_keys = ON')
  } catch {}

  local.close()
  target.close()

  return {
    success: true,
    message: 'Database tables and bakery data synchronized successfully!',
    summary,
  }
}
