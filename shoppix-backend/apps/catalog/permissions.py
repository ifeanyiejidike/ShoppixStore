from rest_framework import permissions


class IsProductOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user.is_authenticated
            and hasattr(request.user, "vendor")
            and obj.vendor_id == request.user.vendor.id
        )
