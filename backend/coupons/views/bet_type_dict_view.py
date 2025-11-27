from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..models import BetTypeDict, Discipline
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
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'discipline': openapi.Schema(type=openapi.TYPE_INTEGER, description='Discipline ID'),
                'code': openapi.Schema(type=openapi.TYPE_STRING, description='Bet type code (without sport prefix)'),
                'description': openapi.Schema(type=openapi.TYPE_STRING, description='Bet type description'),
            },
            required=['discipline', 'code', 'description']
        ),
        responses={
            200: openapi.Response('Bet type exists', BetTypeDictSerializer),
            201: openapi.Response('Bet type created', BetTypeDictSerializer),
            400: openapi.Response('discipline, code and description are required'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request, *args, **kwargs):
        discipline_id = request.data.get('discipline')
        code = request.data.get('code')
        description = request.data.get('description')
        if not (discipline_id and code and description):
            return Response({'error': 'discipline, code and description are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            discipline = Discipline.objects.get(pk=discipline_id)
        except Discipline.DoesNotExist:
            return Response({'error': 'Discipline not found'}, status=status.HTTP_400_BAD_REQUEST)
        obj, created = BetTypeDict.objects.update_or_create(
            code=code,
            discipline=discipline,
            defaults={'description': description}
        )
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
            204: openapi.Response('Discipline deleted'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Discipline not found'),
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
