from django.db import models


class Bookmaker(models.Model):
    name = models.CharField(max_length=255, unique=True, help_text="Bookmaker name, e.g., 'STS'")
    tax_multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0.88,
        help_text="Tax multiplier for the bookmaker (e.g., 0.88 for 12% tax)"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Bookmaker"
        verbose_name_plural = "Bookmakers"

