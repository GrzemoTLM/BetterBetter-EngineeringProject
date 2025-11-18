from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..serializers import UserSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Get current user info',
        operation_description='Retrieve information about the authenticated user',
        responses={
            200: openapi.Response('Current user information', UserSerializer),
            401: openapi.Response('Unauthorized'),
        }
    )
    def get(self, request):
        user = request.user
        return Response(UserSerializer(user).data)

