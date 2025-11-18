from rest_framework import viewsets, permissions
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..models import User
from ..serializers import UserSerializer


class UserView(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='List users',
        operation_description='Get list of all users',
        responses={
            200: openapi.Response('List of users', UserSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create user',
        operation_description='Create a new user',
        request_body=UserSerializer,
        responses={
            201: openapi.Response('User created', UserSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Retrieve user',
        operation_description='Get user details by ID',
        responses={
            200: openapi.Response('User details', UserSerializer),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('User not found'),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update user',
        operation_description='Update user details',
        request_body=UserSerializer,
        responses={
            200: openapi.Response('User updated', UserSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('User not found'),
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Partial update user',
        operation_description='Partially update user details',
        request_body=UserSerializer,
        responses={
            200: openapi.Response('User updated', UserSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('User not found'),
        }
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Delete user',
        operation_description='Delete user by ID',
        responses={
            204: openapi.Response('User deleted'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('User not found'),
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

