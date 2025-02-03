from django.contrib.auth import logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status

@api_view(['GET'])
@permission_classes([IsAuthenticated]) 
def user_profile(request):
	user = request.user
	user_info = {
		'id': user.id,
		'username': user.username,
		'first_name': user.first_name,
		'last_name': user.last_name,
		'image_url': getattr(user, 'image_url', '/default_image.png'),
	}
	return Response(user_info, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated]) 
def api_logout_view(request):
	user = request.user
	logout(request)
	request.session.flush()

	refresh_token_cookie = request.COOKIES.get('refresh_token')
	if refresh_token_cookie:
		refresh_token = RefreshToken(refresh_token_cookie)
		refresh_token.blacklist()

	user.is_active = False
	user.is_in_game = False
	user.save()
	 
	response = Response(
		{"message": "You have been successfully logged out."},
		status=status.HTTP_200_OK
	)
	response.delete_cookie('access_token', path='/')
	response.delete_cookie('refresh_token', path='/')
	return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_token(request):
	refresh_token_cookie = request.COOKIES.get('refresh_token')

	if not refresh_token_cookie:
		return Response(
			{'error': 'No refresh token found in your cookies. Please log in again.'},
			status=status.HTTP_400_BAD_REQUEST
		)

	try:
		refresh_token = RefreshToken(refresh_token_cookie)
		new_access_token = str(refresh_token.access_token)
		response = Response(
			{'message': 'Access token successfully refreshed.', 'access_token': new_access_token},
			status=status.HTTP_200_OK
		)
		response.set_cookie('access_token', new_access_token, httponly=True, secure=True, path='/')
		return response
	except Exception as e:
		return Response(
			{'error': f'Failed to refresh token. Please log in again. Details: {str(e)}'},
			status=status.HTTP_400_BAD_REQUEST
		)
