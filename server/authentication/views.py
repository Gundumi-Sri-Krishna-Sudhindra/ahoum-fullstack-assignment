from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .github import exchange_code_for_token, get_github_authorization_url, get_github_user_info
from .serializers import (
    CustomTokenObtainPairSerializer,
    GitHubLoginSerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Endpoint for public user registration.
    Returns JWT tokens and user details on successful registration.
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """
    Endpoint for user login via email and password.
    Returns JWT tokens and user details.
    """

    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (permissions.AllowAny,)


class MeView(generics.RetrieveUpdateAPIView):
    """
    Endpoint to retrieve or update the currently authenticated user's details.
    Requires a valid JWT access token.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class GitHubLoginUrlView(views.APIView):
    """
    Returns the GitHub OAuth authorization URL to initiate the OAuth flow.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        redirect_uri = request.query_params.get('redirect_uri')
        url = get_github_authorization_url(redirect_uri=redirect_uri)
        return Response({'url': url}, status=status.HTTP_200_OK)


class GitHubLoginView(views.APIView):
    """
    Handles the OAuth callback from GitHub:
    1. Validates the authorization code.
    2. Exchanges the code with GitHub for an access token.
    3. Retrieves the user's GitHub profile and verified email.
    4. Finds or creates a local User (always assigned role=USER).
    5. Issues application SimpleJWT tokens.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GitHubLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code']
        redirect_uri = serializer.validated_data.get('redirect_uri')

        # Exchange code for GitHub access token
        access_token = exchange_code_for_token(code, redirect_uri=redirect_uri)

        # Retrieve profile and email from GitHub
        user_info = get_github_user_info(access_token)
        email = user_info['email']
        name = user_info['name']

        # Find or create user
        user = User.objects.filter(email__iexact=email).first()
        is_new_user = False
        if user:
            if not user.is_active:
                return Response(
                    {"detail": "This user account is inactive or disabled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            is_new_user = True
            user = User.objects.create_user(
                email=email,
                name=name,
                password=None,
                role=User.Role.USER,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'is_new_user': is_new_user,
            },
            status=status.HTTP_200_OK,
        )
