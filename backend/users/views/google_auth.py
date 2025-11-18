from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from ..serializers import GoogleAuthSerializer, UserSerializer
from ..services.google_auth_service import GoogleAuthService


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    serializer_class = GoogleAuthSerializer

    @swagger_auto_schema(
        operation_summary='Google authentication',
        operation_description='Authenticate user with Google OAuth token',
        request_body=GoogleAuthSerializer,
        responses={
            200: openapi.Response('Authentication successful', UserSerializer),
            400: openapi.Response('Invalid token or authentication failed'),
        }
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            data = GoogleAuthService.authenticate_with_google(
                token=serializer.validated_data['token']
            )
            return Response(data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


def google_login_succes(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'message': 'Google login successful',
            'user': UserSerializer(request.user).data
        })
    return None

