from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from users.serializers.user_settings import UserSettingsSerializer
from users.services.user_settings_service import get_user_settings, update_user_settings


class UserSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Get user settings',
        operation_description='Retrieve user account settings',
        responses={
            200: openapi.Response('User settings', UserSettingsSerializer),
            401: openapi.Response('Unauthorized'),
        }
    )
    def get(self, request):
        settings = get_user_settings(request.user)
        serializer = UserSettingsSerializer(settings)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary='Update user settings',
        operation_description='Update user account settings',
        request_body=UserSettingsSerializer,
        responses={
            200: openapi.Response('Settings updated', UserSettingsSerializer),
            400: openapi.Response('Invalid input'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def patch(self, request):
        settings = get_user_settings(request.user)
        serializer = UserSettingsSerializer(settings, data=request.data, partial=True)

        if serializer.is_valid():
            updated_settings = update_user_settings(request.user, serializer.validated_data)
            response_serializer = UserSettingsSerializer(updated_settings)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

