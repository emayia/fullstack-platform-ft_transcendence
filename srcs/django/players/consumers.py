import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

class PlayerConsumer(WebsocketConsumer):
	def connect(self):
		self.room_group_name = "players_updates"
		self.user = self.scope.get('user') 

		if self.user.is_authenticated:
			async_to_sync(self.channel_layer.group_add)(
				self.room_group_name,
				self.channel_name
			)
			self.accept()
		else:
			self.close()

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.room_group_name,
			self.channel_name
		)
		if self.user.is_authenticated:
			self.user.is_active = False
			self.user.save()

	def update_players(self, event):
		players = event["players"]
		self.send(text_data=json.dumps({
			'players': players
		}))
	
