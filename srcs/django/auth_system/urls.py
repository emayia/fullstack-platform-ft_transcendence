from django.urls import path
from . import views
from . import api_views

urlpatterns = [
	path('login/', views.login_with_42, name='login_with_42'),
	path('callback/', views.auth_callback, name='auth_callback'),
	
	path('logout/', api_views.api_logout_view, name='logout'),
	path('user/profile/', api_views.user_profile, name='user_profile'),

	path('refresh-token/', api_views.refresh_token, name='refresh_token'),
]
