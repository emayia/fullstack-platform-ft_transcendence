from django.contrib import admin
from django.conf.urls.i18n import i18n_patterns, set_language
from django.urls import path, include
from transcendence import views

urlpatterns = [
	path('', views.home, name='home'),
	path('admin/', admin.site.urls),
	path('auth/', include('auth_system.urls')),
	path('api/', include('auth_system.urls')),
	path('api/', include('players.urls')),
	path('api/', include('conversations_history.urls')),
	path('api/', include('pong.urls')),
]

urlpatterns += i18n_patterns(
	path('set-language/', set_language, name='set_language'),
)
