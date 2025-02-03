from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Conversation(models.Model):
	participant_1 = models.ForeignKey(
		User, on_delete=models.CASCADE, related_name='conversations_as_participant_1'
	)
	participant_2 = models.ForeignKey(
		User, on_delete=models.CASCADE, related_name='conversations_as_participant_2'
	)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=['participant_1', 'participant_2'],
				name='unique_conversation_between_participants'
			)
		]

	def __str__(self):
		return f"Conversation ({self.participant_1.username}, {self.participant_2.username})"

class Message(models.Model):
	conversation = models.ForeignKey(
		Conversation, on_delete=models.CASCADE, related_name='messages'
	)
	sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
	recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
	content = models.TextField()
	timestamp = models.DateTimeField(auto_now_add=True)
	is_read = models.BooleanField(default=False)

	def __str__(self):
		return f"Message from {self.sender.username} at {self.timestamp}"

class BlockedUser(models.Model):
	blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blocking")
	blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blocked_by")
	timestamp = models.DateTimeField(auto_now_add=True)
	
	class Meta:
		unique_together = ("blocker", "blocked")
