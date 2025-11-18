from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import logout
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class LogoutView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = []

    @swagger_auto_schema(
        operation_summary='User logout',
        operation_description='Logout user and blacklist refresh token',
        manual_parameters=[
            openapi.Parameter('Refresh', openapi.IN_HEADER, type=openapi.TYPE_STRING, required=False, description='Refresh token (optional if provided in body)'),
        ],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='Refresh token')
            },
            required=['refresh']
        ),
        responses={
            200: openapi.Response('Successfully logged out'),
            400: openapi.Response('Refresh token is required or invalid'),
        }
    )
    def post(self, request):
        refresh_token = (
            request.data.get('refresh') or
            request.headers.get('Refresh') or
            request.COOKIES.get('refresh')
        )

        if not refresh_token:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_400_BAD_REQUEST)

        logout(request)
        return Response({'detail': 'Successfully logged out'}, status=status.HTTP_200_OK)

