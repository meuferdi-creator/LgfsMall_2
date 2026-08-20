#!/bin/bash
# Automatic Database Backup Script for LGF's Mall
# Supports SQLite local backup and PostgreSQL pg_dump

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

if [ -f "prisma/dev.db" ]; then
  echo "📦 Backing up SQLite database..."
  cp prisma/dev.db "$BACKUP_DIR/dev_backup_$TIMESTAMP.db"
  echo "✅ Backup saved to $BACKUP_DIR/dev_backup_$TIMESTAMP.db"
fi

if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == postgres* ]]; then
  echo "📦 Backing up PostgreSQL database..."
  pg_dump "$DATABASE_URL" > "$BACKUP_DIR/pg_backup_$TIMESTAMP.sql"
  echo "✅ PostgreSQL Backup saved to $BACKUP_DIR/pg_backup_$TIMESTAMP.sql"
fi
