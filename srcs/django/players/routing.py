from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/players/$', consumers.PlayerConsumer.as_asgi()),
]
