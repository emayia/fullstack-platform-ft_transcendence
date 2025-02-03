let scene, camera, renderer;
let paddle3dLeft, paddle3dRight, ball3d;
let is3DAnimating = false;

let paddleStates = {
  left: {
	isRecoiling: false,
	recoilStart: 0,
	originalX: 0
  },
  right: {
	isRecoiling: false,
	recoilStart: 0,
	originalX: 0
  }
};

const CANVAS_WIDTH  = 950;
const CANVAS_HEIGHT = 620;
const PADDLE_DEPTH  = 20;
const BALL_RADIUS   = 10;

const RECOIL_DURATION = 500;
const MAX_RECOIL      = -20;

const themeEmojis = {
  clouds: '☁️',
  sunset: '🌤️',
  cherry_blossoms: '🌸',
  nature: '🍃',
  galaxy: '✨',
  fire: '🔥'
};
let currentEmoji = themeEmojis.clouds;

document.addEventListener('themeChange', (event) => {
  const newTheme = event.detail.theme;
  currentEmoji = themeEmojis[newTheme] || themeEmojis.clouds;

  if (scene && scene.userData.ballTrail) {
	const trailSprites = scene.userData.ballTrail.sprites;
	const newEmojiTexture = createEmojiTexture(currentEmoji);
	trailSprites.forEach(sprite => {
	  sprite.material.map = newEmojiTexture;
	  sprite.material.needsUpdate = true;
	});
  }
});

function init3DRenderer() {

  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(30, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 2000);
  camera.position.set(0, 0, 1200);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true,
	powerPreference: 'default',
	preserveDrawingBuffer: false
  });

  renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const canvasContainer = document.getElementById('pong-container');
  if (!canvasContainer) {
	console.error('Could not find #pong-container to attach 3D renderer!');
	return;
  }

  canvasContainer.innerHTML = '';
  renderer.domElement.id = 'pong3d-renderer';
  canvasContainer.appendChild(renderer.domElement);
  canvasContainer.classList.remove('hidden');

  const spotlight = new THREE.SpotLight(0xffffff, 1.5);
  spotlight.position.set(0, 400, 800);
  spotlight.angle = 2.4;
  spotlight.penumbra = 0.5;
  spotlight.decay = 0.1;
  spotlight.distance = 1500;
  spotlight.castShadow = true;
  spotlight.shadow.mapSize.width  = 1024;
  spotlight.shadow.mapSize.height = 1024;
  spotlight.shadow.camera.near = 0.5;
  spotlight.shadow.camera.far  = 1500;
  spotlight.shadow.focus        = 1;
  spotlight.target.position.set(0, 0, 0);
  scene.add(spotlight.target);
  scene.add(spotlight);

  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const shape = createPaddleShape();
  const paddleGeometry = new THREE.ExtrudeGeometry(shape, {
	steps: 1,
	depth: PADDLE_DEPTH,
	bevelEnabled: false
  });
  const paddleMaterial = new THREE.MeshPhongMaterial({
	color: 0xffffff,
	specular: 0x444444,
	shininess: 15,
	emissive: 0x111111
  });

  paddle3dLeft  = new THREE.Mesh(paddleGeometry, paddleMaterial);
  paddle3dRight = new THREE.Mesh(paddleGeometry, paddleMaterial);

  paddle3dLeft.castShadow  = true;
  paddle3dRight.castShadow = true;

  paddle3dLeft.position.set(-CANVAS_WIDTH / 2 + 45, 0, 0);
  paddle3dRight.position.set( CANVAS_WIDTH / 2 - 45, 0, 0);

  scene.add(paddle3dLeft, paddle3dRight);

  const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
  const ballMaterial = new THREE.MeshPhongMaterial({
	color: 0xffffff,
	specular: 0x666666,
	shininess: 30
  });
  ball3d = new THREE.Mesh(ballGeometry, ballMaterial);
  ball3d.castShadow = true;
  scene.add(ball3d);

  initializeBallTrail(scene);

  const groundGeometry = new THREE.PlaneGeometry(CANVAS_WIDTH * 1.5, CANVAS_HEIGHT * 1.5);
  const groundMaterial = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.2 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.position.z = -50;
  ground.receiveShadow = true;
  scene.add(ground);

  is3DAnimating = true;
  animate();
}

window.init3DRenderer = init3DRenderer;

function reset3DSceneForNewMatch() {
  console.log('Resetting 3D scene objects for new match...');

  if (!scene || !camera || !paddle3dLeft || !paddle3dRight || !ball3d) {
	console.warn('3D not initialized yet. Skipping reset...');
	return;
  }

  const canvasContainer = document.getElementById('pong-container');
  if (canvasContainer) {
	canvasContainer.classList.remove('hidden');
  }

  paddle3dLeft.position.set(-CANVAS_WIDTH / 2 + 45, 0, 0);
  paddle3dRight.position.set(CANVAS_WIDTH / 2 - 45, 0, 0);

  paddleStates.left.isRecoiling   = false;
  paddleStates.left.recoilStart  = 0;
  paddleStates.right.isRecoiling = false;
  paddleStates.right.recoilStart = 0;

  ball3d.position.set(0, 0, 0);

  if (scene.userData && scene.userData.ballTrail) {
	scene.userData.ballTrail.sprites.forEach(sprite => {
	  sprite.material.opacity = 0;
	});
	scene.userData.ballTrail.currentIndex = 0;
  }
}

window.reset3DSceneForNewMatch = reset3DSceneForNewMatch;

function animate() {
  if (!is3DAnimating) return;
  window.animationFrameId = requestAnimationFrame(animate);

  if (renderer && scene && camera) {
	renderer.render(scene, camera);
  }
}

function updateGameObjects(state) {
  const canvasContainer = document.getElementById('pong-container');
  if (!renderer || !canvasContainer || canvasContainer.classList.contains('hidden')) {
	return;
  }

  if (!scene || !ball3d || !paddle3dLeft || !paddle3dRight) {
	return;
  }

  const prevBallX = ball3d.position.x;
  const ballX = state.ball_x - CANVAS_WIDTH / 2;
  const ballY = -(state.ball_y - CANVAS_HEIGHT / 2);
  ball3d.position.set(ballX, ballY, 0);

  updateBallTrail(scene, ballX, ballY);

  const leftY  = -(state.left_paddle_y  - (CANVAS_HEIGHT / 2) + 65);
  const rightY = -(state.right_paddle_y - (CANVAS_HEIGHT / 2) + 65);
  paddle3dLeft.position.y  = leftY;
  paddle3dRight.position.y = rightY;

  if (Math.abs(ballX - prevBallX) > 5) {
	const movingRight     = ballX > prevBallX;
	const nearLeftPaddle  = ballX < -CANVAS_WIDTH / 3;
	const nearRightPaddle = ballX >  CANVAS_WIDTH / 3;

	if (movingRight && nearLeftPaddle) {
	  triggerPaddleRecoil(paddle3dLeft, paddleStates.left);
	} else if (!movingRight && nearRightPaddle) {
	  triggerPaddleRecoil(paddle3dRight, paddleStates.right);
	}
  }

  const currentTime = performance.now();
  updatePaddleRecoil(paddle3dLeft,  paddleStates.left,  currentTime, true);
  updatePaddleRecoil(paddle3dRight, paddleStates.right, currentTime, false);
}
window.updateGameObjects = updateGameObjects;

async function dispose3D() {
  console.log('dispose3D() called: tearing down the 3D renderer...');

  is3DAnimating = false;
  if (window.animationFrameId) {
	cancelAnimationFrame(window.animationFrameId);
	window.animationFrameId = null;
  }

  await new Promise(resolve => setTimeout(resolve, 50));

  try {
	if (scene) {
	  scene.traverse((object) => {
		if (object.isMesh) {
		  if (object.geometry) object.geometry.dispose();
		  if (object.material) {
			if (Array.isArray(object.material)) {
			  object.material.forEach(m => disposeMaterial(m));
			} else {
			  disposeMaterial(object.material);
			}
		  }
		}
	  });

	  while (scene.children.length > 0) {
		scene.remove(scene.children[0]);
	  }
	}

	if (renderer) {
	  renderer.forceContextLoss();
	  renderer.dispose();

	  if (renderer.domElement && renderer.domElement.parentNode) {
		renderer.domElement.parentNode.removeChild(renderer.domElement);
	  }
	}
  } catch (err) {
	console.error('Error in dispose3D:', err);
  }

  const canvasContainer = document.getElementById('pong-container');
  if (canvasContainer) {
	canvasContainer.classList.add('hidden');
  }

  scene = null;
  camera = null;
  renderer = null;
  ball3d = null;
  paddle3dLeft  = null;
  paddle3dRight = null;

  console.log('3D renderer disposal complete.');
}

window.dispose3D = dispose3D;

function createPaddleShape() {
  const paddleWidth  = 18;
  const paddleHeight = 130;
  const cornerRadius = paddleWidth / 2;

  const shape = new THREE.Shape();

  shape.moveTo(-paddleWidth / 2, -paddleHeight / 2 + cornerRadius);
  shape.lineTo(-paddleWidth / 2, paddleHeight / 2 - cornerRadius);
  shape.absarc(-paddleWidth / 2 + cornerRadius, paddleHeight / 2 - cornerRadius,
			   cornerRadius, Math.PI, Math.PI / 2, true);
  shape.lineTo(paddleWidth / 2 - cornerRadius, paddleHeight / 2);
  shape.absarc(paddleWidth / 2 - cornerRadius, paddleHeight / 2 - cornerRadius,
			   cornerRadius, Math.PI / 2, 0, true);
  shape.lineTo(paddleWidth / 2, -paddleHeight / 2 + cornerRadius);
  shape.absarc(paddleWidth / 2 - cornerRadius, -paddleHeight / 2 + cornerRadius,
			   cornerRadius, 0, -Math.PI / 2, true);
  shape.lineTo(-paddleWidth / 2 + cornerRadius, -paddleHeight / 2);
  shape.absarc(-paddleWidth / 2 + cornerRadius, -paddleHeight / 2 + cornerRadius,
			   cornerRadius, -Math.PI / 2, -Math.PI, true);

  return shape;
}

function initializeBallTrail(scene) {
  const TRAIL_LENGTH = 20;
  const trailGroup = new THREE.Group();
  const emojiTexture = createEmojiTexture(currentEmoji);

  const spriteMaterial = new THREE.SpriteMaterial({
	map: emojiTexture,
	transparent: true,
	blending: THREE.AdditiveBlending,
	depthWrite: false
  });

  const trailSprites = [];
  for (let i = 0; i < TRAIL_LENGTH; i++) {
	const sprite = new THREE.Sprite(spriteMaterial.clone());
	sprite.material.opacity = 0;
	sprite.scale.set(30, 30, 1);
	trailGroup.add(sprite);
	trailSprites.push(sprite);
  }

  scene.add(trailGroup);
  scene.userData.ballTrail = {
	sprites: trailSprites,
	maxPoints: TRAIL_LENGTH,
	currentIndex: 0
  };
}

function createEmojiTexture(emoji = '⭐') {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.font = `${size * 0.8}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function updateBallTrail(scene, ballX, ballY) {
  const trailData = scene.userData.ballTrail;
  if (!trailData) return;

  const { sprites, maxPoints, currentIndex } = trailData;
  if (!trailData.rotationSpeeds) {
	trailData.rotationSpeeds = sprites.map(() => ({
	  speed: (Math.random() - 0.5) * 0.2,
	  offset: Math.random() * Math.PI * 2
	}));
  }

  const time = performance.now() * 0.001;
  const sprite = sprites[currentIndex];

  const scatterRadius = 10;
  const scatterX = ballX + (Math.random() - 0.5) * scatterRadius;
  const scatterY = ballY + (Math.random() - 0.5) * scatterRadius;
  sprite.position.set(scatterX, scatterY, 0);
  sprite.material.opacity = 1;

  trailData.currentIndex = (currentIndex + 1) % maxPoints;

  for (let i = 0; i < maxPoints; i++) {
	const idx = (trailData.currentIndex + i) % maxPoints;
	const s = sprites[idx];
	const rotationData = trailData.rotationSpeeds[idx];

	const fadeFactor = Math.pow(i / maxPoints, 1.5);
	s.material.opacity = fadeFactor;

	const rotation = time * rotationData.speed + rotationData.offset;
	s.material.rotation = rotation;

	const baseScale = 20 + (10 * fadeFactor);
	const scaleVariation = 1 + (Math.sin(time * 2 + i) * 0.1);
	const scale = baseScale * scaleVariation;
	s.scale.set(scale, scale, 1);

	if (i > 0) {
	  const driftFactor = i / maxPoints;
	  s.position.y += Math.sin(time + i) * driftFactor * 0.5;
	}
  }
}

function triggerPaddleRecoil(paddle, paddleState) {
  if (!paddleState.isRecoiling) {
	paddleState.isRecoiling = true;
	paddleState.recoilStart = performance.now();
	paddleState.originalX = paddle.position.x;
  }
}

function updatePaddleRecoil(paddle, paddleState, currentTime, isLeftPaddle) {
  if (!paddleState.isRecoiling) return;

  const elapsed = currentTime - paddleState.recoilStart;
  const progress = Math.min(elapsed / RECOIL_DURATION, 1);

  let recoilProgress;
  if (progress < 0.4) {
	recoilProgress = progress / 0.4;
  } else {
	recoilProgress = (1 - progress) / 0.6;
  }

  const recoilDirection = isLeftPaddle ? 1 : -1;
  const recoilAmount = MAX_RECOIL * recoilProgress * recoilDirection;
  paddle.position.x = paddleState.originalX + recoilAmount;

  if (progress >= 1) {
	paddleState.isRecoiling = false;
	paddle.position.x = paddleState.originalX;
  }
}

function disposeMaterial(material) {
  if (!material) return;
  for (const key in material) {
	if (material[key] && material[key].isTexture) {
	  material[key].dispose();
	}
  }
  material.dispose();
}
