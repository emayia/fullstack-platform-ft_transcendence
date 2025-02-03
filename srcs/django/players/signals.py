from django.db.models.signals import post_save
from django.dispatch import receiver
from auth_system.models import User
from players.services import broadcast_player_updates
from players.serializers import UserSerializer

@receiver(post_save, sender=User)
def handle_user_login_logout(sender, instance, created, **kwargs):
	if instance.is_active:
		action = 'connect'
	else:
		action = 'disconnect'

	active_players = User.objects.filter(is_active=True)
	serializer = UserSerializer(active_players, many=True)

	broadcast_player_updates(serializer.data)
