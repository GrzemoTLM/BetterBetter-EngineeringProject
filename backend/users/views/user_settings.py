from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from users.serializers.user_settings import UserSettingsSerializer
from users.services.user_settings_service import get_user_settings, update_user_settings


class UserSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings = get_user_settings(request.user)
        serializer = UserSettingsSerializer(settings)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        settings = get_user_settings(request.user)
        serializer = UserSettingsSerializer(settings, data=request.data, partial=True)

        if serializer.is_valid():
            updated_settings = update_user_settings(request.user, serializer.validated_data)
            response_serializer = UserSettingsSerializer(updated_settings)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
