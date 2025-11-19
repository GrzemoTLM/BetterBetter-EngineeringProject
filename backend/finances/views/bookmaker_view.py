from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from coupons.models import Bookmaker
from rest_framework import serializers

class SimpleBookmakerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmaker
        fields = ["id", "name", "tax_multiplier"]

class BookmakerListView(ListAPIView):
    queryset = Bookmaker.objects.all().order_by("name")
    serializer_class = SimpleBookmakerSerializer
    permission_classes = [AllowAny]

