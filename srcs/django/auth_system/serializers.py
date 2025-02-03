from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ['id', 'username', 'first_name', 'last_name', 'image_url', 'is_active', 'is_in_game', 'date_joined']
		read_only_fields = ['id', 'username', 'first_name', 'lastname', 'image_url', 'date_joined']
