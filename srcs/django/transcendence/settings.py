from pathlib import Path
from datetime import timedelta
from django.utils.translation import gettext_lazy as _
import os

def read_secret(secret_name):
	try:
		with open(f'/run/secrets/{secret_name}') as f:
			return f.read().strip()
	except IOError:
		return None

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = read_secret('django_secret_key'),

DEBUG = False

ALLOWED_HOSTS =  [
	'localhost',
	'127.0.0.1',
]

CSRF_TRUSTED_ORIGINS = [
	'https://localhost:8443',
	'https://127.0.0.1',
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

if not DEBUG:
	SESSION_COOKIE_SECURE = True
	CSRF_COOKIE_SECURE = True
	SESSION_COOKIE_AGE = 60 * 60 * 24

AUTH_USER_MODEL = 'auth_system.User'

INSTALLED_APPS = [
	'channels',
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
	'rest_framework',
	'rest_framework_simplejwt.token_blacklist',
	'pong',
	'whitenoise.runserver_nostatic',
	'auth_system',
	'players',
	'conversations_history',
	'chat',
]

ASGI_APPLICATION = 'transcendence.asgi.application'

CHANNEL_LAYERS = {
	'default': {
		'BACKEND': 'channels.layers.InMemoryChannelLayer',
	},
}

MIDDLEWARE = [
	'django.middleware.security.SecurityMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'django.middleware.locale.LocaleMiddleware',
	'django.middleware.common.CommonMiddleware',
	'django.middleware.csrf.CsrfViewMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
	'django.middleware.clickjacking.XFrameOptionsMiddleware',
	'whitenoise.middleware.WhiteNoiseMiddleware',
]

ROOT_URLCONF = 'transcendence.urls'

TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [BASE_DIR / 'transcendence' / 'templates'],
		'APP_DIRS': True,
		'OPTIONS': {
			'context_processors': [
				'django.template.context_processors.debug',
				'django.template.context_processors.request',
				'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages',
			],
		},
	},
]

WSGI_APPLICATION = 'transcendence.wsgi.application'

import os

DATABASES = {
	'default': {
		'ENGINE': 'django.db.backends.postgresql',
		'NAME': os.getenv('POSTGRES_DB'),
		'USER': os.getenv('POSTGRES_USER'),
		'PASSWORD': read_secret('postgres_password'),
		'HOST': os.getenv('POSTGRES_HOST'),
		'PORT': os.getenv('POSTGRES_PORT'),
	}
}

AUTH_PASSWORD_VALIDATORS = [
	{
		'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
	},
]

REST_FRAMEWORK = {
	'DEFAULT_AUTHENTICATION_CLASSES': [
		'auth_system.authentication.CookieJWTAuthentication',
	],
	'DEFAULT_PERMISSION_CLASSES': [
		'rest_framework.permissions.IsAuthenticated',
	],
	'DEFAULT_RENDERER_CLASSES': [
		'rest_framework.renderers.JSONRenderer',
	],
}

LOGIN_URL = '/auth/login/'

SIMPLE_JWT = {
	'SIGNING_KEY': read_secret('jwt_signing_key'),
	'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
	'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
	'ROTATE_REFRESH_TOKENS': True,
	'BLACKLIST_AFTER_ROTATION': True,
	'UPDATE_LAST_LOGIN': True,

	'AUTH_COOKIE': 'access_token',
	'AUTH_COOKIE_DOMAIN': None,
	'AUTH_COOKIE_SECURE': True,
	'AUTH_COOKIE_HTTP_ONLY': True,
	'AUTH_COOKIE_PATH': '/',
	'AUTH_COOKIE_SAMESITE': 'Lax',
}

JWT_COOKIE_MAX_AGE = 3600

LANGUAGE_CODE = 'en'

LANGUAGES = [
	('en', 'English'),
	('fr', 'Français'),
	('ko', '한국어'),
	('ru', 'Русский'),
]

LOCALE_PATHS = [
	os.path.join(BASE_DIR, 'transcendence', 'locale'),
]

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

STATIC_URL = 'static/'

STATICFILES_DIRS = [
	BASE_DIR / 'static',
]

STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
