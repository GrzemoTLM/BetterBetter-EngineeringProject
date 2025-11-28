from rest_framework import generics, permissions
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from coupon_analytics.models import UserStrategy
from coupon_analytics.serializers.user_strategy_serializer import UserStrategySerializer


class UserStrategyListCreateView(generics.ListCreateAPIView):

    serializer_class = UserStrategySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserStrategy.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @swagger_auto_schema(
        operation_summary='List user strategies',
        operation_description='Get all betting strategies for authenticated user',
        responses={
            200: openapi.Response('List of strategies', UserStrategySerializer(many=True)),
            401: openapi.Response('Not authenticated'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create strategy',
        operation_description='Create a new betting strategy for authenticated user',
        request_body=UserStrategySerializer,
        responses={
            201: openapi.Response('Strategy created', UserStrategySerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Not authenticated'),
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class UserStrategyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a specific strategy
    """
    serializer_class = UserStrategySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        # Upewnij się że użytkownik może edytować tylko swoje strategie
        return UserStrategy.objects.filter(user=self.request.user)

    @swagger_auto_schema(
        operation_summary='Retrieve strategy',
        operation_description='Get details of a specific betting strategy',
        responses={
            200: openapi.Response('Strategy details', UserStrategySerializer),
            401: openapi.Response('Not authenticated'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Strategy not found'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update strategy (PUT)',
        operation_description='Full update of a betting strategy',
        request_body=UserStrategySerializer,
        responses={
            200: openapi.Response('Strategy updated', UserStrategySerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Not authenticated'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Strategy not found'),
        }
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update strategy (PATCH)',
        operation_description='Partial update of a betting strategy',
        request_body=UserStrategySerializer,
        responses={
            200: openapi.Response('Strategy updated', UserStrategySerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Not authenticated'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Strategy not found'),
        }
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Delete strategy',
        operation_description='Delete a betting strategy',
        responses={
            204: openapi.Response('Strategy deleted'),
            401: openapi.Response('Not authenticated'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Strategy not found'),
        }
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)

