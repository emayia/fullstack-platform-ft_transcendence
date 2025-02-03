from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
	username = models.CharField(max_length=30, unique=True)
	first_name = models.CharField(max_length=30)
	last_name = models.CharField(max_length=30)
	image_url = models.URLField(max_length=500, null=True, blank=True)
	is_staff = models.BooleanField(default=False)
	is_active = models.BooleanField(default=True)
	is_in_game = models.BooleanField(default=False)
	date_joined = models.DateTimeField(auto_now_add=True)

	USERNAME_FIELD = 'username'
	REQUIRED_FIELDS = ['first_name', 'last_name']

	def __str__(self):
		return self.username
