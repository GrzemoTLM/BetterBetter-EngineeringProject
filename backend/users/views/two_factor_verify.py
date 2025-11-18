from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from ..services.two_factor_service import TwoFactorService


class TwoFactorVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Verify 2FA setup',
        operation_description='Verify and confirm two-factor authentication setup with code',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'code': openapi.Schema(type=openapi.TYPE_STRING, description='Verification code'),
            },
            required=['code']
        ),
        responses={
            200: openapi.Response('2FA setup verified'),
            400: openapi.Response('Invalid code or verification failed'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request):
        user = request.user
        code = str(request.data.get('code') or '').strip()

        try:
            result = TwoFactorService.verify_2fa_setup(user, code)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

