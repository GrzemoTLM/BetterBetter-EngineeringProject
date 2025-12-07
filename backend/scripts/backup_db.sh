#!/bin/bash
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/betbetter_backup_${TIMESTAMP}.sql"
mkdir -p ${BACKUP_DIR}
echo "[INFO] Creating database backup..."
docker exec betbetter_postgres pg_dump -U grzegorz -d betbetter_db > ${BACKUP_FILE}
if [ $? -eq 0 ]; then
    gzip ${BACKUP_FILE}
    echo "[SUCCESS] Backup created: ${BACKUP_FILE}.gz"
    find ${BACKUP_DIR} -name "*.sql.gz" -mtime +7 -delete
    echo "[INFO] Removed old backups (>7 days)"
else
    echo "[ERROR] Error during backup creation!"
    exit 1
fi
