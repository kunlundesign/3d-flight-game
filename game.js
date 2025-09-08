// 全局游戏状态
let gameStage = 'selection'; // 'selection' 或 'playing'
let selectedAircraftType = 'default';
let customModelData = null;
let customModelFile = null;

// 确保避免重复初始化
let isGameInitialized = false;

// Three.js 全局变量
let scene, camera, renderer, aircraft;
let bullets = [], bombs = [], targets = [];
let keys = {}, mousePressed = false;
let speed = 0, weather = 'sunny';
let isNight = false;
let score = 0;
let destroyedTanks = 0;

// GLTFLoader
let gltfLoader;

// 飞机选择阶段初始化
function initAircraftSelection() {
  console.log('初始化飞机选择界面');
  
  // 初始化GLTFLoader
  if (typeof THREE !== 'undefined' && THREE.GLTFLoader) {
    gltfLoader = new THREE.GLTFLoader();
    console.log('GLTFLoader 初始化成功');
  } else {
    console.error('GLTFLoader 初始化失败');
  }
  
  // 设置飞机卡片点击事件
  setupAircraftCards();
  
  // 设置文件上传
  setupFileUpload();
  
  // 设置开始游戏按钮
  setupStartGame();
  
  // 初始化预览
  updatePreview();
}

// 设置飞机卡片选择
function setupAircraftCards() {
  const aircraftCards = document.querySelectorAll('.aircraft-card');
  
  aircraftCards.forEach(card => {
    card.addEventListener('click', () => {
      // 移除所有选中状态
      aircraftCards.forEach(c => c.classList.remove('selected'));
      
      // 选中当前卡片
      card.classList.add('selected');
      
      // 更新选择的飞机类型
      selectedAircraftType = card.dataset.aircraft;
      customModelData = null; // 清除自定义模型
      customModelFile = null;
      
      console.log('选择预设飞机:', selectedAircraftType);
      
      // 重置上传区域
      resetUploadArea();
      
      // 更新预览
      updatePreview();
    });
  });
}

// 设置文件上传功能
function setupFileUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const uploadStatus = document.getElementById('uploadStatus');
  
  // 拖拽事件
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });
  
  // 文件选择事件
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });
}

// 处理文件上传
function handleFileUpload(file) {
  console.log('开始处理文件上传:', file.name);
  
  const uploadStatus = document.getElementById('uploadStatus');
  const uploadIcon = document.getElementById('uploadIcon');
  const uploadText = document.getElementById('uploadText');
  const uploadArea = document.getElementById('uploadArea');
  
  // 验证文件类型
  if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
    showUploadStatus('error', '请选择.glb或.gltf格式的文件');
    return;
  }
  
  // 验证文件大小 (5MB限制)
  if (file.size > 5 * 1024 * 1024) {
    showUploadStatus('error', '文件大小不能超过5MB');
    return;
  }
  
  // 显示加载状态
  showUploadStatus('loading', '正在加载模型...');
  uploadIcon.innerHTML = '<div class="loading-spinner"></div>';
  uploadText.textContent = `正在处理: ${file.name}`;
  
  // 创建文件URL
  const fileUrl = URL.createObjectURL(file);
  
  // 使用GLTFLoader加载模型
  if (gltfLoader) {
    gltfLoader.load(
      fileUrl,
      (gltf) => {
        console.log('GLB模型加载成功:', gltf);
        
        // 存储模型数据
        customModelData = gltf;
        customModelFile = file;
        selectedAircraftType = 'custom';
        
        // 清除预设飞机选择
        document.querySelectorAll('.aircraft-card').forEach(card => {
          card.classList.remove('selected');
        });
        
        // 显示成功状态
        showUploadStatus('success', `模型加载成功: ${file.name}`);
        uploadIcon.innerHTML = '✅';
        uploadText.textContent = `已加载: ${file.name}`;
        uploadArea.classList.add('success');
        
        // 更新预览
        updatePreview();
        
        // 清理文件URL
        URL.revokeObjectURL(fileUrl);
      },
      (progress) => {
        console.log('加载进度:', progress);
      },
      (error) => {
        console.error('GLB模型加载失败:', error);
        showUploadStatus('error', '模型加载失败，请检查文件格式');
        resetUploadArea();
        
        // 清理文件URL
        URL.revokeObjectURL(fileUrl);
      }
    );
  } else {
    showUploadStatus('error', 'GLTFLoader未初始化');
    resetUploadArea();
  }
}

// 显示上传状态
function showUploadStatus(type, message) {
  const uploadStatus = document.getElementById('uploadStatus');
  uploadStatus.className = `upload-status status-${type}`;
  uploadStatus.textContent = message;
}

// 重置上传区域
function resetUploadArea() {
  const uploadArea = document.getElementById('uploadArea');
  const uploadIcon = document.getElementById('uploadIcon');
  const uploadText = document.getElementById('uploadText');
  const uploadStatus = document.getElementById('uploadStatus');
  
  uploadArea.classList.remove('success', 'dragover');
  uploadIcon.innerHTML = '📁';
  uploadText.textContent = '拖拽GLB模型文件到此处';
  uploadStatus.textContent = '';
  uploadStatus.className = 'upload-status';
}

// 更新预览
function updatePreview() {
  const previewText = document.getElementById('previewText');
  
  if (selectedAircraftType === 'custom' && customModelData) {
    previewText.textContent = `自定义模型 - ${customModelFile.name}`;
  } else {
    const aircraftNames = {
      'default': '经典战机',
      'fighter': '现代战机', 
      'stealth': '隐形战机',
      'bomber': '重型轰炸机'
    };
    previewText.textContent = `${aircraftNames[selectedAircraftType]} - 准备就绪`;
  }
}

// 设置开始游戏按钮
function setupStartGame() {
  const startGameBtn = document.getElementById('startGameBtn');
  
  startGameBtn.addEventListener('click', () => {
    console.log('开始游戏，选择的飞机:', selectedAircraftType);
    
    // 切换到游戏阶段
    switchToGameStage();
  });
}

// 切换到游戏阶段
function switchToGameStage() {
  gameStage = 'playing';
  
  // 隐藏选择界面，显示游戏界面
  document.getElementById('aircraftSelectionStage').style.display = 'none';
  document.getElementById('gameStage').style.display = 'block';
  
  // 初始化游戏
  if (!isGameInitialized) {
    initGame();
  } else {
    // 如果游戏已初始化，更新飞机
    updateAircraft();
  }
}

// 返回选择界面
function switchToSelectionStage() {
  gameStage = 'selection';
  
  // 显示选择界面，隐藏游戏界面
  document.getElementById('aircraftSelectionStage').style.display = 'flex';
  document.getElementById('gameStage').style.display = 'none';
  
  // 暂停游戏循环
  if (typeof pauseGame === 'function') {
    pauseGame();
  }
}

// 设置返回按钮
function setupBackToSelection() {
  const backBtn = document.getElementById('backToSelectionBtn');
  if (backBtn) {
    backBtn.addEventListener('click', switchToSelectionStage);
  }
}

// 初始化游戏
function initGame() {
  if (isGameInitialized) {
    console.log('游戏已初始化，跳过重复初始化');
    return;
  }
  
  console.log('开始初始化游戏');
  
  // 创建场景
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87CEEB, 50, 300);
  
  // 创建相机
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  
  // 添加到游戏阶段容器
  const gameStage = document.getElementById('gameStage');
  gameStage.appendChild(renderer.domElement);
  
  // 创建灯光
  createLights();
  
  // 创建地形
  createTerrain();
  
  // 创建森林
  createForest();
  
  // 创建飞机
  createAircraft();
  
  // 创建坦克目标
  createTanks();
  
  // 设置控制
  setupControls();
  
  // 设置游戏控制按钮
  setupGameControls();
  
  // 设置返回按钮
  setupBackToSelection();
  
  // 启动游戏循环
  animate();
  
  isGameInitialized = true;
  console.log('游戏初始化完成');
}

// 更新飞机（当用户选择不同飞机时）
function updateAircraft() {
  if (aircraft) {
    scene.remove(aircraft);
  }
  createAircraft();
}

// 创建灯光
function createLights() {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);
  
  // 太阳光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  scene.add(directionalLight);
}

// 创建地形
function createTerrain() {
  const terrainGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);
  const terrainMaterial = new THREE.MeshLambertMaterial({ 
    color: isNight ? 0x2d5016 : 0x5a7c30,
    transparent: true,
    opacity: 0.9
  });
  
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -20;
  terrain.receiveShadow = true;
  
  // 添加一些地形变化
  const vertices = terrain.geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i + 2] = Math.random() * 3 - 1.5; // Y坐标随机变化
  }
  terrain.geometry.attributes.position.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  
  scene.add(terrain);
}

// 创建森林
function createForest() {
  for (let i = 0; i < 200; i++) {
    const tree = createTree();
    tree.position.x = (Math.random() - 0.5) * 400;
    tree.position.z = (Math.random() - 0.5) * 400;
    tree.position.y = -20;
    scene.add(tree);
  }
}

// 创建树
function createTree() {
  const treeGroup = new THREE.Group();
  
  // 树干
  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
  const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 2;
  trunk.castShadow = true;
  treeGroup.add(trunk);
  
  // 树叶
  const leavesGeometry = new THREE.SphereGeometry(2, 8, 6);
  const leavesColor = isNight ? 0x2d4a2b : 0x228B22;
  const leavesMaterial = new THREE.MeshLambertMaterial({ color: leavesColor });
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.y = 5;
  leaves.castShadow = true;
  treeGroup.add(leaves);
  
  // 随机缩放
  const scale = 0.8 + Math.random() * 0.4;
  treeGroup.scale.setScalar(scale);
  
  return treeGroup;
}

// 创建飞机（根据选择的类型）
function createAircraft() {
  if (selectedAircraftType === 'custom' && customModelData) {
    aircraft = createCustomAircraft();
  } else {
    aircraft = createPresetAircraft();
  }
  
  // 设置初始位置
  aircraft.position.set(0, 100, 0);
  scene.add(aircraft);
  
  // 设置相机跟随
  camera.position.set(0, 105, -20);
  camera.lookAt(aircraft.position);
}

// 创建自定义飞机
function createCustomAircraft() {
  const aircraftGroup = new THREE.Group();
  
  // 克隆自定义模型
  const model = customModelData.scene.clone();
  
  // 标准化模型
  normalizeCustomModel(model);
  
  aircraftGroup.add(model);
  aircraftGroup.castShadow = true;
  aircraftGroup.receiveShadow = true;
  
  console.log('创建自定义飞机成功');
  return aircraftGroup;
}

// 标准化自定义模型
function normalizeCustomModel(model) {
  // 计算边界框
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  
  // 移动到中心
  model.position.sub(center);
  
  // 标准化大小
  const maxDimension = Math.max(size.x, size.y, size.z);
  const targetSize = 8; // 目标大小
  const scale = targetSize / maxDimension;
  model.scale.setScalar(scale);
  
  // 设置材质属性
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      if (child.material) {
        child.material.metalness = 0.3;
        child.material.roughness = 0.7;
      }
    }
  });
}

// 创建预设飞机
function createPresetAircraft() {
  switch (selectedAircraftType) {
    case 'fighter':
      return createFighterJet();
    case 'stealth':
      return createStealthFighter();
    case 'bomber':
      return createBomber();
    default:
      return createPaperPlane();
  }
}

// 创建经典纸飞机
function createPaperPlane() {
  const planeGroup = new THREE.Group();
  
  // 机身 - 白色
  const fuselageGeometry = new THREE.CylinderGeometry(0.5, 0.3, 10, 8);
  const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
  fuselage.rotation.z = Math.PI / 2;
  fuselage.castShadow = true;
  planeGroup.add(fuselage);
  
  // 主翼 - 白色
  const wingGeometry = new THREE.BoxGeometry(12, 0.3, 3);
  const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const wings = new THREE.Mesh(wingGeometry, wingMaterial);
  wings.position.y = 0;
  wings.castShadow = true;
  planeGroup.add(wings);
  
  // 尾翼 - 白色
  const tailGeometry = new THREE.BoxGeometry(3, 2, 0.3);
  const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const tail = new THREE.Mesh(tailGeometry, tailMaterial);
  tail.position.x = -4;
  tail.position.y = 1;
  tail.castShadow = true;
  planeGroup.add(tail);
  
  // 机头 - 浅灰色
  const noseGeometry = new THREE.ConeGeometry(0.5, 2, 6);
  const noseMaterial = new THREE.MeshLambertMaterial({ color: 0xe6e6e6 });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 6;
  nose.castShadow = true;
  planeGroup.add(nose);
  
  return planeGroup;
}

// 创建现代战机
function createFighterJet() {
  const jetGroup = new THREE.Group();
  
  // 机身 - 深灰色
  const fuselageGeometry = new THREE.CylinderGeometry(0.6, 0.4, 12, 8);
  const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
  fuselage.rotation.z = Math.PI / 2;
  fuselage.castShadow = true;
  jetGroup.add(fuselage);
  
  // 主翼 - 深灰色
  const wingGeometry = new THREE.BoxGeometry(10, 0.4, 4);
  const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e });
  const wings = new THREE.Mesh(wingGeometry, wingMaterial);
  wings.castShadow = true;
  jetGroup.add(wings);
  
  // 机炮 - 黑色
  const cannonGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6);
  const cannonMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
  
  const leftCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
  leftCannon.rotation.z = Math.PI / 2;
  leftCannon.position.set(4, 0.5, -1.5);
  jetGroup.add(leftCannon);
  
  const rightCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
  rightCannon.rotation.z = Math.PI / 2;
  rightCannon.position.set(4, 0.5, 1.5);
  jetGroup.add(rightCannon);
  
  return jetGroup;
}

// 创建隐形战机
function createStealthFighter() {
  const stealthGroup = new THREE.Group();
  
  // 隐形机身 - 黑色
  const fuselageGeometry = new THREE.BoxGeometry(10, 1, 2);
  const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
  fuselage.castShadow = true;
  stealthGroup.add(fuselage);
  
  // 三角翼 - 黑色
  const wingGeometry = new THREE.ConeGeometry(6, 8, 3);
  const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
  const wings = new THREE.Mesh(wingGeometry, wingMaterial);
  wings.rotation.x = Math.PI / 2;
  wings.rotation.z = Math.PI / 2;
  wings.castShadow = true;
  stealthGroup.add(wings);
  
  return stealthGroup;
}

// 创建重型轰炸机
function createBomber() {
  const bomberGroup = new THREE.Group();
  
  // 机身 - 军绿色
  const fuselageGeometry = new THREE.CylinderGeometry(0.8, 0.6, 15, 8);
  const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5d3a });
  const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
  fuselage.rotation.z = Math.PI / 2;
  fuselage.castShadow = true;
  bomberGroup.add(fuselage);
  
  // 宽翼 - 军绿色
  const wingGeometry = new THREE.BoxGeometry(18, 0.5, 5);
  const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x556b2f });
  const wings = new THREE.Mesh(wingGeometry, wingMaterial);
  wings.castShadow = true;
  bomberGroup.add(wings);
  
  // 发动机
  const engineGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
  const engineMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
  
  const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
  leftEngine.rotation.z = Math.PI / 2;
  leftEngine.position.set(-2, 0, -4);
  bomberGroup.add(leftEngine);
  
  const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
  rightEngine.rotation.z = Math.PI / 2;
  rightEngine.position.set(-2, 0, 4);
  bomberGroup.add(rightEngine);
  
  return bomberGroup;
}

// 创建坦克目标
function createTanks() {
  targets = [];
  
  for (let i = 0; i < 15; i++) {
    const tank = createTank();
    tank.position.x = (Math.random() - 0.5) * 300;
    tank.position.z = (Math.random() - 0.5) * 300;
    tank.position.y = -18;
    scene.add(tank);
    targets.push(tank);
  }
}

// 创建单个坦克
function createTank() {
  const tankGroup = new THREE.Group();
  
  // 坦克车身 - 军绿色
  const bodyGeometry = new THREE.BoxGeometry(4, 2, 6);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1;
  body.castShadow = true;
  body.receiveShadow = true;
  tankGroup.add(body);
  
  // 炮塔 - 深绿色
  const turretGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1.5, 8);
  const turretMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a0d });
  const turret = new THREE.Mesh(turretGeometry, turretMaterial);
  turret.position.y = 2.5;
  turret.castShadow = true;
  tankGroup.add(turret);
  
  // 炮管 - 深绿色
  const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
  const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x0d260a });
  const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(2, 2.5, 0);
  barrel.castShadow = true;
  tankGroup.add(barrel);
  
  // 履带（装饰用）
  const trackGeometry = new THREE.BoxGeometry(5, 1, 2);
  const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  
  const leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
  leftTrack.position.set(0, 0.5, -2.5);
  leftTrack.receiveShadow = true;
  tankGroup.add(leftTrack);
  
  const rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
  rightTrack.position.set(0, 0.5, 2.5);
  rightTrack.receiveShadow = true;
  tankGroup.add(rightTrack);
  
  return tankGroup;
}

// 设置控制
function setupControls() {
  document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    
    if (event.code === 'KeyT') {
      toggleWeather();
    }
  });
  
  document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
  });
  
  document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // 左键
      mousePressed = true;
      shoot();
    }
  });
  
  document.addEventListener('mouseup', (event) => {
    if (event.button === 0) {
      mousePressed = false;
    }
  });
  
  // 连续射击
  setInterval(() => {
    if (mousePressed) {
      shoot();
    }
  }, 100);
}

// 设置游戏控制按钮
function setupGameControls() {
  const weatherBtn = document.getElementById('weatherBtn');
  if (weatherBtn) {
    weatherBtn.addEventListener('click', toggleWeather);
  }
}

// 射击功能
function shoot() {
  const bulletGeometry = new THREE.SphereGeometry(0.1, 4, 4);
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
  
  bullet.position.copy(aircraft.position);
  bullet.position.y -= 0.5;
  
  const direction = new THREE.Vector3(1, 0, 0);
  direction.applyQuaternion(aircraft.quaternion);
  bullet.velocity = direction.multiplyScalar(50);
  
  scene.add(bullet);
  bullets.push(bullet);
}

// 投炸弹功能
function dropBomb() {
  const bombGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const bombMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
  const bomb = new THREE.Mesh(bombGeometry, bombMaterial);
  
  bomb.position.copy(aircraft.position);
  bomb.position.y -= 1;
  
  bomb.velocity = new THREE.Vector3(0, -2, 0);
  bomb.gravity = -0.5;
  
  scene.add(bomb);
  bombs.push(bomb);
}

// 切换天气
function toggleWeather() {
  isNight = !isNight;
  
  if (isNight) {
    weather = '夜晚';
    scene.fog.color.setHex(0x000033);
    renderer.setClearColor(0x000033);
  } else {
    weather = '晴天';
    scene.fog.color.setHex(0x87CEEB);
    renderer.setClearColor(0x87CEEB);
  }
  
  updateUI();
}

// 更新UI
function updateUI() {
  const speedElement = document.getElementById('speed');
  const weatherElement = document.getElementById('weather');
  const scoreElement = document.getElementById('score');
  const tanksElement = document.getElementById('tanks');
  
  if (speedElement) speedElement.textContent = `速度: ${speed.toFixed(1)}`;
  if (weatherElement) weatherElement.textContent = `天气: ${weather}`;
  if (scoreElement) scoreElement.textContent = `分数: ${score}`;
  if (tanksElement) tanksElement.textContent = `摧毁坦克: ${destroyedTanks}`;
}

// 销毁目标
function destroyTarget(target) {
  // 创建爆炸效果
  createExplosion(target.position);
  
  // 移除目标
  scene.remove(target);
  const index = targets.indexOf(target);
  if (index > -1) {
    targets.splice(index, 1);
  }
  
  // 更新分数
  score += 100;
  destroyedTanks++;
  
  // 重新生成坦克
  setTimeout(() => {
    const newTank = createTank();
    newTank.position.x = (Math.random() - 0.5) * 300;
    newTank.position.z = (Math.random() - 0.5) * 300;
    newTank.position.y = -18;
    scene.add(newTank);
    targets.push(newTank);
  }, 3000);
}

// 创建爆炸效果
function createExplosion(position) {
  const particles = [];
  
  for (let i = 0; i < 20; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.2, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({ 
      color: Math.random() > 0.5 ? 0xff4500 : 0xffa500 
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    particle.position.copy(position);
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      Math.random() * 10 + 5,
      (Math.random() - 0.5) * 10
    );
    particle.gravity = -0.5;
    particle.life = 2.0;
    
    scene.add(particle);
    particles.push(particle);
  }
  
  // 清理粒子
  setTimeout(() => {
    particles.forEach(particle => {
      scene.remove(particle);
    });
  }, 2000);
}

// 炸弹爆炸
function explodeBomb(bomb) {
  const bombPosition = bomb.position.clone();
  
  // 创建爆炸效果
  createExplosion(bombPosition);
  
  // 检查爆炸范围内的目标
  const explosionRadius = 15;
  targets.forEach(target => {
    const distance = target.position.distanceTo(bombPosition);
    if (distance < explosionRadius) {
      destroyTarget(target);
    }
  });
  
  // 移除炸弹
  scene.remove(bomb);
  const index = bombs.indexOf(bomb);
  if (index > -1) {
    bombs.splice(index, 1);
  }
  
  // 爆炸伤害分数
  score += 50;
}

// 更新子弹
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.position.add(bullet.velocity.clone().multiplyScalar(0.016));
    
    // 检查碰撞
    let hit = false;
    targets.forEach(target => {
      if (bullet.position.distanceTo(target.position) < 3) {
        destroyTarget(target);
        hit = true;
      }
    });
    
    // 移除超出范围或击中目标的子弹
    if (hit || bullet.position.y < -20 || bullet.position.length() > 500) {
      scene.remove(bullet);
      bullets.splice(i, 1);
    }
  }
}

// 更新炸弹
function updateBombs() {
  for (let i = bombs.length - 1; i >= 0; i--) {
    const bomb = bombs[i];
    bomb.velocity.y += bomb.gravity * 0.016;
    bomb.position.add(bomb.velocity.clone().multiplyScalar(0.016));
    
    // 检查是否落地
    if (bomb.position.y < -18) {
      explodeBomb(bomb);
    }
  }
}

// 更新飞机运动
function updateAircraftMovement() {
  const moveSpeed = 2;
  const rotationSpeed = 0.03;
  
  let moving = false;
  
  // 前进后退
  if (keys['KeyW'] || keys['ArrowUp']) {
    const direction = new THREE.Vector3(1, 0, 0);
    direction.applyQuaternion(aircraft.quaternion);
    aircraft.position.add(direction.multiplyScalar(moveSpeed));
    speed = moveSpeed;
    moving = true;
  }
  
  if (keys['KeyS'] || keys['ArrowDown']) {
    const direction = new THREE.Vector3(-1, 0, 0);
    direction.applyQuaternion(aircraft.quaternion);
    aircraft.position.add(direction.multiplyScalar(moveSpeed));
    speed = moveSpeed;
    moving = true;
  }
  
  // 左右转向
  if (keys['KeyA'] || keys['ArrowLeft']) {
    aircraft.rotateY(rotationSpeed);
  }
  
  if (keys['KeyD'] || keys['ArrowRight']) {
    aircraft.rotateY(-rotationSpeed);
  }
  
  // 上下俯仰
  if (keys['KeyQ']) {
    aircraft.rotateZ(rotationSpeed);
  }
  
  if (keys['KeyE']) {
    aircraft.rotateZ(-rotationSpeed);
  }
  
  // 投炸弹
  if (keys['Space']) {
    dropBomb();
    keys['Space'] = false; // 防止连续投弹
  }
  
  if (!moving) {
    speed = 0;
  }
  
  // 更新相机跟随
  const offset = new THREE.Vector3(-20, 5, 0);
  offset.applyQuaternion(aircraft.quaternion);
  camera.position.copy(aircraft.position).add(offset);
  camera.lookAt(aircraft.position);
}

// 主动画循环
function animate() {
  requestAnimationFrame(animate);
  
  if (gameStage === 'playing') {
    updateAircraftMovement();
    updateBullets();
    updateBombs();
    updateUI();
    
    renderer.render(scene, camera);
  }
}

// 窗口调整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
