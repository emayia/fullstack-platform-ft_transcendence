import os

def read_secret(secret_name):
	"""Read the secret from the Docker secret file."""
	try:
		with open(f'/run/secrets/{secret_name}') as f:
			return f.read().strip()
	except IOError:
		return None
	