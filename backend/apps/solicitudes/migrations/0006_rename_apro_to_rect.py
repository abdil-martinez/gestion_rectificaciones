from django.db import migrations, models


def apro_to_rect(apps, schema_editor):
    Solicitud = apps.get_model('solicitudes', 'Solicitud')
    BitacoraSolicitud = apps.get_model('solicitudes', 'BitacoraSolicitud')

    Solicitud.objects.filter(estado='APRO').update(estado='RECT')
    BitacoraSolicitud.objects.filter(estado_anterior='APRO').update(estado_anterior='RECT')
    BitacoraSolicitud.objects.filter(estado_nuevo='APRO').update(estado_nuevo='RECT')


def rect_to_apro(apps, schema_editor):
    Solicitud = apps.get_model('solicitudes', 'Solicitud')
    BitacoraSolicitud = apps.get_model('solicitudes', 'BitacoraSolicitud')

    Solicitud.objects.filter(estado='RECT').update(estado='APRO')
    BitacoraSolicitud.objects.filter(estado_anterior='RECT').update(estado_anterior='APRO')
    BitacoraSolicitud.objects.filter(estado_nuevo='RECT').update(estado_nuevo='APRO')


class Migration(migrations.Migration):

    dependencies = [
        ('solicitudes', '0005_add_agencia_to_solicitud'),
    ]

    operations = [
        migrations.AlterField(
            model_name='solicitud',
            name='estado',
            field=models.CharField(
                choices=[
                    ('BOR',  'Borrador'),
                    ('PEND', 'Pendiente'),
                    ('ASIG', 'Asignado'),
                    ('REV',  'En Revisión'),
                    ('RECT', 'Rectificado'),
                    ('RECH', 'Rechazado'),
                    ('DEV',  'Devuelto'),
                    ('FIN',  'Finalizado'),
                    ('ANU',  'Anulado'),
                ],
                default='BOR',
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name='bitacorasolicitud',
            name='estado_anterior',
            field=models.CharField(
                blank=True, null=True,
                choices=[
                    ('BOR',  'Borrador'),
                    ('PEND', 'Pendiente'),
                    ('ASIG', 'Asignado'),
                    ('REV',  'En Revisión'),
                    ('RECT', 'Rectificado'),
                    ('RECH', 'Rechazado'),
                    ('DEV',  'Devuelto'),
                    ('FIN',  'Finalizado'),
                    ('ANU',  'Anulado'),
                ],
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name='bitacorasolicitud',
            name='estado_nuevo',
            field=models.CharField(
                blank=True, null=True,
                choices=[
                    ('BOR',  'Borrador'),
                    ('PEND', 'Pendiente'),
                    ('ASIG', 'Asignado'),
                    ('REV',  'En Revisión'),
                    ('RECT', 'Rectificado'),
                    ('RECH', 'Rechazado'),
                    ('DEV',  'Devuelto'),
                    ('FIN',  'Finalizado'),
                    ('ANU',  'Anulado'),
                ],
                max_length=10,
            ),
        ),
        migrations.RunPython(apro_to_rect, reverse_code=rect_to_apro),
    ]
