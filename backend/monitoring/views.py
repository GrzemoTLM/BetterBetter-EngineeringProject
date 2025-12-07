import subprocess
import os
from datetime import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from rest_framework import status
from django.conf import settings

from .services import get_system_metrics, get_logged_in_users


class IsAdminOrSuperuser(BasePermission):

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_superuser", False):
            return True
        return getattr(user, "is_staff", False)


class SystemMetricsView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def get(self, request, *args, **kwargs):  # type: ignore[override]
        data = get_system_metrics()
        return Response(data)


class LoggedInUsersView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def get(self, request, *args, **kwargs):  # type: ignore[override]
        users = get_logged_in_users()
        return Response(users)


class DatabaseBackupView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def post(self, request, *args, **kwargs):
        try:
            backup_dir = os.path.join(settings.BASE_DIR, 'backups')
            os.makedirs(backup_dir, exist_ok=True)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"betbetter_backup_{timestamp}.sql"
            backup_path = os.path.join(backup_dir, backup_filename)

            db_user = os.environ.get('POSTGRES_USER', 'grzegorz')
            db_name = os.environ.get('POSTGRES_DB', 'betbetter_db')

            result = subprocess.run(
                ['docker', 'exec', 'betbetter_postgres', 'pg_dump', '-U', db_user, '-d', db_name],
                capture_output=True,
                text=True,
                timeout=120
            )

            if result.returncode != 0:
                return Response(
                    {'error': f'Backup failed: {result.stderr}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            with open(backup_path, 'w') as f:
                f.write(result.stdout)

            subprocess.run(['gzip', backup_path], check=True)
            backup_path_gz = f"{backup_path}.gz"

            file_size = os.path.getsize(backup_path_gz)

            return Response({
                'message': 'Backup created successfully',
                'filename': f"{backup_filename}.gz",
                'size_bytes': file_size,
                'size_kb': round(file_size / 1024, 2),
                'timestamp': timestamp
            })

        except subprocess.TimeoutExpired:
            return Response(
                {'error': 'Backup timed out'},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request, *args, **kwargs):
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')

        if not os.path.exists(backup_dir):
            return Response({'backups': []})

        backups = []
        for filename in sorted(os.listdir(backup_dir), reverse=True):
            if filename.endswith('.sql.gz'):
                filepath = os.path.join(backup_dir, filename)
                file_size = os.path.getsize(filepath)
                backups.append({
                    'filename': filename,
                    'size_bytes': file_size,
                    'size_kb': round(file_size / 1024, 2),
                    'created_at': datetime.fromtimestamp(os.path.getctime(filepath)).isoformat()
                })

        return Response({'backups': backups})


class DatabaseBackupDetailView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def delete(self, request, filename, *args, **kwargs):
        if '..' in filename or '/' in filename:
            return Response(
                {'error': 'Invalid filename'},
                status=status.HTTP_400_BAD_REQUEST
            )

        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        backup_path = os.path.join(backup_dir, filename)

        if not os.path.exists(backup_path):
            return Response(
                {'error': f'Backup file not found: {filename}'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            os.remove(backup_path)
            return Response({
                'message': 'Backup deleted successfully',
                'filename': filename
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DatabaseRestoreView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def post(self, request, *args, **kwargs):
        filename = request.data.get('filename')

        if not filename:
            return Response(
                {'error': 'Filename is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        backup_path = os.path.join(backup_dir, filename)

        if not os.path.exists(backup_path):
            return Response(
                {'error': f'Backup file not found: {filename}'},
                status=status.HTTP_404_NOT_FOUND
            )

        if '..' in filename or filename.startswith('/'):
            return Response(
                {'error': 'Invalid filename'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            db_user = os.environ.get('POSTGRES_USER', 'grzegorz')
            db_name = os.environ.get('POSTGRES_DB', 'betbetter_db')

            if filename.endswith('.gz'):
                gunzip_process = subprocess.Popen(
                    ['gunzip', '-c', backup_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )

                restore_process = subprocess.Popen(
                    ['docker', 'exec', '-i', 'betbetter_postgres', 'psql', '-U', db_user, '-d', db_name],
                    stdin=gunzip_process.stdout,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )

                gunzip_process.stdout.close()
                stdout, stderr = restore_process.communicate(timeout=300)

                if restore_process.returncode != 0:
                    return Response(
                        {'error': f'Restore failed: {stderr.decode()}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                with open(backup_path, 'r') as f:
                    result = subprocess.run(
                        ['docker', 'exec', '-i', 'betbetter_postgres', 'psql', '-U', db_user, '-d', db_name],
                        stdin=f,
                        capture_output=True,
                        text=True,
                        timeout=300
                    )

                    if result.returncode != 0:
                        return Response(
                            {'error': f'Restore failed: {result.stderr}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )

            return Response({
                'message': 'Database restored successfully',
                'filename': filename
            })

        except subprocess.TimeoutExpired:
            return Response(
                {'error': 'Restore timed out'},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
