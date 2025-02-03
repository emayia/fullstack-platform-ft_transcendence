from django.urls import path
from . import api_views

urlpatterns = [
	path('conversations/', api_views.conversation_list_create, name='conversation-list-create'),
	path('conversations/<int:conversation_id>/messages/', api_views.get_messages, name='get-messages'),
	path('conversations/by-users/', api_views.get_conversation_by_users, name='conversation-by-users'),
	
	path('messages/', api_views.message_create, name='message-create'),
	path('messages/unread-messages/', api_views.get_unread_messages, name='get_unread_messages'),
	path('messages/<int:conversation_id>/mark-as-read/', api_views.mark_messages_as_read, name='mark_messages_as_read'),
	
	path('users/block/<int:user_id>/', api_views.block_user, name='block-user'),
	path('users/unblock/<int:user_id>/', api_views.unblock_user, name='unblock-user'),
	path('users/is_blocked/<int:user_id>/', api_views.is_user_blocked, name='is_user_blocked'),
]
