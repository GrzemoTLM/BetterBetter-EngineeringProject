from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.response import Response

from ..services.two_factor_service import TwoFactorService


class TwoFactorStartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        method = (request.data.get('method') or '').strip().lower()

        try:
            result = TwoFactorService.start_2fa_setup(user, method)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

