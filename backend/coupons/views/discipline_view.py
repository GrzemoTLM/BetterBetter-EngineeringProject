from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..models import Discipline
from ..serializers.discipline_serializer import DisciplineSerializer
from ..services.discipline_service import get_or_create_discipline


class DisciplineViewSet(viewsets.ModelViewSet):
    queryset = Discipline.objects.all()
    serializer_class = DisciplineSerializer
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='List disciplines',
        operation_description='Get list of all sports disciplines',
        responses={
            200: openapi.Response('List of disciplines', DisciplineSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create or get discipline',
        operation_description='Create a new discipline or get existing one',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'code': openapi.Schema(type=openapi.TYPE_STRING, description='Discipline code'),
                'name': openapi.Schema(type=openapi.TYPE_STRING, description='Discipline name'),
                'category': openapi.Schema(type=openapi.TYPE_STRING, description='Discipline category (optional)'),
            },
            required=['code', 'name']
        ),
        responses={
            200: openapi.Response('Discipline exists', DisciplineSerializer),
            201: openapi.Response('Discipline created', DisciplineSerializer),
            400: openapi.Response('Code and name are required'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        name = request.data.get('name')
        category = request.data.get('category')
        if not code or not name:
            return Response({'error': 'Code and name are required'}, status=status.HTTP_400_BAD_REQUEST)
        obj, created = get_or_create_discipline(code, name, category)
        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary='Retrieve discipline',
        operation_description='Get discipline details by ID',
        responses={
            200: openapi.Response('Discipline details', DisciplineSerializer),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Discipline not found'),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update discipline',
        operation_description='Update a discipline (PUT)',
        request_body=DisciplineSerializer,
        responses={
            200: openapi.Response('Discipline updated', DisciplineSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Discipline not found'),
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Partial update discipline',
        operation_description='Partially update a discipline (PATCH)',
        request_body=DisciplineSerializer,
        responses={
            200: openapi.Response('Discipline updated', DisciplineSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Discipline not found'),
        }
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Delete discipline',
        operation_description='Delete a discipline',
        responses={
            204: openapi.Response('Discipline deleted'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Discipline not found'),
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

