import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrate';

export const db = SQLite.openDatabaseSync('boutique.db');

runMigrations(db);
