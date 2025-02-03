import os
import logging
import requests
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import redirect
from django.contrib.auth import login, get_user_model
from .utils import read_secret
from rest_framework_simplejwt.tokens import RefreshToken
from django.dispatch import Signal

User = get_user_model()

logger = logging.getLogger(__name__)

user_logged_in_signal = Signal()

def save_user_info(user_info):
	username = user_info.get('login', 'Unknown')
	first_name = user_info.get('first_name', 'Unknown')
	last_name = user_info.get('last_name', 'Unknown')
	image_url = user_info.get('image', {}).get('versions', {}).get('medium', '')

	user, created = User.objects.update_or_create(
		username=username,
		defaults={
			'first_name': first_name,
			'last_name': last_name,
			'image_url': image_url,
			'is_active': True,
		}
	)
	return user

def login_with_42(request):
	client_id = read_secret('client_id')
	redirect_uri = os.getenv('REDIRECT_URI')
	scope = 'public'
	url = f'https://api.intra.42.fr/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}'
	logger.info('Redirecting to 42 authentication.')
	return redirect(url)

def auth_callback(request):
	code = request.GET.get('code')
	token_url = 'https://api.intra.42.fr/oauth/token'
	client_id = read_secret('client_id')
	client_secret = read_secret('client_secret')
	redirect_uri = os.getenv('REDIRECT_URI')

	data = {
		'grant_type': 'authorization_code',
		'client_id': client_id,
		'client_secret': client_secret,
		'redirect_uri': redirect_uri,
		'code': code
	}
	response = requests.post(token_url, data=data)
	if response.status_code != 200:
		logger.error('Error retrieving access token: %s', response.json())
		return HttpResponse('Error retrieving access token.', status=400)
	
	response_data = response.json()

	access_token_42 = response_data.get('access_token')
	if not access_token_42:
		logger.error('Access token not found in response: %s', response_data)
		return HttpResponse('Error: Access token not found.', status=400)

	user_info_url = 'https://api.intra.42.fr/v2/me'
	headers = {
		'Authorization': f'Bearer {access_token_42}'
	}
	user_info_response = requests.get(user_info_url, headers=headers)
	if user_info_response.status_code != 200:
		return HttpResponse('Error retrieving user information.', status=400)
	
	user_info = user_info_response.json()

	user = save_user_info(user_info)
	
	refresh = RefreshToken.for_user(user)
	access_token_jwt = str(refresh.access_token)
	refresh_token_jwt = str(refresh)

	user_logged_in_signal.send(sender=User, instance=user)
	
	login(request, user)

	response = redirect('/')
	response.set_cookie(
		key='access_token',
		value=access_token_jwt,
		max_age=settings.JWT_COOKIE_MAX_AGE,
		httponly=True,
		secure=True,
		samesite='Lax',
		path='/',
	)
	response.set_cookie(
		key='refresh_token',
		value=refresh_token_jwt,
		max_age=settings.JWT_COOKIE_MAX_AGE * 24 * 7,
		httponly=True,
		secure=True,
		samesite='Lax',
		path='/',
	)
	logger.info(f'User authenticated successfully.')
	return response
