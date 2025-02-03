import time
import random
import asyncio

class PongGameState:

	def __init__(self, game_id: str, mode: str = "local"):
		self.game_id = game_id
		self.mode = mode
		self.canvas_width = 950
		self.canvas_height = 620
		self.paddle_width = 18
		self.paddle_height = 130
		self.ball_radius = 10
		self.is_paused = False

		self.reset()

		self.bot_speed = 10
		self.refresh_interval = 1
		self.error_margin = 0.2
		self.last_update_time = time.time()
		self.bot_target_y = None

		self.running = False

	def reset(self):
		self.left_paddle_y = self.canvas_height / 2 - self.paddle_height / 2
		self.right_paddle_y = self.canvas_height / 2 - self.paddle_height / 2
		self.ball_x = self.canvas_width / 2
		self.ball_y = self.canvas_height / 2
		self.ball_dx = random.uniform(8, 10) * random.choice([-1, 1])
		self.ball_dy = random.uniform(-8, 8)
		self.score_left = 0
		self.score_right = 0
		self.game_over = False
		self.winner = None

	def pause(self):
		self.is_paused = True

	def unpause(self):
		self.is_paused = False

	def start(self):
		self.running = True

	def stop(self):
		self.running = False

	def move_paddle(self, player, direction):
		if self.mode not in ['local', 'ai']:
			return
		speed = 10
		if player == "left":
			if direction == "up":
				self.left_paddle_y = max(0, self.left_paddle_y - speed)
			elif direction == "down":
				self.left_paddle_y = min(self.canvas_height - self.paddle_height, self.left_paddle_y + speed)
		elif player == "right":
			if direction == "up":
				self.right_paddle_y = max(0, self.right_paddle_y - speed)
			elif direction == "down":
				self.right_paddle_y = min(self.canvas_height - self.paddle_height, self.right_paddle_y + speed)

	async def update(self, dt=1/60):
		if not self.running or self.game_over or self.is_paused:
			return

		if self.mode == "ai":
			self._update_ai()

		self.ball_x += self.ball_dx
		self.ball_y += self.ball_dy

		if self.ball_y - self.ball_radius <= 0:
			self.ball_y = self.ball_radius
			self.ball_dy = -self.ball_dy
		elif self.ball_y + self.ball_radius >= self.canvas_height:
			self.ball_y = self.canvas_height - self.ball_radius
			self.ball_dy = -self.ball_dy

		if self.ball_x - self.ball_radius <= 0:
			self.score_right += 1
			if self.score_right >= 10:
				self.game_over = True
				self.winner = "Right Player"
				self.stop()
			else:
				self._reset_ball(direction_multiplier=1)

		elif self.ball_x + self.ball_radius >= self.canvas_width:
			self.score_left += 1
			if self.score_left >= 10:
				self.game_over = True
				self.winner = "Left Player"
				self.stop()
			else:
				self._reset_ball(direction_multiplier=-1)

		self._check_paddle_collision_left()
		self._check_paddle_collision_right()

	def get_status(self):
		"""Return current game state including pause state."""
		return {
			"game_id": self.game_id,
			"mode": self.mode,
			"running": self.running,
			"game_over": self.game_over,
			"is_paused": self.is_paused,
			"winner": self.winner,
			"score_left": self.score_left,
			"score_right": self.score_right,
			"ball_x": self.ball_x,
			"ball_y": self.ball_y,
			"ball_dx": self.ball_dx,
			"ball_dy": self.ball_dy,
			"left_paddle_y": self.left_paddle_y,
			"right_paddle_y": self.right_paddle_y
		}


	def _reset_ball(self, direction_multiplier):
		self.ball_x = self.canvas_width / 2
		self.ball_y = self.canvas_height / 2
		self.ball_dx = random.uniform(8, 10) * direction_multiplier
		self.ball_dy = random.uniform(-8, 8)

	def _check_paddle_collision_left(self):
		if (self.ball_dx < 0 and
			self.left_paddle_y <= self.ball_y <= self.left_paddle_y + self.paddle_height and
			self.ball_x - self.ball_radius <= self.paddle_width + 45):
			impact = (self.ball_y - (self.left_paddle_y + self.paddle_height/2)) / (self.paddle_height/2)
			impact = max(min(impact, 0.8), -0.8)
			
			self.ball_dx = -self.ball_dx * 1.05
			if abs(self.ball_dx) > 20:
				self.ball_dx = -20 if self.ball_dx < 0 else 20
			
			self.ball_dy = impact * 8
			self.ball_x = self.paddle_width + 45 + self.ball_radius + 1


	def _check_paddle_collision_right(self):
		if (self.ball_dx > 0 and
			self.right_paddle_y <= self.ball_y <= self.right_paddle_y + self.paddle_height and
			self.ball_x + self.ball_radius >= self.canvas_width - self.paddle_width - 45):
			impact = (self.ball_y - (self.right_paddle_y + self.paddle_height/2)) / (self.paddle_height/2)
			impact = max(min(impact, 0.8), -0.8)
			
			self.ball_dx = -self.ball_dx * 1.05
			if abs(self.ball_dx) > 20:
				self.ball_dx = -20 if self.ball_dx < 0 else 20
			
			self.ball_dy = impact * 8
			self.ball_x = self.canvas_width - self.paddle_width - 45 - self.ball_radius - 1

	def _predict_ball_y(self):
		predicted_x = self.ball_x
		predicted_y = self.ball_y
		dx = self.ball_dx
		dy = self.ball_dy

		opponent_paddle_x = self.paddle_width + 45
		ai_paddle_x = self.canvas_width - self.paddle_width - 45

		opponent_center = self.left_paddle_y + self.paddle_height / 2

		dt = 0.005

		while predicted_x < ai_paddle_x:
			predicted_x += dx * dt
			predicted_y += dy * dt

			if predicted_y - self.ball_radius < 0:
				predicted_y = self.ball_radius + (self.ball_radius - predicted_y)
				dy = -dy
			elif predicted_y + self.ball_radius > self.canvas_height:
				predicted_y = self.canvas_height - self.ball_radius - (predicted_y + self.ball_radius - self.canvas_height)
				dy = -dy

			if dx < 0 and predicted_x - self.ball_radius <= opponent_paddle_x:
				impact = (predicted_y - opponent_center) / (self.paddle_height / 2)
				impact = max(min(impact, 0.8), -0.8)

				dx = -dx * 1.05
				dy = impact * 8

				predicted_x = opponent_paddle_x + self.ball_radius + 1

		return predicted_y
	
	
	def _update_ai(self):
		current_time = time.time()
		if current_time - self.last_update_time >= self.refresh_interval:
			self.last_update_time = current_time
			predicted_y = self._predict_ball_y()
			predicted_y += random.uniform(-self.error_margin, self.error_margin)
			self.bot_target_y = predicted_y

		if self.bot_target_y is not None:
			paddle_center = self.right_paddle_y + self.paddle_height / 2
			if self.bot_target_y < paddle_center - 10:
				self.right_paddle_y -= self.bot_speed
			elif self.bot_target_y > paddle_center + 10:
				self.right_paddle_y += self.bot_speed
			self.right_paddle_y = max(0, min(self.canvas_height - self.paddle_height, self.right_paddle_y))


class PongGameStore:
	def __init__(self):
		self.games = {}

	def get_or_create_game(self, game_id, mode="local"):
		if game_id not in self.games:
			self.games[game_id] = PongGameState(game_id, mode)
		return self.games[game_id]

	def remove_game(self, game_id):
		if game_id in self.games:
			del self.games[game_id]

	def list_game_ids(self):
		return list(self.games.keys())

pong_store = PongGameStore()
