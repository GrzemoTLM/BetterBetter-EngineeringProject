from rest_framework import viewsets, status
from rest_framework.response import Response
from ..models import Discipline
from ..serializers.discipline_serializer import DisciplineSerializer
from ..services.discipline_service import get_or_create_discipline

from ..models import Discipline
class DisciplineViewSet(viewsets.ModelViewSet):
    queryset = Discipline.objects.all()
    serializer_class = DisciplineSerializer

    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        name = request.data.get('name')
        category = request.data.get('category')
        if not code or not name:
            return Response({'error': 'Code and name are required'}, status=status.HTTP_400_BAD_REQUEST)
        obj, created = get_or_create_discipline(code, name, category)
        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
