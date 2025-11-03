from rest_framework import serializers
from coupons.models import Bookmaker, Currency
from finances.models.bookmaker_account import BookmakerAccountModel


class BookmakerAccountSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    bookmaker = serializers.PrimaryKeyRelatedField(queryset=Bookmaker.objects.all())
    currency = serializers.PrimaryKeyRelatedField(queryset=Currency.objects.all())
    class Meta:
        model = BookmakerAccountModel
        fields = [
            "id",
            "user",
            "bookmaker",
            "alias",
            "currency",
            "balance",
            "website",
            "active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        user = attrs.get('user')
        bookmaker = attrs.get('bookmaker')
        if BookmakerAccountModel.objects.filter(user=user, bookmaker=bookmaker).exists():
            raise serializers.ValidationError("You already have an account with this bookmaker.")
        return attrs