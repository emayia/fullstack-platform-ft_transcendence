import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

class ChatConsumer(WebsocketConsumer):
	def connect(self):
		self.connection_open = False
		try:
			self.user_id = self.scope['url_route']['kwargs']['user_id']
			self.other_user_id = self.scope['url_route']['kwargs']['other_user_id']
			
			if not self.user_id or not self.other_user_id:
				self.close(code=4000)
				return
			
			self.room_group_name = f'chat_{min(self.user_id, self.other_user_id)}_{max(self.user_id, self.other_user_id)}'

			async_to_sync(self.channel_layer.group_add)(
				self.room_group_name,
				self.channel_name
			)

			self.accept()
			self.connection_open = True

		except Exception as e:
			self.close(code=4001)
			print(f"Error during connection: {str(e)}")


	def disconnect(self, close_code):
		try:
			if self.connection_open:
				async_to_sync(self.channel_layer.group_discard)(
					self.room_group_name,
					self.channel_name
				)
			self.connection_open = False
		except Exception as e:
			print(f"Error during disconnection: {str(e)}")
		
	def receive(self, text_data):
		try:
			text_data_json = json.loads(text_data)
			message_content = text_data_json['message']
			sender_username = text_data_json['sender']
			
			if not message_content or not sender_username:
				self.send(text_data=json.dumps({
					'type': 'error',
					'message': 'Invalid message format. Both "message" and "sender" are required.'
				}))
				return
			
			async_to_sync(self.channel_layer.group_send)(
				self.room_group_name,
				{
					'type': 'chat_message',
					'message': message_content,
					'sender': sender_username
				}
			)
		except json.JSONDecodeError:
			self.send(text_data=json.dumps({
				'type': 'error',
				'message': 'Invalid JSON format.'
			}))
		except Exception as e:
			self.send(text_data=json.dumps({
				'type': 'error',
				'message': f'An unexpected error occurred: {str(e)}'
			}))

	def chat_message(self, event):
		try:
			message = event['message']
			sender = event.get('sender', 'Anonymous')

			if not message or not sender:
				self.send(json.dumps({
					'type': 'error',
					'message': 'Invalid message format. Both "message" and "sender" are required.'
				}))
				return
			if self.connection_open:
				self.send(text_data=json.dumps({
					'type': 'chat',
					'message': message,
					'sender': sender
				}))
			else:
				self.send(text_data=json.dumps({
				'type': 'error',
				'message': 'Failed to send message, connection is closed.'
			}))
		except Exception as e:
			self.send(text_data=json.dumps({
				'type': 'error',
				'message': f'An unexpected error occurred: {str(e)}'
			}))
