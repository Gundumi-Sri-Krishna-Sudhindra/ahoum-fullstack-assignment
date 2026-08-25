from typing import Any, cast

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer representing user details for responses."""

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role')
        read_only_fields = ('id', 'email', 'name', 'role')


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile details including role."""

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role')
        read_only_fields = ('id', 'email')


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for registering a new user."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
    )

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'password')

    def validate_email(self, value):
        normalized_email = value.lower().strip()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("An account with this email already exists. Please sign in instead.")
        return normalized_email

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
            role=User.Role.USER,
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom login serializer that authenticates via email and password,
    returning JWT access/refresh tokens alongside user details.
    """

    def validate(self, attrs: Any) -> dict[str, Any]:
        email = (attrs.get('email') or attrs.get('username') or '').strip().lower()
        if email:
            user_obj = User.objects.filter(email__iexact=email).first()
            if user_obj and not user_obj.has_usable_password():
                raise serializers.ValidationError(
                    {"detail": "This account was created with GitHub OAuth. Please sign in using the 'Continue with GitHub' button."}
                )
        data: dict[str, Any] = cast(dict[str, Any], super().validate(attrs))
        data['user'] = UserSerializer(self.user).data
        return data


class GitHubLoginSerializer(serializers.Serializer):
    """Serializer for receiving GitHub OAuth authorization code."""

    code = serializers.CharField(required=True, allow_blank=False)
    redirect_uri = serializers.CharField(required=False, allow_blank=True, default=None)
