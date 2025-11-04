from rest_framework import serializers
from coupons.models import Bookmaker, Currency
from finances.models.bookmaker_account import BookmakerAccountModel
from common.serializers.fields import CaseInsensitiveSlugRelatedField


class BookmakerAccountSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    bookmaker = CaseInsensitiveSlugRelatedField(
        slug_field="name",
        queryset=Bookmaker.objects.all(),
        normalizer=lambda s: s.strip() if isinstance(s, str) else s,
    )
    currency = CaseInsensitiveSlugRelatedField(
        slug_field="code",
        queryset=Currency.objects.all(),
        normalizer=lambda s: s.strip().upper() if isinstance(s, str) else s,
    )
    account_label = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = BookmakerAccountModel
        fields = [
            "id",
            "user",
            "bookmaker",
            "alias",
            "account_label",
            "currency",
            "balance",
            "website",
            "active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        user = attrs.get('user') or getattr(self.context.get('request'), 'user', None)
        bookmaker = attrs.get('bookmaker')
        alias = attrs.get('alias')
        account_label = attrs.pop('account_label', None)
        if account_label and not alias:
            attrs['alias'] = account_label
        if not user:
            raise serializers.ValidationError("User is required.")
        exists_qs = BookmakerAccountModel.objects.filter(user=user, bookmaker=bookmaker)
        if self.instance:
            exists_qs = exists_qs.exclude(pk=self.instance.pk)
        if exists_qs.exists():
            raise serializers.ValidationError("You already have an account with this bookmaker.")
        return attrs

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):

        return super().update(instance, validated_data)
