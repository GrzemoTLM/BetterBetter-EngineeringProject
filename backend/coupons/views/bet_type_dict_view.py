from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..models import BetTypeDict
from ..serializers.bet_type_dict_serializer import BetTypeDictSerializer
from ..services.bet_type_dict_service import get_or_create_bet_type


class BetTypeDictViewSet(viewsets.ModelViewSet):
    queryset = BetTypeDict.objects.all()
    serializer_class = BetTypeDictSerializer
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='List bet types',
        operation_description='Get list of all bet types',
        responses={
            200: openapi.Response('List of bet types', BetTypeDictSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create or get bet type',
        operation_description='Create a new bet type or get existing one',
        manual_parameters=[
            openapi.Parameter('code', openapi.IN_QUERY, type=openapi.TYPE_STRING, required=True, description='Bet type code'),
            openapi.Parameter('description', openapi.IN_QUERY, type=openapi.TYPE_STRING, required=True, description='Bet type description'),
        ],
        responses={
            200: openapi.Response('Bet type exists', BetTypeDictSerializer),
            201: openapi.Response('Bet type created', BetTypeDictSerializer),
            400: openapi.Response('Code and description are required'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        description = request.data.get('description')
        if not code or not description:
            return Response({'error': 'Code and description are required'}, status=status.HTTP_400_BAD_REQUEST)
        obj, created = get_or_create_bet_type(code, description)
        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary='Retrieve bet type',
        operation_description='Get bet type details by ID',
        responses={
            200: openapi.Response('Bet type details', BetTypeDictSerializer),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Bet type not found'),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update bet type',
        operation_description='Update a bet type (PUT)',
        request_body=BetTypeDictSerializer,
        responses={
            200: openapi.Response('Bet type updated', BetTypeDictSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Bet type not found'),
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Partial update bet type',
        operation_description='Update a bet type (PATCH)',
        request_body=BetTypeDictSerializer,
        responses={
            200: openapi.Response('Bet type updated', BetTypeDictSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Bet type not found'),
        }
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Delete bet type',
        operation_description='Delete a bet type',
        responses={
            204: openapi.Response('Bet type deleted'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Bet type not found'),
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

