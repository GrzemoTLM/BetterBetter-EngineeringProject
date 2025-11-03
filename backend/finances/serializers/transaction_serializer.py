from __future__ import annotations
from rest_framework import serializers

from coupons.models import Bookmaker
from finances.models.bookmaker_account import BookmakerAccountModel
from finances.models.transactions import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    bookmaker = serializers.SlugRelatedField(
        read_only=True, slug_field="code", source="bookmaker_account.bookmaker"
    )
    currency = serializers.SlugRelatedField(
        read_only=True, slug_field="code", source="bookmaker_account.currency"
    )
    bookmaker_account = serializers.SlugRelatedField(
        read_only=True, slug_field="id"
    )
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "user",
            "bookmaker_account",
            "bookmaker",
            "currency",
            "transaction_type",
            "amount",
            "fee",
            "created_at",
            "updated_at",
            "display_name",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "bookmaker", "currency", "display_name"]


class TransactionCreateSerializer(serializers.ModelSerializer):
    bookmaker = serializers.SlugRelatedField(
        slug_field="code", queryset=Bookmaker.objects.all(), write_only=True, required=False
    )
    bookmaker_account = serializers.SlugRelatedField(
        slug_field="id", queryset=BookmakerAccountModel.objects.all(), required=False
    )
    class Meta:
        model = Transaction
        fields = [
            "id",
            "user",
            "bookmaker_account",
            "bookmaker",
            "transaction_type",
            "amount",
            "fee",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
    def validate(self, attrs):
        user= attrs.get("user")
        bookmaker = attrs.get("bookmaker")
        bookmaker_account = attrs.get("bookmaker_account")
        amount = attrs.get("amount")
        fee = attrs.get("fee", 0)

        if not user:
            raise serializers.ValidationError("User is required.")
        if not bookmaker_account and not bookmaker:
            raise serializers.ValidationError("Either bookmaker_account or bookmaker must be provided.")
        if bookmaker_account and bookmaker_account.user_id != user.id:
            raise serializers.ValidationError("The bookmaker account does not belong to the user.")
        if bookmaker and not bookmaker_account:
            try:
                bookmaker_account = BookmakerAccountModel.objects.get(user=user, bookmaker=bookmaker)
            except BookmakerAccountModel.DoesNotExist:
                raise serializers.ValidationError("No bookmaker account found for the user and bookmaker.")
            attrs["bookmaker_account"] = bookmaker_account
        if amount <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        if fee < 0:
            raise serializers.ValidationError("Fee cannot be negative.")
        if fee >= amount:
            raise serializers.ValidationError("Fee must be less than the amount.")
        return attrs


class TransactionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["amount", "fee"]
        extra_kwargs = {
            "amount": {"required": False},
            "fee": {"required": False},
        }
