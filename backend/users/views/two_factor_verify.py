from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.response import Response

from ..services.two_factor_service import TwoFactorService


class TwoFactorVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        code = str(request.data.get('code') or '').strip()

        try:
            result = TwoFactorService.verify_2fa_setup(user, code)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

