
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SQLite from 'expo-sqlite';
import { initializeDatabase, getDatabase } from '../database/database';
import DrizzleStudio from '../components/DrizzleStudio'; // Adjust the path as necessary

interface DatabaseContextProps {
  db: SQLite.SQLiteDatabase | undefined;
  isDbInitialized: boolean;
}

const DatabaseContext = createContext<DatabaseContextProps>({
  db: undefined,
  isDbInitialized: false,
});

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | undefined>(undefined);
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      try {
        await initializeDatabase();
        const database = getDatabase();
        setDb(database);
        setIsDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initDb();
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isDbInitialized }}>
      {isDbInitialized && db && <DrizzleStudio db={db} />}
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
