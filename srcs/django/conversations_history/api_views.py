from rest_framework import status
from time import sleep
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Conversation, Message, BlockedUser
from .serializers import ConversationSerializer, MessageSerializer
from auth_system.models import User
from .views import get_or_create_conversation, add_message_to_conversation

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_list_create(request):
	if request.method == 'GET':
		conversations = Conversation.objects.filter(
			participant_1=request.user
		) | Conversation.objects.filter(participant_2=request.user)
		
		conversations_with_last_message = []
		for conversation in conversations:
			last_message = Message.objects.filter(conversation=conversation).order_by('-timestamp').first()
			
			conversation_data = ConversationSerializer(conversation).data

			if conversation.participant_1 == request.user:
				user2 = conversation.participant_2
			else:
				user2 = conversation.participant_1
			
			conversation_data['user2_profile_picture'] = user2.image_url if user2.image_url else None
			conversation_data['user2_username'] = user2.username
			conversation_data['user2_id'] = user2.id
			conversation_data['user2_first_name'] = user2.first_name
			conversation_data['user2_last_name'] = user2.last_name

			if last_message:
				conversation_data['last_message'] = {'content': last_message.content}
			else:
				conversation_data['last_message'] = None

			conversations_with_last_message.append(conversation_data)

		return Response(conversations_with_last_message)

	elif request.method == 'POST':
		user2_id = request.data.get('user2_id')

		if not user2_id:
			return Response(
				{"error": "user2_id is required."},
				status=status.HTTP_400_BAD_REQUEST
			)
	
		user2 = get_object_or_404(User, id=user2_id)

		if request.user == user2:
			return Response(
				{"error": "You cannot create a conversation with yourself."},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		conversation = get_or_create_conversation(request.user, user2)
		serializer = ConversationSerializer(conversation)
		return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def message_create(request):
	conversation_id = request.data.get('conversation_id')
	content = request.data.get('content')

	if not conversation_id or not content:
		return Response(
		{"error": "conversation_id and content are required.", "blocked_status": 0},
		status=status.HTTP_400_BAD_REQUEST
	)
	
	conversation = get_object_or_404(Conversation, id=conversation_id)

	if request.user not in [conversation.participant_1, conversation.participant_2]:
		return Response(
		{"error": "You are not a participant in this conversation.", "blocked_status": 0},
		status=status.HTTP_403_FORBIDDEN
	)

	recipient = (
		conversation.participant_2
		if conversation.participant_1 == request.user
		else conversation.participant_1
	)

	if BlockedUser.objects.filter(blocker=request.user, blocked=recipient).exists():
		return Response({"error": "Blocked", "blocked_status": 1},
		status=status.HTTP_403_FORBIDDEN
	)
	
	if BlockedUser.objects.filter(blocker=recipient, blocked=request.user).exists():
		return Response({"error": "Blocked", "blocked_status": 2},
		status=status.HTTP_403_FORBIDDEN
	)

	message = add_message_to_conversation(conversation, request.user, recipient, content)
	serializer = MessageSerializer(message)

	return Response({"message": serializer.data, "blocked_status": 0}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
	conversation = get_object_or_404(Conversation, id=conversation_id)

	if request.user not in [conversation.participant_1, conversation.participant_2]:
		return Response(
			{"error": "You are not a participant in this conversation."},
			status=status.HTTP_403_FORBIDDEN
		)
	
	messages = Message.objects.filter(conversation=conversation)
	serializer = MessageSerializer(messages, many=True)
	return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_messages(request):
	user = request.user
	unread_messages = Message.objects.filter(recipient=user, is_read=False)
	unread_count = unread_messages.count()
	unread_conversations = unread_messages.values_list('conversation_id', flat=True).distinct()
	return Response({
		'unread_count': unread_count,
		'unread_conversations': list(unread_conversations),
	}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_messages_as_read(request, conversation_id):
	user = request.user
	unread_messages = Message.objects.filter(
		recipient=user, conversation_id=conversation_id, is_read=False
	)
	if not unread_messages.exists():
		return Response(
			{'No unread messages found in this conversation.'},
			status=status.HTTP_200_OK
		)
	unread_messages.update(is_read=True)
	return Response({'status': 'success', 'message': 'Messages marked as read.'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation_by_users(request):
	user1 = request.user
	user2_id = request.query_params.get('user2_id')

	if not user2_id:
		return Response(
			{"error": "user2_id is required."},
			status=status.HTTP_400_BAD_REQUEST
		)

	user2 = get_object_or_404(User, id=user2_id)

	conversation = Conversation.objects.filter(
		(Q(participant_1=user1) & Q(participant_2=user2)) |
		(Q(participant_1=user2) & Q(participant_2=user1))
	).first()

	if conversation:
		serializer = ConversationSerializer(conversation)
		return Response(serializer.data)
	else:
		return Response(
			{"detail": "No conversation matches the given query."},
			status=status.HTTP_404_NOT_FOUND
		)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_user(request, user_id):
	blocker = request.user
	blocked = get_object_or_404(User, id=user_id)

	if blocker == blocked:
		return Response({"error": "You cannot block yourself."}, status=status.HTTP_400_BAD_REQUEST)

	BlockedUser.objects.get_or_create(blocker=blocker, blocked=blocked)
	return Response({"success": "User has been blocked."}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unblock_user(request, user_id):
	blocker = request.user
	blocked = get_object_or_404(User, id=user_id)

	BlockedUser.objects.filter(blocker=blocker, blocked=blocked).delete()
	return Response({"success": "User has been unblocked."}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def is_user_blocked(request, user_id):
	user = get_object_or_404(User, id=user_id)

	is_blocked = BlockedUser.objects.filter(blocker=request.user, blocked=user).exists()

	return Response({"is_blocked": is_blocked}, status=status.HTTP_200_OK)
