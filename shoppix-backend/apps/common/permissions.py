from rest_framework import permissions


class IsVendor(permissions.BasePermission):
    """User must have an activated vendor profile."""

    message = "You must be an approved vendor to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_vendor
            and hasattr(request.user, "vendor")
            and request.user.vendor.is_activated
        )


class IsOwnerVendorOrReadOnly(permissions.BasePermission):
    """Only the vendor who owns a product/resource may edit/delete it."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        vendor = getattr(obj, "vendor", None)
        return bool(vendor and request.user.is_authenticated and vendor.user_id == request.user.id)


class IsOwner(permissions.BasePermission):
    """Object must belong to request.user (e.g. cart, address, order)."""

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", None)
        return bool(owner and owner_id_matches(owner, request.user))


def owner_id_matches(owner, user):
    return owner.id == user.id
