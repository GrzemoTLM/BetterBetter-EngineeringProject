from django.db import models
from django.core.validators import RegexValidator


class Currency(models.Model):
    code = models.CharField(
        max_length=3,
        unique=True,
        validators=[RegexValidator(r'^[A-Z]{3}$', 'Currency code must be 3 uppercase letters.')]
    )
    name = models.CharField(max_length=255)
    symbol = models.CharField(max_length=10)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'currencies'

    def __str__(self):
        return f"{self.code} ({self.symbol})"

