import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from autobahn.exception import Disconnected
from asgiref.sync import sync_to_async
from .game_store import pong_store

class PongConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		self.game_id = self.scope['url_route']['kwargs']['game_id']
		self.group_name = f"pong_{self.game_id}"

		await self.channel_layer.group_add(self.group_name, self.channel_name)
		await self.accept()

		await sync_to_async(pong_store.get_or_create_game)(self.game_id, "local")

		self.update_task = asyncio.create_task(self.game_loop())

	async def disconnect(self, close_code):
		self.update_task.cancel()

		await self.channel_layer.group_discard(self.group_name, self.channel_name)

	async def receive(self, text_data):
		data = json.loads(text_data)
		action = data.get('action')

		game = await sync_to_async(pong_store.get_or_create_game)(self.game_id)

		if action == 'startGame':
			mode = data.get('mode', 'local')
			await sync_to_async(game.reset)()
			game.mode = mode
			game.start()
			await self.send_game_state()

		elif action == 'movePaddle':
			player = data.get('player')
			direction = data.get('direction')
			await sync_to_async(game.move_paddle)(player, direction)

		elif action == 'pauseGame':
			await sync_to_async(game.pause)()
			await self.send_game_state()

		elif action == 'unpauseGame':
			await sync_to_async(game.unpause)()
			await self.send_game_state()

		elif action == 'exitGame':
			await sync_to_async(game.stop)()
			await sync_to_async(game.reset)()
			await self.send_game_state()
			pong_store.remove_game(self.game_id)
			await self.close()

		elif action == 'getStatus':
			await self.send_game_state()

	async def send_game_state(self):
		game = pong_store.games.get(self.game_id, None)
		if game is None:
			return
		status = await sync_to_async(game.get_status)()
		await self.channel_layer.group_send(
			self.group_name,
			{
				"type": "pong.update",
				"payload": status
			}
		)

	async def pong_update(self, event):
		try:
			payload = event["payload"]
			await self.send(text_data=json.dumps(payload))
		except Disconnected:
			pass

	async def game_loop(self):
		try:
			while True:
				game = pong_store.games.get(self.game_id, None)
				if game and game.running and not game.game_over:
					await game.update()
					await self.send_game_state()
				await asyncio.sleep(1/60)
		except asyncio.CancelledError:
			pass

	async def game_control(self, event):
		message = event['message']
		action = message.get('action')

		game = pong_store.games.get(self.game_id, None)
		if not game:
			return

		if action == "movePaddle":
			player = message.get('player')
			direction = message.get('direction')
			await sync_to_async(game.move_paddle)(player, direction)

		elif action == "pauseGame":
			await sync_to_async(game.pause)()

		elif action == "unpauseGame":
			await sync_to_async(game.unpause)()

		await self.send_game_state()
