from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('catalogos', '0003_categoria_causal_fk'),
        ('solicitudes', '0004_add_asignado_por_to_solicitud'),
    ]

    operations = [
        migrations.AddField(
            model_name='solicitud',
            name='agencia',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='solicitudes',
                to='catalogos.agencia',
            ),
        ),
    ]
