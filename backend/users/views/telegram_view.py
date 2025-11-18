from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from users.serializers.telegram_serializer import (
    TelegramAuthCodeSerializer,
    ConnectTelegramSerializer,
    TelegramUserSerializer
)
from users.services.telegram_service import TelegramService


class GenerateTelegramAuthCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Generate Telegram auth code',
        operation_description='Generate authorization code for Telegram connection',
        responses={
            201: openapi.Response('Auth code generated', TelegramAuthCodeSerializer),
            400: openapi.Response('Error generating code'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request):
        try:
            auth_code = TelegramService.generate_auth_code(request.user)
            serializer = TelegramAuthCodeSerializer(auth_code)
            
            return Response({
                "message": "Auth code generated",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ConnectTelegramView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Connect Telegram account',
        operation_description='Connect user account with Telegram',
        request_body=ConnectTelegramSerializer,
        responses={
            201: openapi.Response('Telegram account connected', TelegramUserSerializer),
            400: openapi.Response('Invalid code or connection failed'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request):
        serializer = ConnectTelegramSerializer(data=request.data)
        if serializer.is_valid():
            try:
                telegram_user = TelegramService.connect_telegram(
                    user=request.user,
                    telegram_id=serializer.validated_data['telegram_id'],
                    code=serializer.validated_data['code']
                )
                response_serializer = TelegramUserSerializer(telegram_user)
                return Response({
                    "message": "Telegram account connected successfully",
                    "data": response_serializer.data
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def get(self, request):
        try:
            telegram_user = TelegramService.get_telegram_user(request.user)
            serializer = TelegramUserSerializer(telegram_user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )


