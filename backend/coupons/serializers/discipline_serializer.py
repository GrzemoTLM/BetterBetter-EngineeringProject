from rest_framework import serializers
from ..models import Discipline


class DisciplineSerializer(serializers.ModelSerializer):
    code = serializers.CharField()
    name = serializers.CharField()
    category = serializers.ChoiceField(choices=Discipline._meta.get_field('category').choices)
    slug = serializers.SlugField(read_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = Discipline
        fields = ['id', 'code', 'name', 'category', 'slug', 'is_active']

    def validate_code(self, value):
        return value.upper()
