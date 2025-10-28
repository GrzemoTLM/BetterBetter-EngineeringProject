from rest_framework import viewsets, status
from rest_framework.response import Response
from ..models import BetTypeDict
from ..serializers.bet_type_dict_serializer import BetTypeDictSerializer
from ..services.bet_type_dict_service import get_or_create_bet_type


class BetTypeDictViewSet(viewsets.ModelViewSet):
    queryset = BetTypeDict.objects.all()
    serializer_class = BetTypeDictSerializer

    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        description = request.data.get('description')
        if not code or not description:
            return Response({'error': 'Code and description are required'}, status=status.HTTP_400_BAD_REQUEST)
        obj, created = get_or_create_bet_type(code, description)
        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
