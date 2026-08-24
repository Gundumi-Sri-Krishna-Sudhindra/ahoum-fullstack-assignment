from rest_framework import permissions


class IsCreator(permissions.BasePermission):
    """
    Permission check to ensure the user is authenticated and has the CREATOR role.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'CREATOR'
        )


class IsSessionCreator(permissions.BasePermission):
    """
    Object-level permission allowing only the creator of the session to edit/delete it.
    """

    def has_object_permission(self, request, view, obj):
        return bool(
            request.user
            and request.user.is_authenticated
            and obj.creator_id == request.user.id
        )


class IsUserRole(permissions.BasePermission):
    """
    Permission check to ensure the user is authenticated and has the USER role for booking.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'USER'
        )
