from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from coupon_analytics.models import AlertRule, AlertEvent
from coupon_analytics.serializers.alert_serializers import AlertRuleSerializer, AlertEventSerializer
from coupon_analytics.services.alert_service import evaluate_alert_rules_for_user


class AlertRuleListCreateView(generics.ListCreateAPIView):
    serializer_class = AlertRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AlertRule.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        metric = serializer.validated_data.get('metric', '').lower()

        if metric == 'streak_loss':
            AlertRule.objects.filter(
                user=self.request.user,
                metric='streak_loss',
                is_active=True
            ).update(is_active=False)

        serializer.save(user=self.request.user, metric=metric)

    @swagger_auto_schema(
        operation_summary='List alert rules',
        operation_description='Get all alert rules for authenticated user',
        responses={
            200: openapi.Response('List of alert rules', AlertRuleSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create alert rule',
        operation_description='Create a new alert rule',
        request_body=AlertRuleSerializer,
        responses={
            201: openapi.Response('Alert rule created', AlertRuleSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class AlertRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AlertRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AlertRule.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        metric = serializer.validated_data.get('metric')
        if metric:
            serializer.validated_data['metric'] = metric.lower()
        serializer.save()

    @swagger_auto_schema(
        operation_summary='Retrieve alert rule',
        operation_description='Get alert rule details by ID',
        responses={
            200: openapi.Response('Alert rule details', AlertRuleSerializer),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Alert rule not found'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update alert rule',
        operation_description='Update an alert rule (PUT)',
        request_body=AlertRuleSerializer,
        responses={
            200: openapi.Response('Alert rule updated', AlertRuleSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Alert rule not found'),
        }
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Partial update alert rule',
        operation_description='Partially update an alert rule (PATCH)',
        request_body=AlertRuleSerializer,
        responses={
            200: openapi.Response('Alert rule updated', AlertRuleSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Alert rule not found'),
        }
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Delete alert rule',
        operation_description='Delete an alert rule',
        responses={
            204: openapi.Response('Alert rule deleted'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Alert rule not found'),
        }
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class AlertRuleEvaluateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Evaluate alert rule',
        operation_description='Evaluate and trigger alert rule for user',
        responses={
            200: openapi.Response('Rule evaluated'),
            404: openapi.Response('Alert rule not found'),
        }
    )
    def post(self, request, pk):
        rule = AlertRule.objects.filter(pk=pk, user=request.user).first()
        if not rule:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        evaluate_alert_rules_for_user(request.user)
        events = AlertEvent.objects.filter(rule=rule).order_by('-triggered_at')[:10]
        data = AlertEventSerializer(events, many=True).data
        return Response({'evaluated': True, 'events': data}, status=status.HTTP_200_OK)


class AlertEventListView(generics.ListAPIView):
    serializer_class = AlertEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AlertEvent.objects.filter(user=self.request.user).select_related('rule').order_by('-triggered_at')
        rule_id = self.request.query_params.get('rule_id')
        if rule_id:
            qs = qs.filter(rule_id=rule_id)
        unsent = self.request.query_params.get('unsent')
        if unsent in {'1', 'true', 'True'}:
            qs = qs.filter(sent_at__isnull=True)
        return qs

    @swagger_auto_schema(
        operation_summary='List alert events',
        operation_description='Get all alert events for authenticated user with optional filtering',
        manual_parameters=[
            openapi.Parameter('rule_id', openapi.IN_QUERY, type=openapi.TYPE_INTEGER, required=False, description='Filter by alert rule ID'),
            openapi.Parameter('unsent', openapi.IN_QUERY, type=openapi.TYPE_STRING, required=False, description='Filter unsent events (1, true, True)'),
        ],
        responses={
            200: openapi.Response('List of alert events', AlertEventSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

