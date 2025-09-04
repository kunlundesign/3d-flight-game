// 纸飞机飞行游戏 - Three.js实现
let scene, camera, renderer, glider, clock;
let speed = 2.0, maxSpeed = 4.0, minSpeed = 1.0;
let velocity = new THREE.Vector3();
let isRaining = false, rainParticles = [], clouds = [];
let keys = {};
let bullets = []; // 存储子弹
let bombs = []; // 存储炸弹
let isShooting = false; // 射击状态
let lastShotTime = 0; // 上次射击时间
let lastBombTime = 0; // 上次投弹时间
const SHOT_COOLDOWN = 100; // 射击冷却时间（毫秒）
const BOMB_COOLDOWN = 1000; // 投弹冷却时间（毫秒）
let targets = []; // 存储地面目标
let score = 0; // 分数
let tanksDestroyed = 0; // 摧毁的坦克数量

// 等待Three.js加载完成
window.addEventListener('load', function() {
  if (typeof THREE !== 'undefined') {
    init();
    animate();
  } else {
    console.error('Three.js未加载成功');
    document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 200px;">Three.js加载失败，请检查网络连接</h1>';
  }
});

function init() {
  // 场景设置
  scene = new THREE.Scene();
  
  // Enhanced fog for depth
  scene.fog = new THREE.Fog(0x87CEEB, 200, 800);

  // 摄像机设置
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000);
  camera.position.set(0, 105, -20); // Position camera behind the plane (negative Z)
  camera.lookAt(0, 100, 0); // Look at the plane's initial position

  // 渲染器设置 - enhanced quality
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x87CEEB, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  // Enhanced renderer settings
  renderer.shadowMap.autoUpdate = true;
  renderer.physicallyCorrectLights = true;
  document.body.appendChild(renderer.domElement);

  // 创建地形
  createTerrain();
  
  // 创建纸飞机
  createPaperPlane();
  
  // 创建环境
  createEnvironment();
  
  // 创建光源
  createLights();
  
  // 创建雨效果
  createRain();

  // 事件监听
  setupEventListeners();
  
  clock = new THREE.Clock();
  
  // Initialize sky colors after everything is set up
  updateSkyColors();
  
  console.log('游戏初始化完成');
}

function createSkybox() {
  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    'textures/skybox/px.jpg', // Positive X
    'textures/skybox/nx.jpg', // Negative X
    'textures/skybox/py.jpg', // Positive Y
    'textures/skybox/ny.jpg', // Negative Y
    'textures/skybox/pz.jpg', // Positive Z
    'textures/skybox/nz.jpg'  // Negative Z
  ]);
  scene.background = texture;
}

function updateSkyColors() {
  const time = Date.now() * 0.0001;
  const dayPhase = (Math.sin(time) + 1) / 2; // 0 to 1

  const skyColorDay = new THREE.Color(0x87CEEB);    // Light blue
  const skyColorSunset = new THREE.Color(0xFF7F50); // Orange

  const currentSkyColor = skyColorDay.clone().lerp(skyColorSunset, dayPhase * 0.3);
  
  // Only update fog color if fog exists
  if (scene && scene.fog) {
    scene.fog.color = currentSkyColor;
  }
}

function createTerrain() {
  // Create simple forest landscape
  createForestGround();
  
  // Create rivers
  createRivers();
  
  // Create distant mountains
  createMountainRanges();
  
  // Create ground targets
  createGroundTargets();
}

function createForestGround() {
  // Create main ground plane
  const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 50, 50);
  const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0x228B22, // Forest green
    flatShading: true
  });
  
  // Add some height variation to the ground
  const vertices = groundGeometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i + 2] += (Math.random() - 0.5) * 10; // Random height variation
  }
  groundGeometry.attributes.position.needsUpdate = true;
  groundGeometry.computeVertexNormals();
  
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -50;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Add forest trees randomly across the landscape
  for (let i = 0; i < 200; i++) {
    const x = (Math.random() - 0.5) * 1800;
    const z = (Math.random() - 0.5) * 1800;
    createSimpleTree(x, -45, z);
  }
}

function createSimpleTree(x, y, z) {
  const treeGroup = new THREE.Group();
  
  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 8, 6);
  const trunkMaterial = new THREE.MeshLambertMaterial({
    color: 0x8B4513,
    flatShading: true
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 4;
  trunk.castShadow = true;
  treeGroup.add(trunk);
  
  // Leaves - simple cone shape
  const leavesGeometry = new THREE.ConeGeometry(3 + Math.random() * 2, 6 + Math.random() * 3, 8);
  const leafColors = [0x228B22, 0x32CD32, 0x006400, 0x90EE90];
  const leavesMaterial = new THREE.MeshLambertMaterial({
    color: leafColors[Math.floor(Math.random() * leafColors.length)],
    flatShading: true
  });
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.y = 10;
  leaves.castShadow = true;
  treeGroup.add(leaves);
  
  treeGroup.position.set(x, y, z);
  scene.add(treeGroup);
}

function createRivers() {
  // Create winding river
  const riverPoints = [
    new THREE.Vector3(-800, -48, -600),
    new THREE.Vector3(-400, -48, -300),
    new THREE.Vector3(0, -48, 0),
    new THREE.Vector3(400, -48, 300),
    new THREE.Vector3(800, -48, 600)
  ];
  
  const curve = new THREE.CatmullRomCurve3(riverPoints);
  const riverGeometry = new THREE.TubeGeometry(curve, 50, 15, 8, false);
  const riverMaterial = new THREE.MeshLambertMaterial({
    color: 0x4682B4,
    transparent: true,
    opacity: 0.8,
    flatShading: true
  });
  
  const river = new THREE.Mesh(riverGeometry, riverMaterial);
  river.receiveShadow = true;
  scene.add(river);
  
  // Add smaller streams
  const streamPoints1 = [
    new THREE.Vector3(-600, -48, 200),
    new THREE.Vector3(-300, -48, 100),
    new THREE.Vector3(0, -48, 0)
  ];
  
  const streamCurve1 = new THREE.CatmullRomCurve3(streamPoints1);
  const streamGeometry1 = new THREE.TubeGeometry(streamCurve1, 20, 8, 6, false);
  const stream1 = new THREE.Mesh(streamGeometry1, riverMaterial);
  scene.add(stream1);
}

function createMountainRanges() {
  // Create distant mountain ranges
  const mountainConfigs = [
    // Background mountains
    { pos: [0, -20, -800], size: [200, 150, 100], color: 0x696969 },
    { pos: [-300, -15, -750], size: [150, 120, 80], color: 0x708090 },
    { pos: [350, -25, -780], size: [180, 140, 90], color: 0x778899 },
    
    // Side mountains
    { pos: [-600, -10, -400], size: [120, 100, 60], color: 0x696969 },
    { pos: [650, -15, -350], size: [140, 110, 70], color: 0x708090 },
    
    // Closer hills
    { pos: [-400, -30, -200], size: [80, 60, 40], color: 0x8FBC8F },
    { pos: [450, -25, -250], size: [90, 70, 50], color: 0x9ACD32 }
  ];

  mountainConfigs.forEach(config => {
    const mountainGeometry = new THREE.ConeGeometry(
      config.size[0] * 0.7,
      config.size[1],
      8, // Low poly sides
      1
    );
    
    const mountainMaterial = new THREE.MeshLambertMaterial({
      color: config.color,
      flatShading: true,
      transparent: true,
      opacity: 0.8
    });
    
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain.position.set(...config.pos);
    mountain.receiveShadow = true;
    mountain.castShadow = true;
    scene.add(mountain);
  });
}

function createGroundTargets() {
  targets = []; // Reset targets array
  
  // 创建绿色坦克目标
  const tankPositions = [
    [200, -40, 300],
    [-300, -40, 200],
    [400, -40, -100],
    [-200, -40, -200],
    [100, -40, 400],
    [-400, -40, 100],
    [300, -40, -300],
    [-100, -40, -400],
    [150, -40, 150],
    [-150, -40, -150],
    [250, -40, -200],
    [-250, -40, 250],
  ];

  tankPositions.forEach(pos => {
    createTankTarget(pos);
  });
}

function createTankTarget(position) {
  const tankGroup = new THREE.Group();
  
  // 坦克绿色材质
  const tankBodyMaterial = new THREE.MeshLambertMaterial({
    color: 0x2E7D32, // 深绿色
    flatShading: true
  });
  
  const tankDetailMaterial = new THREE.MeshLambertMaterial({
    color: 0x1B5E20, // 更深的绿色
    flatShading: true
  });
  
  const tankLightMaterial = new THREE.MeshLambertMaterial({
    color: 0x43A047, // 浅绿色
    flatShading: true
  });
  
  // 坦克主体（车身）
  const bodyGeometry = new THREE.BoxGeometry(8, 2.5, 12);
  const body = new THREE.Mesh(bodyGeometry, tankBodyMaterial);
  body.position.set(0, 1.25, 0);
  body.castShadow = true;
  tankGroup.add(body);
  
  // 坦克炮塔
  const turretGeometry = new THREE.CylinderGeometry(2.5, 2.5, 2, 8);
  const turret = new THREE.Mesh(turretGeometry, tankDetailMaterial);
  turret.position.set(0, 3.5, -1);
  turret.castShadow = true;
  tankGroup.add(turret);
  
  // 坦克炮管
  const cannonGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
  const cannon = new THREE.Mesh(cannonGeometry, tankDetailMaterial);
  cannon.rotation.x = Math.PI / 2;
  cannon.position.set(0, 3.5, 3);
  cannon.castShadow = true;
  tankGroup.add(cannon);
  
  // 履带（左）
  const leftTrackGeometry = new THREE.BoxGeometry(1.5, 1.5, 12);
  const leftTrack = new THREE.Mesh(leftTrackGeometry, tankLightMaterial);
  leftTrack.position.set(-3.5, 0.75, 0);
  tankGroup.add(leftTrack);
  
  // 履带（右）
  const rightTrackGeometry = new THREE.BoxGeometry(1.5, 1.5, 12);
  const rightTrack = new THREE.Mesh(rightTrackGeometry, tankLightMaterial);
  rightTrack.position.set(3.5, 0.75, 0);
  tankGroup.add(rightTrack);
  
  // 履带轮子（装饰）
  for (let i = -4; i <= 4; i += 2) {
    // 左侧轮子
    const leftWheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 8);
    const leftWheel = new THREE.Mesh(leftWheelGeometry, tankDetailMaterial);
    leftWheel.rotation.z = Math.PI / 2;
    leftWheel.position.set(-4.2, 0.75, i);
    tankGroup.add(leftWheel);
    
    // 右侧轮子
    const rightWheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 8);
    const rightWheel = new THREE.Mesh(rightWheelGeometry, tankDetailMaterial);
    rightWheel.rotation.z = Math.PI / 2;
    rightWheel.position.set(4.2, 0.75, i);
    tankGroup.add(rightWheel);
  }
  
  // 坦克顶部舱门
  const hatchGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 8);
  const hatch = new THREE.Mesh(hatchGeometry, tankLightMaterial);
  hatch.position.set(0, 4.7, -1);
  tankGroup.add(hatch);
  
  // 添加目标指示器（红色闪烁效果）
  const indicatorGeometry = new THREE.ConeGeometry(1.5, 4, 4);
  const indicatorMaterial = new THREE.MeshBasicMaterial({
    color: 0xFF0000,
    emissive: 0xFF0000,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.8
  });
  const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
  indicator.position.set(0, 8, 0);
  tankGroup.add(indicator);
  
  tankGroup.position.set(...position);
  tankGroup.userData = {
    type: 'tank',
    points: 100,
    destroyed: false,
    size: 6, // 碰撞检测半径
    indicator: indicator
  };
  
  scene.add(tankGroup);
  targets.push(tankGroup);
}

function createPaperPlane() {
  glider = new THREE.Group();

  // Materials matching the exact CSS plane colors (--dark = 0 for day mode)
  // CSS: --white-one 'hsl(0, 0%, %s)' % calc((90 - (var(--dark) * 30)) * 1%) = hsl(0, 0%, 90%)
  const whiteOne = new THREE.MeshLambertMaterial({ color: 0xE6E6E6, flatShading: true }); // hsl(0, 0%, 90%)
  // CSS: --white-two 'hsl(0, 0%, %s)' % calc((85 - (var(--dark) * 30)) * 1%) = hsl(0, 0%, 85%)
  const whiteTwo = new THREE.MeshLambertMaterial({ color: 0xD9D9D9, flatShading: true }); // hsl(0, 0%, 85%)
  // CSS: --white-three 'hsl(0, 0%, %s)' % calc((80 - (var(--dark) * 30)) * 1%) = hsl(0, 0%, 80%)
  const whiteThree = new THREE.MeshLambertMaterial({ color: 0xCCCCCC, flatShading: true }); // hsl(0, 0%, 80%)
  // CSS: --white-four 'hsl(0, 0%, %s)' % calc((75 - (var(--dark) * 30)) * 1%) = hsl(0, 0%, 75%)
  const whiteFour = new THREE.MeshLambertMaterial({ color: 0xBFBFBF, flatShading: true }); // hsl(0, 0%, 75%)
  
  // CSS: --accent-hue 10, --accent-one 'hsl(%s, 80%, %s)' % (var(--accent-hue) calc((60 - (var(--dark) * 20)) * 1%)) = hsl(10, 80%, 60%)
  const accentOne = new THREE.MeshLambertMaterial({ color: 0xE6704D, flatShading: true }); // hsl(10, 80%, 60%)
  // CSS: --accent-two 'hsl(%s, 80%, %s)' % (var(--accent-hue) calc((55 - (var(--dark) * 20)) * 1%)) = hsl(10, 80%, 55%)
  const accentTwo = new THREE.MeshLambertMaterial({ color: 0xDB5F3D, flatShading: true }); // hsl(10, 80%, 55%)
  // CSS: --accent-three 'hsl(%s, 80%, %s)' % (var(--accent-hue) calc((50 - (var(--dark) * 20)) * 1%)) = hsl(10, 80%, 50%)
  const accentThree = new THREE.MeshLambertMaterial({ color: 0xCC4D2D, flatShading: true }); // hsl(10, 80%, 50%)
  // CSS: --accent-four 'hsl(%s, 80%, %s)' % (var(--accent-hue) calc((45 - (var(--dark) * 20)) * 1%)) = hsl(10, 80%, 45%)
  const accentFour = new THREE.MeshLambertMaterial({ color: 0xB8441F, flatShading: true }); // hsl(10, 80%, 45%)
  
  // CSS: --metal-one 'hsl(0, 0%, %s)' % calc((60 - (var(--dark) * 20)) * 1%) = hsl(0, 0%, 60%)
  const metalOne = new THREE.MeshLambertMaterial({ color: 0x999999, flatShading: true }); // hsl(0, 0%, 60%)
  // CSS: --metal-two 'hsl(0, 0%, %s)' % calc((50 - (var(--dark) * 20)) * 1%) = hsl(0, 0%, 50%)
  const metalTwo = new THREE.MeshLambertMaterial({ color: 0x808080, flatShading: true }); // hsl(0, 0%, 50%)
  // CSS: --metal-three 'hsl(0, 0%, %s)' % calc((40 - (var(--dark) * 20)) * 1%) = hsl(0, 0%, 40%)
  const metalThree = new THREE.MeshLambertMaterial({ color: 0x666666, flatShading: true }); // hsl(0, 0%, 40%)
  
  // CSS: --wheel-one hsl(0, 0%, 10%)
  const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A1A, flatShading: true }); // hsl(0, 0%, 10%)
  // CSS: --wheel-hub 'hsl(0, 0%, %s)' % calc((98 - (var(--dark) * 20)) * 1%) = hsl(0, 0%, 98%)
  const wheelHub = new THREE.MeshLambertMaterial({ color: 0xFAFAFA, flatShading: true }); // hsl(0, 0%, 98%)
  
  // CSS: --screen 'hsla(210, 80%, %s, 0.25)' % calc((70 - (var(--dark) * 20)) * 1%) = hsla(210, 80%, 70%, 0.25)
  const screenMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x5DADE2, // hsl(210, 80%, 70%) converted to hex
    transparent: true, 
    opacity: 0.25,
    flatShading: true 
  });

  // Main fuselage/body - more detailed sections like CSS
  const bodyGeometry = new THREE.BoxGeometry(0.7, 0.8, 3.2); // Adjusted proportions
  const body = new THREE.Mesh(bodyGeometry, whiteTwo);
  body.position.set(0, 0, 0);
  body.castShadow = true;
  glider.add(body);

  // Body top section (lighter color)
  const bodyTopGeometry = new THREE.BoxGeometry(0.68, 0.05, 3.18);
  const bodyTop = new THREE.Mesh(bodyTopGeometry, whiteOne);
  bodyTop.position.set(0, 0.4, 0);
  glider.add(bodyTop);

  // Body side panels
  const bodySideLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.75, 3.15), whiteThree);
  bodySideLeft.position.set(-0.35, 0, 0);
  glider.add(bodySideLeft);

  const bodySideRight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.75, 3.15), whiteFour);
  bodySideRight.position.set(0.35, 0, 0);
  glider.add(bodySideRight);

  // Nose section - more detailed like CSS
  const noseGeometry = new THREE.ConeGeometry(0.35, 0.8, 8);
  const nose = new THREE.Mesh(noseGeometry, metalOne);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0, 2);
  nose.castShadow = true;
  glider.add(nose);

  // Nose tip detail
  const noseTip = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 8), metalThree);
  noseTip.rotation.x = Math.PI / 2;
  noseTip.position.set(0, 0, 2.55);
  glider.add(noseTip);

  // Propeller hub - more detailed
  const propHubGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 8);
  const propHub = new THREE.Mesh(propHubGeometry, metalTwo);
  propHub.rotation.x = Math.PI / 2;
  propHub.position.set(0, 0, 2.8);
  glider.add(propHub);

  // Propeller center dot
  const propCenter = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), whiteOne);
  propCenter.position.set(0, 0, 2.88);
  glider.add(propCenter);

  // Propeller blades - thinner and more realistic
  const propellerGroup = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const bladeGeometry = new THREE.BoxGeometry(0.03, 1.2, 0.08); // Thinner blades
    const blade = new THREE.Mesh(bladeGeometry, metalThree);
    blade.rotation.z = (i * Math.PI);
    propellerGroup.add(blade);
  }
  propellerGroup.position.set(0, 0, 2.9);
  propellerGroup.rotation.x = Math.PI / 2;
  glider.add(propellerGroup);
  glider.userData.propeller = propellerGroup;

  // Main wings - rounded corners for more realistic look
  const wingShape = new THREE.Shape();
  const wingWidth = 8;
  const wingDepth = 1.6;
  const cornerRadius = 0.4;
  
  // Create rounded rectangle shape for wings
  wingShape.moveTo(-wingWidth/2 + cornerRadius, -wingDepth/2);
  wingShape.lineTo(wingWidth/2 - cornerRadius, -wingDepth/2);
  wingShape.quadraticCurveTo(wingWidth/2, -wingDepth/2, wingWidth/2, -wingDepth/2 + cornerRadius);
  wingShape.lineTo(wingWidth/2, wingDepth/2 - cornerRadius);
  wingShape.quadraticCurveTo(wingWidth/2, wingDepth/2, wingWidth/2 - cornerRadius, wingDepth/2);
  wingShape.lineTo(-wingWidth/2 + cornerRadius, wingDepth/2);
  wingShape.quadraticCurveTo(-wingWidth/2, wingDepth/2, -wingWidth/2, wingDepth/2 - cornerRadius);
  wingShape.lineTo(-wingWidth/2, -wingDepth/2 + cornerRadius);
  wingShape.quadraticCurveTo(-wingWidth/2, -wingDepth/2, -wingWidth/2 + cornerRadius, -wingDepth/2);
  
  const wingGeometry = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3
  });
  
  const wings = new THREE.Mesh(wingGeometry, accentOne);
  wings.position.set(0, -0.15, 0.2);
  wings.rotation.x = -Math.PI / 2; // Rotate to lay flat
  wings.castShadow = true;
  glider.add(wings);

  // Wing top surface detail with rounded corners
  const wingTopShape = new THREE.Shape();
  const topWidth = wingWidth - 0.1;
  const topDepth = wingDepth - 0.05;
  const topRadius = cornerRadius - 0.05;
  
  wingTopShape.moveTo(-topWidth/2 + topRadius, -topDepth/2);
  wingTopShape.lineTo(topWidth/2 - topRadius, -topDepth/2);
  wingTopShape.quadraticCurveTo(topWidth/2, -topDepth/2, topWidth/2, -topDepth/2 + topRadius);
  wingTopShape.lineTo(topWidth/2, topDepth/2 - topRadius);
  wingTopShape.quadraticCurveTo(topWidth/2, topDepth/2, topWidth/2 - topRadius, topDepth/2);
  wingTopShape.lineTo(-topWidth/2 + topRadius, topDepth/2);
  wingTopShape.quadraticCurveTo(-topWidth/2, topDepth/2, -topWidth/2, topDepth/2 - topRadius);
  wingTopShape.lineTo(-topWidth/2, -topDepth/2 + topRadius);
  wingTopShape.quadraticCurveTo(-topWidth/2, -topDepth/2, -topWidth/2 + topRadius, -topDepth/2);
  
  const wingTopGeometry = new THREE.ExtrudeGeometry(wingTopShape, {
    depth: 0.02,
    bevelEnabled: false
  });
  
  const wingTop = new THREE.Mesh(wingTopGeometry, accentTwo);
  wingTop.position.set(0, 0.1, 0.2);
  wingTop.rotation.x = -Math.PI / 2;
  glider.add(wingTop);

  // Wing bottom surface with rounded corners
  const wingBottom = new THREE.Mesh(wingTopGeometry, accentThree);
  wingBottom.position.set(0, -0.35, 0.2);
  wingBottom.rotation.x = -Math.PI / 2;
  glider.add(wingBottom);

  // Wing support struts - more detailed
  for (let i = -1; i <= 1; i += 2) {
    const strutGeometry = new THREE.BoxGeometry(0.04, 0.5, 0.04);
    const strut = new THREE.Mesh(strutGeometry, metalTwo);
    strut.position.set(i * 2, -0.4, 0.2);
    glider.add(strut);
  }

  // Wing tip strobes - exactly like CSS
  const leftStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshLambertMaterial({ 
    color: 0xFF4444, 
    emissive: 0xFF0000,
    emissiveIntensity: 0.4 
  }));
  leftStrobe.position.set(-4, -0.1, 0.2);
  glider.add(leftStrobe);

  const rightStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshLambertMaterial({ 
    color: 0xFFFFFF,
    emissive: 0xFFFFFF,
    emissiveIntensity: 0.4 
  }));
  rightStrobe.position.set(4, -0.1, 0.2);
  glider.add(rightStrobe);

  // Windscreen/cockpit - more detailed
  const screenGeometry = new THREE.BoxGeometry(0.48, 0.56, 1.12);
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.set(0, 0.48, 0.72);
  glider.add(screen);

  // Windscreen frame
  const frameGeometry = new THREE.BoxGeometry(0.5, 0.6, 1.15);
  const frame = new THREE.Mesh(frameGeometry, metalOne);
  frame.position.set(0, 0.48, 0.72);
  glider.add(frame);

  // Tail section - multi-part like CSS
  const tailGeometry = new THREE.BoxGeometry(0.65, 0.7, 2.16);
  const tail = new THREE.Mesh(tailGeometry, whiteTwo);
  tail.position.set(0, 0, -2.3);
  tail.castShadow = true;
  glider.add(tail);

  // Tail top section
  const tailTop = new THREE.Mesh(new THREE.BoxGeometry(0.63, 0.02, 2.14), whiteOne);
  tailTop.position.set(0, 0.35, -2.3);
  glider.add(tailTop);

  // Horizontal stabilizer - rounded corners like main wings
  const hStabShape = new THREE.Shape();
  const hStabWidth = 2.6;
  const hStabDepth = 0.72;
  const hStabRadius = 0.15;
  
  // Create rounded rectangle for horizontal stabilizer
  hStabShape.moveTo(-hStabWidth/2 + hStabRadius, -hStabDepth/2);
  hStabShape.lineTo(hStabWidth/2 - hStabRadius, -hStabDepth/2);
  hStabShape.quadraticCurveTo(hStabWidth/2, -hStabDepth/2, hStabWidth/2, -hStabDepth/2 + hStabRadius);
  hStabShape.lineTo(hStabWidth/2, hStabDepth/2 - hStabRadius);
  hStabShape.quadraticCurveTo(hStabWidth/2, hStabDepth/2, hStabWidth/2 - hStabRadius, hStabDepth/2);
  hStabShape.lineTo(-hStabWidth/2 + hStabRadius, hStabDepth/2);
  hStabShape.quadraticCurveTo(-hStabWidth/2, hStabDepth/2, -hStabWidth/2, hStabDepth/2 - hStabRadius);
  hStabShape.lineTo(-hStabWidth/2, -hStabDepth/2 + hStabRadius);
  hStabShape.quadraticCurveTo(-hStabWidth/2, -hStabDepth/2, -hStabWidth/2 + hStabRadius, -hStabDepth/2);
  
  const hStabGeometry = new THREE.ExtrudeGeometry(hStabShape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2
  });
  
  const hStab = new THREE.Mesh(hStabGeometry, accentTwo);
  hStab.position.set(0, 0, -3.2);
  hStab.rotation.x = -Math.PI / 2;
  glider.add(hStab);

  // Horizontal stabilizer top with rounded corners
  const hStabTopShape = new THREE.Shape();
  const topHStabWidth = hStabWidth - 0.05;
  const topHStabDepth = hStabDepth - 0.02;
  const topHStabRadius = hStabRadius - 0.02;
  
  hStabTopShape.moveTo(-topHStabWidth/2 + topHStabRadius, -topHStabDepth/2);
  hStabTopShape.lineTo(topHStabWidth/2 - topHStabRadius, -topHStabDepth/2);
  hStabTopShape.quadraticCurveTo(topHStabWidth/2, -topHStabDepth/2, topHStabWidth/2, -topHStabDepth/2 + topHStabRadius);
  hStabTopShape.lineTo(topHStabWidth/2, topHStabDepth/2 - topHStabRadius);
  hStabTopShape.quadraticCurveTo(topHStabWidth/2, topHStabDepth/2, topHStabWidth/2 - topHStabRadius, topHStabDepth/2);
  hStabTopShape.lineTo(-topHStabWidth/2 + topHStabRadius, topHStabDepth/2);
  hStabTopShape.quadraticCurveTo(-topHStabWidth/2, topHStabDepth/2, -topHStabWidth/2, topHStabDepth/2 - topHStabRadius);
  hStabTopShape.lineTo(-topHStabWidth/2, -topHStabDepth/2 + topHStabRadius);
  hStabTopShape.quadraticCurveTo(-topHStabWidth/2, -topHStabDepth/2, -topHStabWidth/2 + topHStabRadius, -topHStabDepth/2);
  
  const hStabTopGeometry = new THREE.ExtrudeGeometry(hStabTopShape, {
    depth: 0.02,
    bevelEnabled: false
  });
  
  const hStabTop = new THREE.Mesh(hStabTopGeometry, accentOne);
  hStabTop.position.set(0, 0.1, -3.2);
  hStabTop.rotation.x = -Math.PI / 2;
  glider.add(hStabTop);

  // Vertical stabilizer - detailed like CSS
  const vStabGeometry = new THREE.BoxGeometry(0.16, 1.6, 0.64);
  const vStab = new THREE.Mesh(vStabGeometry, accentTwo);
  vStab.position.set(0, 0.8, -3.2);
  glider.add(vStab);

  // Vertical stabilizer top section
  const vStabTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.62), accentOne);
  vStabTop.position.set(0, 1.6, -3.2);
  glider.add(vStabTop);

  // Landing gear - more realistic wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12);
  
  // Main wheels with hub details
  const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  leftWheel.rotation.z = Math.PI / 2;
  leftWheel.position.set(-1, -0.8, 0.4);
  glider.add(leftWheel);

  const leftHub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 8), wheelHub);
  leftHub.rotation.z = Math.PI / 2;
  leftHub.position.set(-1, -0.8, 0.4);
  glider.add(leftHub);

  const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rightWheel.rotation.z = Math.PI / 2;
  rightWheel.position.set(1, -0.8, 0.4);
  glider.add(rightWheel);

  const rightHub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 8), wheelHub);
  rightHub.rotation.z = Math.PI / 2;
  rightHub.position.set(1, -0.8, 0.4);
  glider.add(rightHub);

  // Wheel axle
  const axleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 2, 8);
  const axle = new THREE.Mesh(axleGeometry, metalTwo);
  axle.rotation.z = Math.PI / 2;
  axle.position.set(0, -0.8, 0.4);
  glider.add(axle);

  // Landing gear struts
  const leftStrut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), metalOne);
  leftStrut.position.set(-1, -0.4, 0.4);
  glider.add(leftStrut);

  const rightStrut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), metalOne);
  rightStrut.position.set(1, -0.4, 0.4);
  glider.add(rightStrut);

  // Tail wheel
  const tailWheelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 8);
  const tailWheel = new THREE.Mesh(tailWheelGeometry, wheelMaterial);
  tailWheel.rotation.z = Math.PI / 2;
  tailWheel.position.set(0, -0.5, -2.8);
  glider.add(tailWheel);

  const tailHub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 6), wheelHub);
  tailHub.rotation.z = Math.PI / 2;
  tailHub.position.set(0, -0.5, -2.8);
  glider.add(tailHub);

  // Tail wheel strut
  const tailStrut = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), metalTwo);
  tailStrut.position.set(0, -0.25, -2.8);
  glider.add(tailStrut);

  // Beacon light - red blinking like CSS
  const beaconGeometry = new THREE.SphereGeometry(0.04, 8, 6);
  const beacon = new THREE.Mesh(beaconGeometry, new THREE.MeshLambertMaterial({ 
    color: 0xFF0000,
    emissive: 0xFF0000,
    emissiveIntensity: 0.3
  }));
  beacon.position.set(0, 0.6, -0.8);
  glider.add(beacon);

  // Add wing-mounted machine guns
  const gunMaterial = new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true });
  
  // Left gun
  const leftGunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), gunMaterial);
  leftGunBarrel.rotation.x = Math.PI / 2;
  leftGunBarrel.position.set(-1.5, -0.1, 0.6);
  glider.add(leftGunBarrel);
  
  const leftGunMount = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.15), gunMaterial);
  leftGunMount.position.set(-1.5, -0.1, 0.2);
  glider.add(leftGunMount);
  
  // Right gun
  const rightGunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), gunMaterial);
  rightGunBarrel.rotation.x = Math.PI / 2;
  rightGunBarrel.position.set(1.5, -0.1, 0.6);
  glider.add(rightGunBarrel);
  
  const rightGunMount = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.15), gunMaterial);
  rightGunMount.position.set(1.5, -0.1, 0.2);
  glider.add(rightGunMount);

  // Store gun positions for bullet spawning
  glider.userData.leftGunPosition = new THREE.Vector3(-1.5, -0.1, 1);
  glider.userData.rightGunPosition = new THREE.Vector3(1.5, -0.1, 1);

  // Position and add to scene
  glider.position.set(0, 100, 0);
  glider.rotation.y = 0; // Remove the previous rotation
  glider.visible = true;
  scene.add(glider);
  
  console.log('Detailed plane created at position:', glider.position);
  console.log('Plane visible:', glider.visible);
  console.log('Plane added to scene');
}
function createEnvironment() {
  // Create simple clouds in the sky
  createSimpleClouds();
  
  // Add floating particle effects (reduced for cleaner look)
  createFloatingParticles();
}

function createSimpleClouds() {
  clouds = []; // Reset clouds array
  
  const cloudConfigs = [
    // Fewer, more spread out clouds
    { pos: [-200, 120, -300], scale: [25, 15, 25], color: 0xFFFFFF },
    { pos: [250, 110, -250], scale: [30, 18, 30], color: 0xF8F8FF },
    { pos: [0, 130, -400], scale: [35, 20, 35], color: 0xFFFFFF },
    { pos: [-150, 100, 200], scale: [20, 12, 20], color: 0xF5F5F5 },
    { pos: [180, 115, 150], scale: [25, 15, 25], color: 0xF0F8FF }
  ];

  cloudConfigs.forEach(config => {
    const cloud = createSimpleCloud(config.pos, config.scale, config.color);
    clouds.push(cloud);
    scene.add(cloud);
  });
}

function createSimpleCloud(position, scale, color) {
  const cloudGroup = new THREE.Group();
  
  // Create cloud using fewer spheres for cleaner look
  const sphereCount = 3;
  
  for (let i = 0; i < sphereCount; i++) {
    const sphereGeometry = new THREE.SphereGeometry(
      scale[0] * (0.6 + Math.random() * 0.4), // Random size variation
      8, // Low poly
      6
    );
    
    const sphereMaterial = new THREE.MeshLambertMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      flatShading: true
    });
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(
      (Math.random() - 0.5) * scale[0] * 0.8,
      (Math.random() - 0.5) * scale[1] * 0.6,
      (Math.random() - 0.5) * scale[2] * 0.8
    );
    
    cloudGroup.add(sphere);
  }
  
  cloudGroup.position.set(...position);
  return cloudGroup;
}

function createFloatingParticles() {
  // Create fewer magical floating particles for cleaner look
  const particleGeometry = new THREE.SphereGeometry(0.15, 4, 4); // Very low poly
  const particleColors = [0xFFE4B5, 0x98FB98, 0x87CEEB];
  
  for (let i = 0; i < 10; i++) { // Reduced from 20 to 10
    const particleMaterial = new THREE.MeshLambertMaterial({
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      transparent: true,
      opacity: 0.4, // More subtle
      flatShading: true
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.set(
      (Math.random() - 0.5) * 600, // Reduced spread
      Math.random() * 80 + 60,      // Higher in sky
      (Math.random() - 0.5) * 600
    );
    
    // Add floating animation data
    particle.userData = {
      originalY: particle.position.y,
      floatSpeed: 0.3 + Math.random() * 0.8, // Slower
      floatRange: 1 + Math.random() * 2       // Smaller range
    };
    
    scene.add(particle);
  }
}

function createLights() {
  // Main directional light (sun) - softer for low-poly aesthetic
  const directionalLight = new THREE.DirectionalLight(0xFFFFE0, 0.8);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  
  // Enhanced shadow settings for better quality
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 300;
  directionalLight.shadow.camera.left = -150;
  directionalLight.shadow.camera.right = 150;
  directionalLight.shadow.camera.top = 150;
  directionalLight.shadow.camera.bottom = -150;
  directionalLight.shadow.bias = -0.0001;
  scene.add(directionalLight);
  
  // Warm ambient light for low-poly warmth
  const ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.4);
  scene.add(ambientLight);
  
  // Hemisphere light for natural sky lighting
  const hemisphereLight = new THREE.HemisphereLight(
    0x87CEEB, // sky color
    0x90EE90, // ground color  
    0.3
  );
  scene.add(hemisphereLight);
  
  // Add some accent lights for atmosphere
  const accentLight1 = new THREE.PointLight(0xFFB6C1, 0.5, 100);
  accentLight1.position.set(-100, 50, -100);
  scene.add(accentLight1);
  
  const accentLight2 = new THREE.PointLight(0x98FB98, 0.4, 80);
  accentLight2.position.set(120, 40, 80);
  scene.add(accentLight2);
}

function createRain() {
  const rainGeometry = new THREE.BufferGeometry();
  const rainCount = 2000; // 增加雨滴数量
  const positions = new Float32Array(rainCount * 3);
  
  for (let i = 0; i < rainCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 400; // 扩大雨的范围
    positions[i + 1] = Math.random() * 300;
    positions[i + 2] = (Math.random() - 0.5) * 400; // 扩大雨的范围
  }
  
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rainMaterial = new THREE.PointsMaterial({
    color: 0x87CEEB,
    size: 0.8, // 稍微增大雨滴
    transparent: true,
    opacity: 0.7
  });
  
  const rain = new THREE.Points(rainGeometry, rainMaterial);
  rain.visible = false;
  rainParticles.push(rain);
  scene.add(rain);
}

function setupEventListeners() {
  window.addEventListener('resize', onWindowResize);
  document.getElementById('weatherBtn').addEventListener('click', toggleWeather);
  
  // 键盘事件
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 't') toggleWeather();
    if (e.key === ' ') { // 空格键投弹
      e.preventDefault(); // 防止页面滚动
      dropBomb();
    }
  });
  window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
  
  // 鼠标射击事件
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // 左键
      isShooting = true;
      shoot();
    }
  });
  
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // 左键
      isShooting = false;
    }
  });
}

function createBullet(position, direction) {
  const bulletGeometry = new THREE.SphereGeometry(0.08, 8, 8); // 增大子弹尺寸
  const bulletMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFFFF00,
    emissive: 0xFFFF00,
    emissiveIntensity: 0.8 // 增强发光效果
  });
  
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
  bullet.position.copy(position);
  
  // 添加拖尾效果
  const trailGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.3, 6);
  const trailMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFFAA00,
    emissive: 0xFFAA00,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.8
  });
  const trail = new THREE.Mesh(trailGeometry, trailMaterial);
  trail.rotation.x = Math.PI / 2;
  trail.position.z = -0.2; // 在子弹后面
  bullet.add(trail);
  
  // 子弹数据
  bullet.userData = {
    velocity: direction.clone().multiplyScalar(120), // 增加子弹速度
    life: 5000, // 延长生命周期到5秒
    startTime: Date.now()
  };
  
  scene.add(bullet);
  bullets.push(bullet);
}

// 创建炸弹
function createBomb() {
  const bombGeometry = new THREE.SphereGeometry(0.15, 8, 8);
  const bombMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x333333,
    transparent: true,
    opacity: 0.9
  });
  const bomb = new THREE.Mesh(bombGeometry, bombMaterial);
  
  // 设置炸弹起始位置（飞机下方）
  bomb.position.copy(glider.position);
  bomb.position.y -= 1.0; // 从飞机下方投下
  
  // 设置炸弹的初始速度（继承飞机的速度并添加重力）
  const bombVelocity = velocity.clone();
  bomb.userData = { 
    velocity: bombVelocity,
    gravity: -0.02, // 重力加速度
    verticalVelocity: 0, // 垂直速度
    life: 10000, // 生命周期10秒
    startTime: Date.now()
  };
  
  scene.add(bomb);
  bombs.push(bomb);
}

function shoot() {
  const currentTime = Date.now();
  if (currentTime - lastShotTime < SHOT_COOLDOWN) return;
  
  lastShotTime = currentTime;
  
  if (!glider) return;
  
  // 获取机炮在世界坐标中的位置
  const leftGunWorld = new THREE.Vector3();
  const rightGunWorld = new THREE.Vector3();
  
  // 创建临时对象来计算世界位置
  const leftGunLocal = glider.userData.leftGunPosition.clone();
  const rightGunLocal = glider.userData.rightGunPosition.clone();
  
  leftGunLocal.applyMatrix4(glider.matrixWorld);
  rightGunLocal.applyMatrix4(glider.matrixWorld);
  
  // 计算射击方向（飞机前方）
  const shootDirection = new THREE.Vector3(0, 0, 1);
  shootDirection.applyQuaternion(glider.quaternion);
  
  // 发射左右两发子弹
  createBullet(leftGunLocal, shootDirection);
  createBullet(rightGunLocal, shootDirection);
  
  // 播放射击音效（可选）
  console.log('机炮射击！');
}

// 投弹函数
function dropBomb() {
  const currentTime = Date.now();
  if (currentTime - lastBombTime < BOMB_COOLDOWN) return;
  
  lastBombTime = currentTime;
  
  if (!glider) return;
  
  createBomb();
  console.log('投弹！');
}

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  updatePaperPlane(deltaTime);
  updateEnvironment(deltaTime);
  updateSkyColors(); // Dynamic sky animation
  updateFloatingParticles(deltaTime);
  updateBullets(deltaTime); // 更新子弹
  updateBombs(deltaTime); // 更新炸弹
  updateUI();

  // Debugging logs for glider position and visibility
  if (glider) {
    console.log(`Glider Position: x=${glider.position.x}, y=${glider.position.y}, z=${glider.position.z}`);
    console.log(`Glider Visibility: ${glider.visible}`);
  } else {
    console.warn('Glider object is undefined or not added to the scene.');
  }

  renderer.render(scene, camera);
}

function updateBullets(deltaTime) {
  const currentTime = Date.now();
  
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    
    // 检查子弹生命周期
    if (currentTime - bullet.userData.startTime > bullet.userData.life) {
      scene.remove(bullet);
      bullets.splice(i, 1);
      continue;
    }
    
    // 更新子弹位置
    bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(deltaTime));
    
    // 检查与目标的碰撞
    let hitTarget = false;
    for (let j = 0; j < targets.length; j++) {
      const target = targets[j];
      if (target.userData.destroyed) continue;
      
      const distance = bullet.position.distanceTo(target.position);
      if (distance < target.userData.size) {
        // 命中目标
        hitTarget = true;
        destroyTarget(target);
        score += target.userData.points;
        console.log(`命中目标！获得 ${target.userData.points} 分，总分：${score}`);
        break;
      }
    }
    
    // 如果命中目标或子弹飞得太远，移除子弹
    if (hitTarget || bullet.position.distanceTo(glider.position) > 800) {
      scene.remove(bullet);
      bullets.splice(i, 1);
    }
  }
  
  // 更新目标指示器闪烁效果
  updateTargets(deltaTime);
  
  // 持续射击（如果鼠标按住）
  if (isShooting) {
    shoot();
  }
}

function destroyTarget(target) {
  target.userData.destroyed = true;
  
  // 创建爆炸效果
  createExplosion(target.position);
  
  // 隐藏目标
  target.visible = false;
  
  // 如果不是炸弹摧毁的（通过标志判断），增加坦克计数
  if (!target.userData.destroyedByBomb) {
    tanksDestroyed++;
  }
  
  // 重置标志
  target.userData.destroyedByBomb = false;
  
  // 3秒后重新生成目标
  setTimeout(() => {
    respawnTarget(target);
  }, 3000);
}

function createExplosion(position) {
  // 创建爆炸粒子效果
  for (let i = 0; i < 10; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.3, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0xFF4400 : 0xFFAA00,
      emissive: Math.random() > 0.5 ? 0xFF4400 : 0xFFAA00,
      emissiveIntensity: 0.8
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(position);
    particle.position.add(new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      Math.random() * 5,
      (Math.random() - 0.5) * 10
    ));
    
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 15 + 5,
        (Math.random() - 0.5) * 20
      ),
      life: 1000,
      startTime: Date.now()
    };
    
    scene.add(particle);
    
    // 1秒后自动清理爆炸粒子
    setTimeout(() => {
      scene.remove(particle);
    }, 1000);
  }
}

function respawnTarget(target) {
  target.userData.destroyed = false;
  target.visible = true;
  console.log(`坦克目标重新生成`);
}

function updateTargets(deltaTime) {
  const time = Date.now() * 0.003;
  
  targets.forEach(target => {
    if (!target.userData.destroyed && target.userData.indicator) {
      // 指示器上下浮动和闪烁
      target.userData.indicator.position.y = target.userData.size + 4 + Math.sin(time + target.position.x) * 0.5;
      target.userData.indicator.material.opacity = 0.5 + Math.sin(time * 3 + target.position.z) * 0.3;
    }
  });
}

// 更新炸弹
function updateBombs(deltaTime) {
  const currentTime = Date.now();
  
  for (let i = bombs.length - 1; i >= 0; i--) {
    const bomb = bombs[i];
    
    // 检查炸弹生命周期
    if (currentTime - bomb.userData.startTime > bomb.userData.life) {
      scene.remove(bomb);
      bombs.splice(i, 1);
      continue;
    }
    
    // 更新炸弹的物理运动
    bomb.userData.verticalVelocity += bomb.userData.gravity;
    bomb.position.add(bomb.userData.velocity.clone().multiplyScalar(deltaTime));
    bomb.position.y += bomb.userData.verticalVelocity;
    
    // 检查是否落地（y坐标接近地面）
    if (bomb.position.y <= 2) {
      // 炸弹爆炸
      explodeBomb(bomb);
      scene.remove(bomb);
      bombs.splice(i, 1);
    }
  }
}

// 炸弹爆炸函数
function explodeBomb(bomb) {
  const explosionRadius = 15; // 爆炸半径
  const explosionPosition = bomb.position.clone();
  
  // 创建更大的爆炸效果
  createLargeExplosion(explosionPosition);
  
  // 检查爆炸范围内的坦克
  let tanksHit = 0;
  targets.forEach(target => {
    if (target.userData.destroyed) return;
    
    const distance = explosionPosition.distanceTo(target.position);
    if (distance <= explosionRadius) {
      target.userData.destroyedByBomb = true; // 标记为炸弹摧毁
      destroyTarget(target);
      tanksHit++;
      score += target.userData.points * 2; // 炸弹得分是子弹的两倍
    }
  });
  
  if (tanksHit > 0) {
    console.log(`炸弹爆炸！摧毁了 ${tanksHit} 辆坦克，获得 ${tanksHit * 200} 分！总分：${score}`);
  }
}

// 创建大型爆炸效果
function createLargeExplosion(position) {
  // 创建更多的爆炸粒子
  for (let i = 0; i < 25; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 6, 6);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.3 ? 0xFF4400 : 0xFFAA00,
      emissive: Math.random() > 0.3 ? 0xFF4400 : 0xFFAA00,
      emissiveIntensity: 1.0
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(position);
    particle.position.add(new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      Math.random() * 8,
      (Math.random() - 0.5) * 20
    ));
    
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        Math.random() * 20 + 8,
        (Math.random() - 0.5) * 30
      ),
      life: 2000,
      startTime: Date.now()
    };
    
    scene.add(particle);
    
    // 2秒后自动清理爆炸粒子
    setTimeout(() => {
      scene.remove(particle);
    }, 2000);
  }
}

function updateFloatingParticles(deltaTime) {
  // Animate floating particles
  scene.children.forEach(child => {
    if (child.userData && child.userData.floatSpeed) {
      const time = Date.now() * 0.001;
      child.position.y = child.userData.originalY + 
        Math.sin(time * child.userData.floatSpeed) * child.userData.floatRange;
      
      // Gentle rotation
      child.rotation.y += deltaTime * 0.5;
      child.rotation.x += deltaTime * 0.3;
    }
  });
}

function updatePaperPlane(deltaTime) {
  // 获取输入
  let pitchInput = 0, yawInput = 0, rollInput = 0, throttleInput = 0;
  
  if (keys['arrowup'] || keys['w']) pitchInput = -1;
  if (keys['arrowdown'] || keys['s']) pitchInput = 1;
  if (keys['arrowleft'] || keys['a']) yawInput = 1;
  if (keys['arrowright'] || keys['d']) yawInput = -1;
  if (keys['q']) rollInput = -1;
  if (keys['e']) rollInput = 1;
  if (keys[' ']) throttleInput = 1; // 空格键上升
  if (keys['shift']) throttleInput = -1; // Shift键下降
  
  // Animate propeller spinning (like the CSS version)
  if (glider.userData.propeller) {
    glider.userData.propeller.rotation.z += deltaTime * 50; // Fast spinning
  }
  
  // Paper plane physics - more gliding, less aggressive
  glider.rotation.x += pitchInput * 1.5 * deltaTime;
  glider.rotation.y += yawInput * 1.2 * deltaTime;
  glider.rotation.z += rollInput * 1.8 * deltaTime;
  
  // Limit angles for realistic paper plane flight
  glider.rotation.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, glider.rotation.x));
  glider.rotation.z = Math.max(-Math.PI/6, Math.min(Math.PI/6, glider.rotation.z));
  
  // Speed control - paper planes glide more smoothly
  speed += (pitchInput * 0.3) * deltaTime;
  speed = Math.max(minSpeed, Math.min(maxSpeed, speed));
  
  // Gentle vertical movement
  glider.position.y += throttleInput * 15 * deltaTime;
  
  // Forward movement with gliding physics
  velocity.set(0, 0, speed); // Changed from -speed to +speed to fly forward
  velocity.applyEuler(glider.rotation);
  glider.position.addScaledVector(velocity, deltaTime * 20);
  
  // Paper plane gentle floating motion
  glider.position.y += Math.sin(Date.now() * 0.003) * 0.1 * deltaTime;
  
  // Add slight side-to-side drift for realism
  glider.position.x += Math.sin(Date.now() * 0.002) * 0.05 * deltaTime;
  
  // Prevent ground collision
  if (glider.position.y < -15) {
    glider.position.y = -15;
    glider.rotation.x = Math.max(0, glider.rotation.x);
  }
  
  // Camera follow - adjusted for plane facing forward
  const cameraOffset = new THREE.Vector3(0, 6, -15); // Changed from positive to negative Z
  cameraOffset.applyEuler(glider.rotation);
  camera.position.copy(glider.position).add(cameraOffset);
  camera.lookAt(glider.position);
}

function updateEnvironment(deltaTime) {
  // Enhanced cloud movement with different speeds
  clouds.forEach((cloud, index) => {
    if (cloud) {
      // Different layers move at different speeds for parallax effect
      const baseSpeed = 2 + (index % 3);
      cloud.position.x += baseSpeed * deltaTime;
      
      // Gentle vertical floating
      cloud.position.y += Math.sin(Date.now() * 0.001 + index) * 0.1 * deltaTime;
      
      // Gentle rotation for organic feel
      cloud.rotation.y += deltaTime * 0.1;
      
      // Reset position when cloud moves too far
      if (cloud.position.x > 400) {
        cloud.position.x = -400;
        cloud.position.z = (Math.random() - 0.5) * 400; // Randomize depth
      }
    }
  });
  
  // Enhanced rain effects
  if (isRaining && rainParticles.length > 0) {
    const positions = rainParticles[0].geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] -= 200 * deltaTime; // Faster rain for better effect
      if (positions[i] < -100) positions[i] = 400; // Higher reset point
    }
    rainParticles[0].geometry.attributes.position.needsUpdate = true;
  }
}

function updateUI() {
  document.getElementById('speed').textContent = `速度: ${(speed * 30).toFixed(1)} km/h`;
  document.getElementById('weather').textContent = `天气: ${isRaining ? '雨天' : '晴天'}`;
  
  // 更新分数显示
  let scoreElement = document.getElementById('score');
  if (!scoreElement) {
    // 如果分数元素不存在，创建它
    scoreElement = document.createElement('div');
    scoreElement.id = 'score';
    document.getElementById('ui').appendChild(scoreElement);
  }
  scoreElement.textContent = `分数: ${score}`;
  
  // 更新坦克摧毁数量
  let tanksElement = document.getElementById('tanks');
  if (!tanksElement) {
    tanksElement = document.createElement('div');
    tanksElement.id = 'tanks';
    document.getElementById('ui').appendChild(tanksElement);
  }
  tanksElement.textContent = `摧毁坦克: ${tanksDestroyed}`;
  
  // 更新目标计数
  let targetsElement = document.getElementById('targets');
  if (!targetsElement) {
    targetsElement = document.createElement('div');
    targetsElement.id = 'targets';
    document.getElementById('ui').appendChild(targetsElement);
  }
  const activeTargets = targets.filter(t => !t.userData.destroyed).length;
  targetsElement.textContent = `剩余目标: ${activeTargets}/${targets.length}`;
}

function toggleWeather() {
  isRaining = !isRaining;
  
  if (isRaining) {
    // Darker, more atmospheric sky for rain
    scene.background = new THREE.Color(0x696969); // Dark gray
    scene.fog.color = new THREE.Color(0x696969);
    
    // Make rain visible
    if (rainParticles.length > 0) rainParticles[0].visible = true;
    
    // Dim the lighting for stormy atmosphere
    scene.children.forEach(child => {
      if (child.type === 'DirectionalLight') {
        child.intensity = 0.4;
      }
      if (child.type === 'AmbientLight') {
        child.intensity = 0.2;
      }
    });
  } else {
    // Restore bright sunny sky
    updateSkyColors();
    
    // Hide rain
    if (rainParticles.length > 0) rainParticles[0].visible = false;
    
    // Restore bright lighting
    scene.children.forEach(child => {
      if (child.type === 'DirectionalLight') {
        child.intensity = 0.8;
      }
      if (child.type === 'AmbientLight') {
        child.intensity = 0.4;
      }
    });
  }
  
  console.log('天气切换为:', isRaining ? '雨天' : '晴天');
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
