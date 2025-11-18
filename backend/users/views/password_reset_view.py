from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..serializers import (
    EmailSerializer,
    PasswordResetSerializer,
)
from ..services.password_reset_service import PasswordResetService


class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary='Request password reset',
        operation_description='Send password reset code to email',
        request_body=EmailSerializer,
        responses={
            200: openapi.Response('Reset code sent if email exists'),
            400: openapi.Response('Invalid email'),
        }
    )
    def post(self, request):
        serializer = EmailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data['email']
        PasswordResetService.reset_request(email)
        return Response(
            {"detail": "If the email exists, a reset code has been sent."},
             status=status.HTTP_200_OK
        )

class ConfirmPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary='Confirm password reset',
        operation_description='Reset password using reset code',
        request_body=PasswordResetSerializer,
        responses={
            200: openapi.Response('Password reset successfully'),
            400: openapi.Response('Invalid code or email'),
        }
    )
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']

        success = PasswordResetService.confirm_reset(email, code, new_password)
        if not success:
            return Response(
                {"detail": "Invalid code or email."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK
        )

class ResendPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        operation_summary='Resend password reset code',
        operation_description='Resend password reset code to email',
        request_body=EmailSerializer,
        responses={
            200: openapi.Response('New reset code sent if email exists'),
            400: openapi.Response('Invalid email'),
        }
    )
    def post(self, request):
        serializer = EmailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data['email']
        PasswordResetService.reset_request(email)
        return Response(
            {"detail": "If the email exists, a new reset code has been sent."},
             status=status.HTTP_200_OK
        )
