
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | undefined;

export async function initializeDatabase() {
  try {
    db = await SQLite.openDatabaseAsync('patients.db');

    await db.execAsync(`
        -- Create the patients table if it doesn't already exist
      
       CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientName TEXT NOT NULL,
        age INTEGER,
        gender TEXT CHECK( gender IN ('Male','Female','Other') ) NOT NULL,
        registrationNumber TEXT UNIQUE NOT NULL,
        location TEXT CHECK( location IN ('Emergency', 'ICU', 'HDU', 'Ward Male', 'Ward Female', 'Other') ),
        bedNumber INTEGER,
        chiefComplaints TEXT,
        provisionalDiagnosis TEXT,
        miscNotes TEXT,
        reg_date TEXT DEFAULT (date('now')),   -- Store current date only,
        contact TEXT NOT NULL,
        is_discharged INTEGER NOT NULL CHECK (is_discharged IN (0, 1)) DEFAULT 0 -- 0 is False, 1 is True
      );

      -- Create the tasks table if it doesn't already exist
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registrationNumber TEXT NOT NULL,
        lab_type TEXT CHECK( lab_type IN ('blood','urine','miscellanous') ),
        lab_subtype TEXT,
        date_and_time TEXT DEFAULT (datetime('now')),   -- Store current datetime
        imaging_type TEXT CHECK( imaging_type IN ('X-RAY','CT','MRI','USG') ),
        imaging_subtype TEXT,
        task_status TEXT CHECK( task_status IN ('unsent','sent','collected') ) DEFAULT 'unsent'
      );

      -- Create the tasks table if it doesn't already exist
      CREATE TABLE IF NOT EXISTS oldlabs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registrationNumber TEXT NOT NULL,
        lab_type TEXT CHECK( lab_type IN ('blood','urine','miscellanous') ),
        lab_subtype TEXT,
        date_and_time TEXT DEFAULT (datetime('now')),   -- Store current datetime
        imaging_type TEXT CHECK( imaging_type IN ('X-RAY','CT','MRI','USG') ),
        imaging_subtype TEXT
      );

      CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registrationNumber TEXT NOT NULL,
        consult TEXT,
        date_and_time TEXT DEFAULT (datetime('now')),
        task_status TEXT CHECK( task_status IN ('unsent','sent','collected') ) DEFAULT 'unsent'
      );
      

      CREATE TABLE IF NOT EXISTS oldconsultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registrationNumber TEXT NOT NULL,
        consult TEXT,
        date_and_time TEXT DEFAULT (datetime('now')),
        task_status TEXT CHECK( task_status IN ('unsent','sent','collected') ) DEFAULT 'unsent'
      );
    `);

    console.log('Tables created (or already exist).');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export function getDatabase(): SQLite.SQLiteDatabase | undefined {
  if (!db) {
    console.warn('Database has not been initialized yet.');
  }
  return db;
}
