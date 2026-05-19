from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response


class SoftDeleteMixin:
    """
    Reemplaza destroy() con soft delete e incorpora la acción restore/.
    Requiere que el modelo herede de AuditoriaModel.
    """

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete(user=request.user)
        return Response(
            {'detail': 'Registro eliminado. Puede restaurarlo si fue un error.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        # get_object() usa objects (SoftDeleteManager) → no encontrará borrados
        # usamos all_objects para recuperarlo
        model = self.queryset.model
        try:
            instance = model.all_objects.get(pk=pk)
        except model.DoesNotExist:
            return Response({'detail': 'Registro no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if not instance.deleted_at:
            return Response({'detail': 'El registro no está eliminado.'}, status=status.HTTP_400_BAD_REQUEST)

        instance.restore()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
