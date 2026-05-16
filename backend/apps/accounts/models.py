from django.contrib.auth.models import AbstractUser
from django.db import models

ROL_CHOICES = [
    ('ADMIN',    'Administrador'),
    ('SUPER',    'Súper Analista'),
    ('ANALIST',  'Analista'),
    ('CONSULTA', 'Consulta'),
]


class CustomUser(AbstractUser):
    rol      = models.CharField(max_length=20, choices=ROL_CHOICES, default='ANALIST')
    regional = models.ForeignKey(
        'catalogos.Regional',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='usuarios'
    )
    unidad = models.ForeignKey(
        'catalogos.Unidad',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='usuarios'
    )
    telefono = models.CharField(max_length=20, blank=True, null=True)
    avatar   = models.ImageField(upload_to='avatars/', blank=True, null=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.get_full_name()} ({self.rol})"

    @property
    def nombre_completo(self):
        return f"{self.first_name} {self.last_name}".strip()
