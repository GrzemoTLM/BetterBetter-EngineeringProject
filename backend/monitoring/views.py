from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import BasePermission

from .services import get_system_metrics, get_logged_in_users


class IsAdminOrSuperuser(BasePermission):

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_superuser", False):
            return True
        return getattr(user, "is_staff", False)


class SystemMetricsView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def get(self, request, *args, **kwargs):  # type: ignore[override]
        data = get_system_metrics()
        return Response(data)


class LoggedInUsersView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def get(self, request, *args, **kwargs):  # type: ignore[override]
        users = get_logged_in_users()
        return Response(users)
