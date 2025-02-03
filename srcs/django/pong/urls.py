from django.urls import path
from .views import pong_control
from . import views

urlpatterns = [
	path('placeholder/', views.pong_placeholder, name='pong-placeholder'),
	path('pong/control/<str:game_id>/', pong_control, name='pong_control'),
]
