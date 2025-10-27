from django.db.models import TextChoices
from django.utils.translation import gettext_lazy as _

class CouponType(TextChoices):
    SOLO = "SOLO", _("Solo")
    AKO = "AKO", _("Accumulator")
    SYSTEM = "SYSTEM", _("System")
