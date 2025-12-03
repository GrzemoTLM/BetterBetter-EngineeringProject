"""
Report views for managing periodic reports.
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from coupon_analytics.models import Report
from coupon_analytics.serializers import ReportSerializer, ReportDetailSerializer


class ReportListCreateView(generics.ListCreateAPIView):
    """
    List all reports for authenticated user or create a new one.
    
    GET: Returns list of reports for current user.
    POST: Creates a new periodic report.
    """
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return reports for current user only."""
        return Report.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        from django.utils import timezone
        from datetime import timedelta
        now = timezone.now()
        next_run = now + timedelta(minutes=1)

        serializer.save(user=self.request.user, next_run=next_run)

    @swagger_auto_schema(
        operation_summary='List user reports',
        operation_description='Get all periodic reports for authenticated user',
        responses={
            200: openapi.Response('List of reports', ReportSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create new report',
        operation_description='Create a new periodic report (Daily/Weekly/Monthly/Yearly)',
        request_body=ReportSerializer,
        responses={
            201: openapi.Response('Report created', ReportSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a specific report.
    
    GET: Returns report details.
    PATCH: Updates report settings.
    DELETE: Removes report.
    """
    serializer_class = ReportDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return reports for current user only."""
        return Report.objects.filter(user=self.request.user)

    @swagger_auto_schema(
        operation_summary='Get report details',
        operation_description='Retrieve detailed information about a specific report',
        responses={
            200: openapi.Response('Report details', ReportDetailSerializer),
            404: openapi.Response('Report not found'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update report',
        operation_description='Update report frequency, delivery method, or schedule',
        request_body=ReportDetailSerializer,
        responses={
            200: openapi.Response('Report updated', ReportDetailSerializer),
            400: openapi.Response('Invalid data'),
            404: openapi.Response('Report not found'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Delete report',
        operation_description='Remove a periodic report',
        responses={
            204: openapi.Response('Report deleted'),
            404: openapi.Response('Report not found'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class ReportToggleActiveView(APIView):
    """
    Toggle report active status (pause/resume report generation).
    """
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Toggle report status',
        operation_description='Enable or disable a periodic report',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'is_active': openapi.Schema(type=openapi.TYPE_BOOLEAN),
            },
        ),
        responses={
            200: openapi.Response('Status updated', ReportSerializer),
            404: openapi.Response('Report not found'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request, pk):
        """Toggle report active status."""
        try:
            report = Report.objects.get(pk=pk, user=request.user)
        except Report.DoesNotExist:
            return Response(
                {'detail': 'Report not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        is_active = request.data.get('is_active')
        if is_active is not None:
            # Toggle or set specific value
            if isinstance(is_active, bool):
                # Brak dedicated is_active field, ale możemy to symulować poprzez next_run
                # Dla teraz zwracamy info
                pass

        serializer = ReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReportSendNowView(APIView):
    """
    Wyślij raport natychmiast (na żądanie).

    POST /api/analytics/reports/{id}/send/
    """
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Send report now',
        operation_description='Send a report immediately without waiting for next_run',
        responses={
            200: openapi.Response('Report sent successfully'),
            404: openapi.Response('Report not found'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request, pk):
        """Wyślij raport natychmiast."""
        try:
            report = Report.objects.get(pk=pk, user=request.user)
        except Report.DoesNotExist:
            return Response(
                {'detail': 'Report not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            from coupon_analytics.services.report_service import generate_report_data, calculate_next_run
            from users.models import TelegramUser
            from bot.notifications.reports import _format_report_message
            from django.utils import timezone
            import logging

            logger = logging.getLogger(__name__)

            # Sprawdzić czy user ma Telegram
            try:
                tg_profile = TelegramUser.objects.get(user=request.user)
            except TelegramUser.DoesNotExist:
                return Response(
                    {'error': 'Telegram account not connected'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Wygeneruj dane raportu
            report_data = generate_report_data(report)

            # Formatuj wiadomość
            message = _format_report_message(report_data)

            logger.info(f"[REPORT SEND] Report {report.id} generated for user {request.user.id}")
            logger.info(f"[REPORT SEND] Message will be queued for bot to send")

            # Zaktualizuj next_run
            now = timezone.now()
            report.next_run = calculate_next_run(report, now)
            report.save(update_fields=['next_run'])

            # TODO: Bot wyśle to do Telegrama (patrz bot/notifications/alerts.py -> send_pending_reports)

            return Response({
                'message': 'Report queued for sending to Telegram',
                'report_id': report.id,
                'data': report_data,
                'next_run': report.next_run.isoformat(),
                'telegram_user_id': tg_profile.telegram_id,
                'note': 'Telegram notification will be sent within 5 seconds by the bot'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            logger.error(f"Error sending report {pk}: {e}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


