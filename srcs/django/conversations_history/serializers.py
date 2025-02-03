from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
	sender = serializers.StringRelatedField()

	class Meta:
		model = Message
		fields = ['id', 'sender', 'content', 'timestamp']

class ConversationSerializer(serializers.ModelSerializer):
	participant_1 = serializers.StringRelatedField()
	participant_2 = serializers.StringRelatedField()
	messages = MessageSerializer(many=True)

	class Meta:
		model = Conversation
		fields = ['id', 'participant_1', 'participant_2', 'created_at', 'messages']
