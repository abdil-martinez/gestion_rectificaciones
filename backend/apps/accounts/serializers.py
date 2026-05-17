from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    regional_nombre = serializers.CharField(source='regional.nombre', read_only=True)
    unidad_nombre   = serializers.CharField(source='unidad.nombre', read_only=True)
    agencia_nombre  = serializers.CharField(source='agencia.nombre', read_only=True)
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model  = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'rol', 'regional', 'regional_id', 'regional_nombre',
            'unidad', 'unidad_id', 'unidad_nombre',
            'agencia', 'agencia_id', 'agencia_nombre',
            'telefono', 'avatar', 'is_active', 'date_joined',
            'nombre_completo',
        ]
        read_only_fields = ['id', 'date_joined']

    def get_nombre_completo(self, obj):
        return obj.nombre_completo


class UserCreateSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'rol', 'regional', 'unidad', 'agencia', 'telefono', 'password', 'password2',
        ]

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este correo electrónico.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CustomUser
        fields = [
            'email', 'first_name', 'last_name',
            'rol', 'regional', 'unidad', 'agencia', 'telefono', 'avatar',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Las nuevas contraseñas no coinciden."})
        return attrs


class LoginResponseSerializer(serializers.Serializer):
    access        = serializers.CharField()
    refresh       = serializers.CharField()
    user          = UserSerializer()
