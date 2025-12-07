#!/bin/bash

if [ -z "$1" ]; then
    echo "[ERROR] Please provide the path to the backup file!"
    echo "Usage: ./restore_db.sh ./backups/betbetter_backup_YYYYMMDD_HHMMSS.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

echo "[WARNING] This will overwrite the current database!"
read -p "Are you sure you want to continue? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "[INFO] Restoring database from: ${BACKUP_FILE}"

    if [[ ${BACKUP_FILE} == *.gz ]]; then
        gunzip -c ${BACKUP_FILE} | docker exec -i betbetter_postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-betbetter}
    else
        docker exec -i betbetter_postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-betbetter} < ${BACKUP_FILE}
    fi

    if [ $? -eq 0 ]; then
        echo "[SUCCESS] Database restored successfully!"
    else
        echo "[ERROR] Error during database restoration!"
        exit 1
    fi
else
    echo "[CANCELLED] Operation cancelled."
fi

