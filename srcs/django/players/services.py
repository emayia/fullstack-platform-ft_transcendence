from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def broadcast_player_updates(players):
	channel_layer = get_channel_layer()

	async_to_sync(channel_layer.group_send)(
			"players_updates",
			{
				"type": "update_players",
				"players": players,
			}
		)
