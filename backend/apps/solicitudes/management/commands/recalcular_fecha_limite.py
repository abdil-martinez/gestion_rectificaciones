import datetime
from django.core.management.base import BaseCommand
from apps.solicitudes.models import Solicitud
from apps.catalogos.models import EstadoPlazo


class Command(BaseCommand):
    help = 'Recalcula fecha_limite para solicitudes abiertas usando EstadoPlazo "En Plazo"'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Muestra los cambios sin aplicarlos',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        en_plazo = EstadoPlazo.objects.filter(nombre__iexact='En Plazo').first()
        if not en_plazo:
            self.stdout.write(self.style.ERROR('No se encontró el estado "En Plazo" en EstadoPlazo'))
            return

        dias_plazo = en_plazo.limite_dias
        self.stdout.write(f'EstadoPlazo "En Plazo": {dias_plazo} días')

        ESTADOS_CERRADOS = ['FIN', 'RECT', 'RECH']
        solicitudes = Solicitud.objects.exclude(estado__in=ESTADOS_CERRADOS)
        self.stdout.write(f'Solicitudes abiertas: {solicitudes.count()}')

        to_update = []
        for sol in solicitudes:
            base = sol.fecha_recepcion or sol.created_at.date()
            nueva = base + datetime.timedelta(days=dias_plazo)
            if sol.fecha_limite != nueva:
                self.stdout.write(f'  {sol.numero_solicitud}: {sol.fecha_limite} -> {nueva}')
                sol.fecha_limite = nueva
                to_update.append(sol)

        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: {len(to_update)} solicitudes serían actualizadas')
            )
        else:
            Solicitud.objects.bulk_update(to_update, ['fecha_limite'])
            self.stdout.write(
                self.style.SUCCESS(f'Completado: {len(to_update)} solicitudes actualizadas')
            )
