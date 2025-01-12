
import React from 'react';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import * as SQLite from 'expo-sqlite';

interface DrizzleStudioProps {
  db: SQLite.SQLiteDatabase;
}

const DrizzleStudio: React.FC<DrizzleStudioProps> = ({ db }) => {
  useDrizzleStudio(db);
  return null; 
};

export default DrizzleStudio;
