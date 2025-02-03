from rest_framework import serializers
from auth_system.models import User 

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ['id', 'username', 'first_name', 'last_name', 'image_url', 'is_active']
