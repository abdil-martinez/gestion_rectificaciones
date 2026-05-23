from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        return response

    if isinstance(exc, IntegrityError):
        msg = str(exc)
        if 'unique' in msg.lower() or 'unicidad' in msg.lower() or 'duplicada' in msg.lower():
            detail = 'Ya existe un registro con el mismo código o datos únicos.'
        else:
            detail = 'Error de integridad en la base de datos.'
        return Response({'detail': detail}, status=status.HTTP_400_BAD_REQUEST)

    return None
