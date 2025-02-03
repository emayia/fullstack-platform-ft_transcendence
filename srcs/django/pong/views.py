from django.http import JsonResponse, HttpResponseBadRequest
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def pong_control(request, game_id):
	action = request.GET.get('action')
	channel_layer = get_channel_layer()

	message = {}

	if action == 'move_paddle':
		player = request.GET.get('player')
		direction = request.GET.get('direction')
		if not player or not direction:
			return HttpResponseBadRequest("Missing player or direction")
		message = {
			"action": "movePaddle",
			"player": player,
			"direction": direction
		}
	elif action == 'pause':
		message = { "action": "pauseGame" }
	elif action == 'exit':
		return JsonResponse({"status": "ignored", "action": action})
	else:
		return HttpResponseBadRequest("Unknown action")
	
	async_to_sync(channel_layer.group_send)(
		f"pong_{game_id}",
		{
			"type": "game_control",
			"message": message,
		}
	)

	return JsonResponse({"status": "success", "action": action})


def pong_placeholder(request):
	return JsonResponse({"message": "Hello from Pong! All real-time game logic is handled via WebSocket."})
