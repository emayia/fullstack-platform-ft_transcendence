from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer
from auth_system.models import User

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_players(request):
	active_players = User.objects.filter(is_active=True)

	serializer = UserSerializer(active_players, many=True)
	
	return Response(serializer.data)
