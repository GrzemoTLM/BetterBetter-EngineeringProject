from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..models import BetTypeDict, Discipline
from ..serializers.bet_type_dict_serializer import BetTypeDictSerializer


class BetTypeDictViewSet(viewsets.ModelViewSet):
    queryset = BetTypeDict.objects.all()
    serializer_class = BetTypeDictSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = BetTypeDict.objects.all()
        discipline_id = self.request.query_params.get('discipline')
        discipline_code = self.request.query_params.get('discipline_code')

        if discipline_id:
            queryset = queryset.filter(disciplines__id=discipline_id)
        elif discipline_code:
            queryset = queryset.filter(disciplines__code=discipline_code.upper())

        return queryset.distinct()

    @swagger_auto_schema(
        operation_summary='List bet types',
        operation_description='Get list of all bet types. Filter by discipline using ?discipline=ID or ?discipline_code=CODE',
        manual_parameters=[
            openapi.Parameter('discipline', openapi.IN_QUERY, description="Discipline ID", type=openapi.TYPE_INTEGER),
            openapi.Parameter('discipline_code', openapi.IN_QUERY, description="Discipline code (e.g. SOC, BASK)", type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response('List of bet types', BetTypeDictSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Get bet types for discipline',
        operation_description='Get all bet types assigned to a specific discipline',
        responses={
            200: openapi.Response('List of bet types', BetTypeDictSerializer(many=True)),
            404: openapi.Response('Discipline not found'),
        }
    )
    @action(detail=False, methods=['get'], url_path='by-discipline/(?P<discipline_id>[^/.]+)')
    def by_discipline(self, request, discipline_id=None):
        try:
            if discipline_id.isdigit():
                discipline = Discipline.objects.get(id=discipline_id)
            else:
                discipline = Discipline.objects.get(code=discipline_id.upper())
        except Discipline.DoesNotExist:
            return Response({'error': 'Discipline not found'}, status=status.HTTP_404_NOT_FOUND)

        bet_types = discipline.bet_types.all()
        serializer = self.get_serializer(bet_types, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_summary='Create or get bet type',
        operation_description='Create a new bet type or get existing one and assign to discipline',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'discipline': openapi.Schema(type=openapi.TYPE_INTEGER, description='Discipline ID'),
                'code': openapi.Schema(type=openapi.TYPE_STRING, description='Bet type code'),
                'description': openapi.Schema(type=openapi.TYPE_STRING, description='Bet type description'),
            },
            required=['code', 'description']
        ),
        responses={
            200: openapi.Response('Bet type exists', BetTypeDictSerializer),
            201: openapi.Response('Bet type created', BetTypeDictSerializer),
            400: openapi.Response('code and description are required'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def create(self, request, *args, **kwargs):
        discipline_id = request.data.get('discipline')
        code = request.data.get('code')
        description = request.data.get('description')

        if not (code and description):
            return Response({'error': 'code and description are required'}, status=status.HTTP_400_BAD_REQUEST)

        obj, created = BetTypeDict.objects.get_or_create(
            code=code.upper(),
            defaults={'description': description}
        )

        if discipline_id:
            try:
                discipline = Discipline.objects.get(pk=discipline_id)
                obj.disciplines.add(discipline)
            except Discipline.DoesNotExist:
                pass

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
