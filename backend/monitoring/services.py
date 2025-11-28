from typing import Any, Dict
import time

import psutil
from django.db import connection


def get_system_metrics() -> Dict[str, Any]:
    """Zwraca proste metryki systemowe i DB.

    - cpu_usage: procent uzycia CPU
    - memory_used / memory_total / memory_percent: RAM
    - disk_used / disk_total / disk_percent: przestrzen dyskowa glownego volume
    - db_latency_ms: czas prostego zapytania SELECT 1 w ms
    - error_rate, queue_length: placeholdery (na razie stale 0)
    """

    # CPU
    cpu_usage = psutil.cpu_percent(interval=0.1)

    # Memory
    vm = psutil.virtual_memory()
    memory_total = vm.total
    memory_used = vm.used
    memory_percent = vm.percent

    # Disk (root filesystem)
    disk = psutil.disk_usage("/")
    disk_total = disk.total
    disk_used = disk.used
    disk_percent = disk.percent

    # DB latency
    start = time.perf_counter()
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    end = time.perf_counter()
    db_latency_ms = (end - start) * 1000.0

    return {
        "cpu_usage": cpu_usage,
        "memory": {
            "total": memory_total,
            "used": memory_used,
            "percent": memory_percent,
        },
        "disk": {
            "total": disk_total,
            "used": disk_used,
            "percent": disk_percent,
        },
        "db_latency_ms": db_latency_ms,
        "error_rate": 0.0,
        "queue_length": 0,
    }
