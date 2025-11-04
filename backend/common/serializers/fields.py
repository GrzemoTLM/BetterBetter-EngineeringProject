from typing import Optional

from django.utils import timezone
from rest_framework import serializers


class UserAwareDateTimeField(serializers.DateTimeField):

    def __init__(
        self,
        *args,
        fallback_format: Optional[str] = None,
        **kwargs,
    ):
        self.fallback_format = fallback_format
        super().__init__(*args, **kwargs)

    def _get_user_datetime_format(self) -> Optional[str]:
        parent = getattr(self, "parent", None)
        context = getattr(parent, "context", {}) if parent else {}
        request = context.get("request") if isinstance(context, dict) else None
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return None

        try:
            from users.models import UserSettings  # type: ignore
        except Exception:
            return None

        try:
            settings = UserSettings.objects.select_related(None).only(
                "id", "user_id", "datetime_format", "date_format"
            ).get(user=user)
        except Exception:
            return None

        fmt = getattr(settings, "datetime_format", None) or getattr(settings, "date_format", None)
        return fmt or self.fallback_format

    def to_representation(self, value):
        if value is None:
            return None
        try:
            value = timezone.localtime(value)
        except Exception:
            pass

        user_fmt = self._get_user_datetime_format()
        if user_fmt:
            try:
                return value.strftime(user_fmt)
            except Exception:
                pass
        return super().to_representation(value)

