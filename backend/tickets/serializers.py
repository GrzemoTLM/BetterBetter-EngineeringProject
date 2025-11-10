from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from .models import Ticket, TicketCategory, TicketComment

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username', 'email']

class TicketCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = TicketCategory
        fields = ['name', 'description']
        read_only_fields = ['name']

class TicketCommentSerializer(serializers.ModelSerializer):

    author = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = TicketComment
        fields = ['id', 'author', 'content', 'created_at', 'updated_at', 'is_staff_comment']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at', 'is_staff_comment']

class TicketListSerializer(serializers.ModelSerializer):

    user = UserBasicSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'user', 'category', 'category_display',
            'status', 'status_display', 'priority', 'priority_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class TicketDetailSerializer(serializers.ModelSerializer):

    user = UserBasicSerializer(read_only=True)
    assigned_to = UserBasicSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    comments = TicketCommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'user', 'category', 'category_display',
            'status', 'status_display', 'priority', 'priority_display',
            'created_at', 'updated_at', 'resolved_at', 'assigned_to', 'comments'
        ]
        read_only_fields = [
            'id', 'user', 'created_at', 'updated_at', 'resolved_at',
            'assigned_to', 'comments'
        ]

class TicketCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Ticket
        fields = ['title', 'description', 'category', 'priority']

    def create(self, validated_data):
        ticket = Ticket.objects.create(**validated_data)
        return ticket

class TicketUpdateStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = Ticket
        fields = ['status', 'resolved_at']
        read_only_fields = []

class AddCommentSerializer(serializers.ModelSerializer):

    class Meta:
        model = TicketComment
        fields = ['content']

