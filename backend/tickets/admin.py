from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Ticket, TicketCategory, TicketComment


@admin.register(TicketCategory)
class TicketCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name', 'description']


@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'ticket', 'author', 'created_at', 'is_staff_comment']
    list_filter = ['created_at', 'is_staff_comment', 'author']
    search_fields = ['ticket__title', 'author__username', 'content']
    readonly_fields = ['created_at', 'updated_at', 'author']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.author = request.user
        super().save_model(request, obj, form, change)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'title', 'user', 'category', 'status', 'priority',
        'assigned_to', 'created_at'
    ]
    list_filter = ['status', 'priority', 'category', 'created_at']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']

    fieldsets = (
        (_('Basic Information'), {
            'fields': ('title', 'description', 'user', 'category')
        }),
        (_('Status and Priority'), {
            'fields': ('status', 'priority', 'assigned_to')
        }),
        (_('Dates'), {
            'fields': ('created_at', 'updated_at', 'resolved_at'),
            'classes': ('collapse',)
        }),
    )

    inlines = []

    def save_model(self, request, obj, form, change):
        if not change:
            obj.user = request.user
        super().save_model(request, obj, form, change)

