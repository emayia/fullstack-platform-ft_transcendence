from django.urls import path
from . import api_views

urlpatterns = [
	path('active-players/', api_views.active_players, name='active-players'),
]
