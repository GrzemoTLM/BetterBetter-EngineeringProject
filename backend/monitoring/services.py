from typing import Any, Dict, List
import time
import json

import psutil
from django.conf import settings
from django.contrib.sessions.models import Session
from django.db import connection
from django.utils import timezone

from users.models.user import User


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


def get_logged_in_users() -> List[Dict[str, Any]]:
    """Zwraca liste aktualnie zalogowanych uzytkownikow na podstawie sesji.

    Uwaga: dotyczy tylko sesji opartych o mechanizm Django (SessionMiddleware),
    nie samego JWT. Poniewaz u Ciebie i tak jest wlaczona aplikacja sessions,
    to jest sensowny przyblizony widok "online users".
    """

    logged_in_users: List[Dict[str, Any]] = []

    # Bierzemy tylko niewygasle sesje
    sessions = Session.objects.filter(expire_date__gt=timezone.now())

    user_model = User
    session_key = getattr(settings, "SESSION_COOKIE_NAME", "sessionid")

    for sess in sessions:
        try:
            data = sess.get_decoded()
        except Exception:
            # jesli nie udalo sie zdekodowac sesji, pomijamy
            continue

        user_id = data.get("_auth_user_id")
        if not user_id:
            continue

        try:
            user = user_model.objects.get(pk=user_id)
        except user_model.DoesNotExist:
            continue

        logged_in_users.append(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "status": getattr(user, "status", None),
                "last_login": user.last_login,
                "session_key": sess.session_key,
                "session_expire_date": sess.expire_date,
            }
        )

    return logged_in_users
