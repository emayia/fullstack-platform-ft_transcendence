from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from rest_framework.exceptions import ValidationError

def get_or_create_conversation(user1, user2):
    
	if user1 == user2:
		raise ValidationError({"detail": "Conversation creation impossible: the two users are identical."})

	participant_1, participant_2 = sorted([user1, user2], key=lambda x: x.id)

	conversation = Conversation.objects.filter(participant_1=participant_1, participant_2=participant_2).first()

	if not conversation:
			conversation = Conversation.objects.create(
			participant_1=participant_1,
			participant_2=participant_2
		)
	return conversation

def add_message_to_conversation(conversation, sender, recipient, content):

	if not content.strip():
		raise ValidationError({"detail": "Message content cannot be empty."})
	
	if len(content) > 140:
		raise ValidationError({"detail:": "Message content cannot exceed 140 characters."})

	if sender not in [conversation.participant_1, conversation.participant_2]:
		raise ValidationError({"detail": "Sender must be a participant of the conversation."})
	
	message = Message.objects.create(
		conversation=conversation,
		sender=sender,
		recipient=recipient,
		content=content
	)
	message.is_read = False
	message.save()
	return message
