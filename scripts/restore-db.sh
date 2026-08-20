#!/bin/bash
# Database Restore Procedure & Testing Script
# Usage: ./scripts/restore-db.sh <backup_file_path>

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Error: Please specify backup file path. Example: ./scripts/restore-db.sh backups/dev_backup_20260813_120000.db"
  exit 1
fi

if [[ "$BACKUP_FILE" == *.db ]]; then
  echo "🔄 Restoring SQLite database from $BACKUP_FILE..."
  cp "$BACKUP_FILE" prisma/dev.db
  npx prisma db push --skip-generate
  echo "✅ SQLite Restore & Schema Sync Completed!"
elif [[ "$BACKUP_FILE" == *.sql ]]; then
  echo "🔄 Restoring PostgreSQL database from $BACKUP_FILE..."
  psql "$DATABASE_URL" < "$BACKUP_FILE"
  echo "✅ PostgreSQL Restore Completed!"
else
  echo "❌ Unrecognized backup format."
  exit 1
fi
