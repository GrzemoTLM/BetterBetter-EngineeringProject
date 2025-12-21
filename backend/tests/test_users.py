import pytest
from unittest.mock import Mock, patch, MagicMock
from django.contrib.auth import get_user_model
from users.services.auth_service import AuthService

User = get_user_model()

class TestAuthService:

    @patch('users.services.auth_service.User.objects.create')
    @patch('users.services.auth_service.make_password')
    def test_register_user(self, mock_make_password, mock_user_create):
        mock_make_password.return_value = 'hashed_password'
        mock_user = Mock(spec=User)
        mock_user_create.return_value = mock_user

        result = AuthService.register_user('testuser', 'test@example.com', 'password123')

        mock_make_password.assert_called_once_with('password123')
        mock_user_create.assert_called_once_with(
            username='testuser',
            email='test@example.com',
            password='hashed_password'
        )
        assert result == mock_user

    @patch('users.services.auth_service.User.objects.get')
    @patch('users.services.auth_service.authenticate')
    def test_authenticate_user_success(self, mock_authenticate, mock_user_get):
        mock_user = Mock(spec=User)
        mock_user.username = 'testuser'
        mock_user.is_active = True
        mock_user_get.return_value = mock_user
        mock_authenticate.return_value = mock_user

        result = AuthService.authenticate_user('test@example.com', 'password123')

        mock_user_get.assert_called_once_with(email='test@example.com')
        mock_authenticate.assert_called_once_with(username='testuser', password='password123')
        assert result == mock_user

    @patch('users.services.auth_service.User.objects.get')
    def test_authenticate_user_not_found(self, mock_user_get):
        mock_user_get.side_effect = User.DoesNotExist

        with pytest.raises(ValueError, match="Invalid credentials"):
            AuthService.authenticate_user('wrong@example.com', 'password')

    @patch('users.services.auth_service.User.objects.get')
    @patch('users.services.auth_service.authenticate')
    def test_authenticate_user_wrong_password(self, mock_authenticate, mock_user_get):
        mock_user = Mock(spec=User)
        mock_user.username = 'testuser'
        mock_user_get.return_value = mock_user
        mock_authenticate.return_value = None

        with pytest.raises(ValueError, match="Invalid credentials"):
            AuthService.authenticate_user('test@example.com', 'wrong_password')

    @patch('users.services.auth_service.User.objects.get')
    @patch('users.services.auth_service.authenticate')
    def test_authenticate_user_inactive(self, mock_authenticate, mock_user_get):
        mock_user = Mock(spec=User)
        mock_user.username = 'testuser'
        mock_user.is_active = False
        mock_user_get.return_value = mock_user
        mock_authenticate.return_value = mock_user

        with pytest.raises(ValueError, match="User is not active"):
            AuthService.authenticate_user('test@example.com', 'password')

    @patch('users.services.auth_service.RefreshToken.for_user')
    def test_generate_tokens(self, mock_for_user):
        mock_refresh = MagicMock()
        mock_refresh.access_token = 'access_token_str'
        mock_refresh.__str__.return_value = 'refresh_token_str'
        mock_for_user.return_value = mock_refresh
        
        mock_user = Mock(spec=User)
        
        result = AuthService.generate_tokens(mock_user)
        
        mock_for_user.assert_called_once_with(mock_user)
        assert result['refresh'] == 'refresh_token_str'
        assert result['access'] == 'access_token_str'
