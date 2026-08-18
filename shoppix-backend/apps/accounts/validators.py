import re

from django.core.exceptions import ValidationError


class ComplexPasswordValidator:
    """Mirrors the zod regex rules already enforced on the frontend
    (uppercase, lowercase, digit, special char) so validation stays
    consistent between client and server.
    """

    def validate(self, password, user=None):
        errors = []
        if not re.search(r"[A-Z]", password):
            errors.append("Password must contain an uppercase letter.")
        if not re.search(r"[a-z]", password):
            errors.append("Password must contain a lowercase letter.")
        if not re.search(r"[0-9]", password):
            errors.append("Password must contain a number.")
        if not re.search(r"[^A-Za-z0-9]", password):
            errors.append("Password must contain a special character.")
        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return "Password must contain uppercase, lowercase, a number, and a special character."
