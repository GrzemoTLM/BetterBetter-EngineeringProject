from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from ..services.two_factor_service import TwoFactorService


class TwoFactorStartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Start 2FA setup',
        operation_description='Initialize two-factor authentication setup (TOTP or Email)',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'method': openapi.Schema(type=openapi.TYPE_STRING, enum=['totp', 'email'], description='2FA method'),
            },
            required=['method']
        ),
        responses={
            200: openapi.Response('2FA setup initiated'),
            400: openapi.Response('Invalid method'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request):
        user = request.user
        method = (request.data.get('method') or '').strip().lower()

        try:
            result = TwoFactorService.start_2fa_setup(user, method)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

