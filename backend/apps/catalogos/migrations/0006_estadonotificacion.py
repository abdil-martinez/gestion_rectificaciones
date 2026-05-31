from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0005_tipocausal_documentos_m2m'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='EstadoNotificacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('nombre', models.CharField(max_length=100)),
                ('codigo', models.CharField(max_length=20)),
                ('texto_observacion', models.TextField()),
                ('usuario_creador', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='estadonotificacion_creados', to=settings.AUTH_USER_MODEL)),
                ('usuario_eliminador', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='estadonotificacion_eliminados', to=settings.AUTH_USER_MODEL)),
                ('usuario_modificador', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='estadonotificacion_modificados', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Estado de Notificación',
                'verbose_name_plural': 'Estados de Notificación',
                'ordering': ['nombre'],
            },
        ),
        migrations.AddConstraint(
            model_name='estadonotificacion',
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=['codigo'],
                name='unique_estadonotificacion_codigo_active',
            ),
        ),
    ]
