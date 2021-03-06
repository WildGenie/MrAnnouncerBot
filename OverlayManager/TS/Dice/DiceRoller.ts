var showDieValues: boolean = false;
var firstContactSoundEffect: string = null;
var itsAD20Roll: boolean = false;
var hiddenThreshold: number = 0;
var rollModifier: number = 0;
var diceToRoll = 10;
var secondsBetweenRolls: number = 12;
var removeDiceImmediately: boolean = false;
const dieScale: number = 1.5;
//const damageDieBackgroundColor: string = '#7f090e';
//const damageDieFontColor: string = '#ffffff';
//const wildMagicDieBackgroundColor: string = '#401260';
//const wildMagicDieFontColor: string = '#ffffff';
var repeatRandomThrow: boolean = true;
var rollIsWildMagic: boolean = false;
var rollIsWildAnimalAttack: boolean = false;
var rollIsSneakAttack: boolean = false;
var rollIsPalladinSmite: boolean = false;
var randomDiceThrowIntervalId: number = 0;
var damageModifierThisRoll: number = 0;
var thisRollKind: DiceRollKind = DiceRollKind.Normal;
var thisRollType: DiceRollType = DiceRollType.SkillCheck;

enum DieEffect {
  Ring,
  Fireball,
  Portal,
  Shockwave,
  ColoredSmoke,
  Bomb,
  SteamPunkTunnel,
  HandGrab,
  Random
}

//`!-------------------------------------------------------

var container, scene, camera, renderer, controls, stats, world, dice = [];
var scalingDice = [];
var specialDice = [];
//var bodiesToremove = [];
var bodiesToFree = [];
var diceSounds = new DiceSounds('GameDev/Assets/DragonH/SoundEffects');

var waitingForSettle = false;
var allDiceHaveStoppedRolling = false;
var firstStopTime: number;
var diceValues = [];

function setNormalGravity() {
  world.gravity.set(0, -9.82 * 20, 0);
}

function restoreDieScale() {
  for (var i = 0; i < dice.length; i++) {
    let die = dice[i].getObject();
    die.scale.set(1, 1, 1);
  }
}

function clearAllDice() {
  if (!dice || dice.length === 0)
    return;
  for (var i = 0; i < dice.length; i++) {
    let die = dice[i];
    let dieObject = die.getObject();
    scene.remove(dieObject);
    die.clear();
  }
  dice = [];
  specialDice = [];
  scalingDice = [];
}



function init() { // From Rolling.html example.
  diceLayer = new DiceLayer();
  // SCENE
  // @ts-ignore - THREE
  scene = new THREE.Scene();

  // CAMERA
  //var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
  var SCREEN_WIDTH = 1920, SCREEN_HEIGHT = 1080;
  var lensFactor = 5;
  var VIEW_ANGLE = 45 / lensFactor, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.01, FAR = 20000;
  // @ts-ignore - THREE
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(0, 30 * lensFactor, 0);
  // RENDERER
  // @ts-ignore - THREE
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.shadowMap.enabled = true;
  // @ts-ignore - THREE
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container = document.getElementById('ThreeJS');
  container.appendChild(renderer.domElement);
  // EVENTS
  // CONTROLS
  // @ts-ignore - THREE
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  //// STATS
  //stats = new Stats();
  //stats.domElement.style.position = 'absolute';
  //stats.domElement.style.bottom = '0px';
  //stats.domElement.style.zIndex = 100;
  //container.appendChild(stats.domElement);

  // @ts-ignore - THREE
  let ambient = new THREE.AmbientLight('#ffffff', 0.35);
  scene.add(ambient);

  // @ts-ignore - THREE
  let directionalLight = new THREE.DirectionalLight('#ffffff', 0.25);
  directionalLight.position.x = -1000;
  directionalLight.position.y = 1000;
  directionalLight.position.z = 1000;
  scene.add(directionalLight);

  // @ts-ignore - THREE
  let light = new THREE.SpotLight(0xefdfd5, 0.7);
  light.position.x = 10;
  light.position.y = 100;
  light.position.z = 10;
  light.target.position.set(0, 0, 0);
  light.castShadow = true;
  light.shadow.camera.near = 50;
  light.shadow.camera.far = 110;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

  scene.add(light);


  // @ts-ignore - THREE
  var material = new THREE.ShadowMaterial();
  material.opacity = 0.5;
  // @ts-ignore - THREE
  var geometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
  // @ts-ignore - THREE
  var mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);

  ////////////
  // CUSTOM //
  ////////////
  // @ts-ignore - CANNON
  world = new CANNON.World();

  setNormalGravity();
  // @ts-ignore - CANNON
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 32;

  // @ts-ignore - DiceManager
  DiceManager.setWorld(world);

  // create the sphere's material
  const redWallMaterial =
    // @ts-ignore - THREE
    new THREE.MeshLambertMaterial(
      {
        color: 0xA00050
      });

  const blueWallMaterial =
    // @ts-ignore - THREE
    new THREE.MeshLambertMaterial(
      {
        color: 0x2000C0
      });

  const wallHeight = 24;
  const leftWallHeight = 24;
  const topWallHeight = 48;

  const wallThickness = 1;
  const leftWallWidth = 50;
  const leftWallX = -21.5;

  const dmLeftWallWidth = 9;
  const dmLeftWallX = 13;
  const dmLeftWallZ = -10;

  const topWallWidth = 50;
  const topWallZ = -12.5;

  const playerTopWallWidth = 30;
  const playerTopWallZ = 5;
  const playerTopWallX = -5;

  const playerRightWallWidth = 9;
  const playerRightWallX = 10;
  const playerRightWallZ = 9;

  const dmBottomWallWidth = 9;
  const dmBottomWallZ = -6;
  const dmBottomWallX = 17;

  const showWalls = false;
  const addPlayerWall = true;
  const addDungeonMasterWalls = true;
  if (showWalls) {

    // @ts-ignore - THREE
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, leftWallHeight, leftWallWidth), redWallMaterial);
    leftWall.position.x = leftWallX;
    scene.add(leftWall);

    // @ts-ignore - THREE
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(topWallWidth, topWallHeight, wallThickness), redWallMaterial);
    topWall.position.z = topWallZ;
    // @ts-ignore - THREE
    topWall.rotateOnAxis(new THREE.Vector3(1, 0, 0), -45)
    scene.add(topWall);

    if (addPlayerWall) {
      // @ts-ignore - THREE
      const playerTopWall = new THREE.Mesh(new THREE.BoxGeometry(playerTopWallWidth, wallHeight, wallThickness), redWallMaterial);
      playerTopWall.position.x = playerTopWallX;
      playerTopWall.position.z = playerTopWallZ;
      scene.add(playerTopWall);

      // @ts-ignore - THREE
      const playerRightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, playerRightWallWidth), blueWallMaterial);
      playerRightWall.position.x = playerRightWallX;
      playerRightWall.position.z = playerRightWallZ;
      scene.add(playerRightWall);
    }

    if (addDungeonMasterWalls) {
      // @ts-ignore - THREE
      const dmBottomWall = new THREE.Mesh(new THREE.BoxGeometry(dmBottomWallWidth, wallHeight, wallThickness), redWallMaterial);
      dmBottomWall.position.x = dmBottomWallX;
      dmBottomWall.position.z = dmBottomWallZ;
      scene.add(dmBottomWall);

      // @ts-ignore - THREE
      const dmLeftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, dmLeftWallWidth), redWallMaterial);
      dmLeftWall.position.x = dmLeftWallX;
      dmLeftWall.position.z = dmLeftWallZ;
      scene.add(dmLeftWall);
    }
  }


  // Floor
  // @ts-ignore - CANNON
  let floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: DiceManager.floorBodyMaterial });
  // @ts-ignore - CANNON
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  floorBody.name = 'floor';
  world.add(floorBody);

  //Walls
  // @ts-ignore - CANNON
  let rightWall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: DiceManager.barrierBodyMaterial });
  rightWall.name = 'wall';
  // @ts-ignore - CANNON
  rightWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
  rightWall.position.x = 20.5;
  world.add(rightWall);

  // @ts-ignore - CANNON
  let bottomWall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: DiceManager.barrierBodyMaterial });
  bottomWall.name = 'wall';
  // @ts-ignore - CANNON
  bottomWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2 * 2);
  bottomWall.position.z = 11.5;
  world.add(bottomWall);

  // @ts-ignore - CANNON
  var wallDiceContactMaterial = new CANNON.ContactMaterial(DiceManager.barrierBodyMaterial, DiceManager.diceBodyMaterial, { friction: 0.0, restitution: 0.9 });
  world.addContactMaterial(wallDiceContactMaterial);

  //let leftWall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: DiceManager.floorBodyMaterial });
  //leftWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
  //leftWall.position.x = -20;
  //world.add(leftWall);

  // @ts-ignore - CANNON & DiceManager
  let topCannonWall = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(topWallWidth, wallHeight, wallThickness)), material: DiceManager.barrierBodyMaterial });
  topCannonWall.name = 'wall';
  topCannonWall.position.z = topWallZ;
  // @ts-ignore - CANNON 
  topCannonWall.quaternion.setFromEuler(-Math.PI / 4, 0, 0);
  world.add(topCannonWall);

  // @ts-ignore - CANNON & DiceManager
  let leftCannonWall = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, leftWallWidth)), material: DiceManager.barrierBodyMaterial });
  leftCannonWall.name = 'wall';
  leftCannonWall.position.x = leftWallX;
  world.add(leftCannonWall);


  if (addPlayerWall) {
    // @ts-ignore - CANNON & DiceManager
    let playerTopCannonWall = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(playerTopWallWidth * 0.5, wallHeight, wallThickness)), material: DiceManager.barrierBodyMaterial });
    playerTopCannonWall.name = 'wall';
    playerTopCannonWall.position.x = playerTopWallX;
    playerTopCannonWall.position.z = playerTopWallZ;
    world.add(playerTopCannonWall);

    // @ts-ignore - CANNON & DiceManager
    let playerRightCannonWall = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, playerRightWallWidth * 0.5)), material: DiceManager.barrierBodyMaterial });
    playerRightCannonWall.name = 'wall';
    playerRightCannonWall.position.x = playerRightWallX;
    playerRightCannonWall.position.z = playerRightWallZ;
    world.add(playerRightCannonWall);
  }

  if (addDungeonMasterWalls) {
    // @ts-ignore - CANNON & DiceManager
    let dmBottomCannonWall = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(dmBottomWallWidth * 0.5, wallHeight, wallThickness)), material: DiceManager.barrierBodyMaterial });
    dmBottomCannonWall.name = 'wall';
    dmBottomCannonWall.position.x = dmBottomWallX;
    dmBottomCannonWall.position.z = dmBottomWallZ;
    world.add(dmBottomCannonWall);

    // @ts-ignore - CANNON & DiceManager
    let dmLeftCannonWall = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, dmLeftWallWidth * 0.5)), material: DiceManager.barrierBodyMaterial });
    dmLeftCannonWall.name = 'wall';
    dmLeftCannonWall.position.x = dmLeftWallX;
    dmLeftCannonWall.position.z = dmLeftWallZ;
    world.add(dmLeftCannonWall);
  }

  //var groundShape = new CANNON.Plane();
  //var groundBody = new CANNON.Body({ mass: 0 });
  //groundBody.addShape(groundShape);
  //groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
  //world.add(groundBody);


  var needToHookEvents: boolean = true;

  function randomDiceThrow() {
    clearBeforeRoll();

    let dieValues: number = 10;
    for (var i = 0; i < diceToRoll; i++) {
      // @ts-ignore - DiceD20
      var die = new DiceD10x01({ size: dieScale, backColor: '#D0D0ff' });
      scene.add(die.getObject());
      dice.push(die);
    }
    needToHookEvents = true;

    for (var i = 0; i < dice.length; i++) {
      let yRand = Math.random() * 20
      let die = dice[i].getObject();
      die.position.x = -15 - (i % 3) * dieScale;
      die.position.y = 4 + Math.floor(i / 3) * dieScale;
      die.position.z = -13 + (i % 3) * dieScale;
      die.quaternion.x = (Math.random() * 90 - 45) * Math.PI / 180;
      die.quaternion.z = (Math.random() * 90 - 45) * Math.PI / 180;
      dice[i].updateBodyFromMesh();
      let rand = Math.random() * 5;
      die.body.velocity.set(35 + rand, 10 + yRand, 25 + rand);
      die.body.angularVelocity.set(20 * Math.random() - 10, 20 * Math.random() - 10, 20 * Math.random() - 10);

      diceValues.push({ dice: dice[i], value: Math.floor(Math.random() * dieValues + 1) });
      die.body.name = 'die';
    }

    allDiceHaveStoppedRolling = false;

    // @ts-ignore - DiceManager
    DiceManager.prepareValues(diceValues);

    if (needToHookEvents) {
      // Test to see if this is related to the memory leak:

      needToHookEvents = false;
      for (var i = 0; i < dice.length; i++) {
        let die = dice[i].getObject();

        die.body.addEventListener("collide", handleDieCollision);
      }
    }
  }

  if (repeatRandomThrow) {
    randomDiceThrowIntervalId = setInterval(randomDiceThrow, secondsBetweenRolls * 1000);
    randomDiceThrow();
    requestAnimationFrame(animate);
  }
}

function movePointAtAngle(point: Vector, angleInDegrees: number, distance): Vector {
  let angleInRadians: number = angleInDegrees * Math.PI / 180;
  return new Vector(point.x + (Math.sin(angleInRadians) * distance), point.y - (Math.cos(angleInRadians) * distance));
}

function handleDieCollision(e: any) {
  // @ts-ignore - DiceManager
  if (DiceManager.throwRunning || dice.length == 0)
    return;

  if (firstContactSoundEffect) {
    diceSounds.safePlayMp3(firstContactSoundEffect);
    firstContactSoundEffect = null;
  }

  let relativeVelocity: number = Math.abs(Math.round(e.contact.getImpactVelocityAlongNormal()));
  //console.log(e.target.name + ' -> ' + e.body.name + ' at ' + relativeVelocity + 'm/s');

  if (e.target.name === "die" && e.body.name === "die")
    diceSounds.playDiceHit(relativeVelocity / 10);
  else if (e.target.name === "die" && e.body.name === "floor") {
    if (e.target.parentDie.hasNotHitFloorYet) {
      e.target.parentDie.hasNotHitFloorYet = false;
      dieFirstHitsFloor(e.target.parentDie);
    }
    if (relativeVelocity < 8) {
      diceSounds.playSettle();
    }
    else {
      diceSounds.playFloorHit(relativeVelocity / 35);
      if (rollIsWildMagic) {
        if (relativeVelocity > 12) {
          let pos: Vector = getScreenCoordinates(e.target.parentDie.getObject());
          if (!e.target.parentDie.sparks)
            e.target.parentDie.sparks = [];
          e.target.parentDie.sparks.push(diceLayer.spark(pos.x, pos.y));
          diceSounds.playRandom('Dice/Zap', 4);
        }
      }
    }
  }
  else if (e.target.name === "die" && e.body.name === "wall")
    diceSounds.playWallHit(relativeVelocity / 40);
}

var addedOneHeavyEffectThisRoll: boolean = false;

function dieFirstHitsFloor(die: any) {
  if (rollIsSneakAttack && !die.isDamage && !addedOneHeavyEffectThisRoll) {
    //addedOneHeavyEffectThisRoll = true;
    let pos: Vector = getScreenCoordinates(die.getObject());
    let percentageOnDie: number = 0.7;
    let percentageOffDie: number = 1 - percentageOnDie;
    diceLayer.addSneakAttack(pos.x * percentageOnDie + percentageOffDie * 960, pos.y * percentageOnDie + percentageOffDie * 540, diceLayer.activePlayerHueShift);
    diceSounds.safePlayMp3('SneakAttack');
  }
}

function positionTrailingSprite(die: any, addPrintFunc: (x: number, y: number, angle: number) => SpriteProxy, minForwardDistanceBetweenPrints: number, leftRightDistanceBetweenPrints: number = 0, index: number = 0): boolean {
  if (!die.isDamage) {
    let pos: Vector = getScreenCoordinates(die.getObject());
    if (die.lastPos.length <= index)
      die.lastPos.push(new Vector(-100, -100));
    let deltaX: number = pos.x - die.lastPos[index].x;
    let deltaY: number = pos.y - die.lastPos[index].y;

    //` <formula 2; \sqrt{deltaX^2 + deltaY^2}>
    let distanceSinceLastPoint: number = Math.sqrt(deltaX * deltaX + deltaY * deltaY);


    // ![](44408656431640F1B13DDCA10C7B507D.png;;;0.04947,0.04744)
    if (distanceSinceLastPoint > minForwardDistanceBetweenPrints) {

      //` <formula 3; \frac{atan2(deltaY,deltaX) * 180}{\pi} + 90^{\circ}>
      let angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90;
      var angleToMovePawPrint: number = 90;
      if (die.lastPawPrintOnLeft)
        angleToMovePawPrint = -90;
      die.lastPawPrintOnLeft = !die.lastPawPrintOnLeft;
      let pawPrintPos: Vector = movePointAtAngle(pos, angle + angleToMovePawPrint, leftRightDistanceBetweenPrints);
      addPrintFunc(pawPrintPos.x, pawPrintPos.y, angle);
      //diceLayer.addPawPrint(pawPrintPos.x, pawPrintPos.y, angle);
      die.lastPos[index] = pos;
      return true;
    }
  }
  return false;
}

//function placePuff(die: any) {
//  if (!die.isDamage) {
//    let pos: Vector = getScreenCoordinates(die.getObject());
//    let deltaX: number = pos.x - die.lastPos.x;
//    let deltaY: number = pos.y - die.lastPos.y;

//    //` <formula 2; \sqrt{deltaX^2 + deltaY^2}>
//    let distanceSinceLastPoint: number = Math.sqrt(deltaX * deltaX + deltaY * deltaY);


//    const minForwardDistanceBetweenPuffs = 150;
//    if (distanceSinceLastPoint > minForwardDistanceBetweenPuffs) {

//      //` <formula 3; \frac{atan2(deltaY,deltaX) * 180}{\pi} + 90^{\circ}>
//      let angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90;
//      diceLayer.addPuff(pos.x, pos.y, angle);
//      die.lastPos = pos;
//    }
//  }
//}

function animate() {
  updatePhysics();
  render();
  update();

  requestAnimationFrame(animate);
}

function anyDiceStillRolling(): boolean {
  for (var i = 0; i < dice.length; i++) {
    let dieObject = dice[i].getObject();
    if (dieObject.body.velocity.norm() > 10)
      return true;
  }
  return false;
}

function checkStillRolling() {
  if (allDiceHaveStoppedRolling)
    return;
  if (anyDiceStillRolling()) {
    waitingForSettle = true;
    return;
  }

  if (waitingForSettle) {
    waitingForSettle = false;
    firstStopTime = performance.now();
  }
  else {
    let thisTime: number = performance.now();
    if ((thisTime - firstStopTime) / 1000 > 1.5) {
        onDiceRollStopped();
    }
  }
}

function getDiceValue(die: any) {
  for (var i = 0; i < diceValues.length; i++) {
    let thisDiceValueEntry: any = diceValues[i];
    if (thisDiceValueEntry.dice == die) {
      if (thisDiceValueEntry.value != die.getUpsideValue())
        console.error(`thisDiceValueEntry.value (${thisDiceValueEntry.value}) != dice.getUpsideValue() (${die.getUpsideValue()})`);
      return thisDiceValueEntry.value;
    }
  }
  return 0;
}

function getScreenCoordinates(element): Vector {
  // @ts-ignore - THREE
  var screenVector = new THREE.Vector3();
  element.localToWorld(screenVector);

  screenVector.project(camera);

  var x = Math.round((screenVector.x + 1) * renderer.domElement.offsetWidth / 2);
  var y = Math.round((1 - screenVector.y) * renderer.domElement.offsetHeight / 2);

  return new Vector(x, y);
}

function getDieEffectDistance(): number {
  return Math.round(Math.random() * 5) * 40 + 40;
}

function removeSingleDieNow(die: any) {
  removeDie(die, 0, DieEffect.HandGrab);

  for (var i = 0; i < dice.length; i++) {
    if (dice[i] === die) {
      die.inPlay = false;
      removeDieEffectsForSingleDie(die);
    }
  }
}

function removeRemainingDice() {
  // TODO: Make sure we can call this robustly at any time.
  let dieEffectInterval: number = 0;
  removeDieEffects();
  var effectOverride = getRandomEffect();
  for (var i = 0; i < dice.length; i++) {
    if (dice[i].inPlay)
      dieEffectInterval = removeDie(dice[i], dieEffectInterval, effectOverride);
  }
}

function removeDie(die: any, dieEffectInterval: number, effectOverride: DieEffect = undefined) {

  if (effectOverride === undefined || effectOverride === DieEffect.Random) {
    var numTries: number = 0;
    effectOverride = getRandomEffect();
    while (effectOverride === DieEffect.Random && numTries < 10) {
      effectOverride = getRandomEffect();
      numTries++;
    }
    if (effectOverride === DieEffect.Random)
      effectOverride = DieEffect.Bomb;
  }

  let dieObject: any = die.getObject();
  dieObject.removeTime = performance.now();
  dieObject.effectKind = effectOverride;
  dieEffectInterval += getDieEffectDistance();
  dieObject.effectStartOffset = dieEffectInterval;
  dieObject.needToStartEffect = true;
  specialDice.push(die);  // DieEffect.Portal too???

  if (effectOverride === DieEffect.Portal) {
    dieObject.needToDrop = true;
    scalingDice.push(die);
    //console.log('die.body.collisionResponse: ' + die.body.collisionResponse);
    //die.body.collisionResponse = 0;
    //die.body.mass = 0;
    //world.gravity.set(0, -9.82 * 2000, 0);
    //die.position.x = -99999;
    // @ts-ignore - CANNON
    //var localVelocity = new CANNON.Vec3(0, 00, 0);
    //die.body.velocity = localVelocity;
    //let factor: number = 5;
    //let xSpin: number = Math.random() * factor - factor / 2;
    //let ySpin: number = Math.random() * factor - factor / 2;
    //let zSpin: number = Math.random() * factor - factor / 2;
    //// @ts-ignore - THREE
    //die.body.angularVelocity.set(xSpin, ySpin, zSpin);
    //setTimeout(spinDie.bind(die), 200);
  }
  else if (effectOverride === DieEffect.HandGrab) {
    dieObject.hideOnScaleStop = true;
    dieObject.needToDrop = true;
    scalingDice.push(die);
  }
  else if (effectOverride === DieEffect.SteamPunkTunnel) {
    dieObject.hideOnScaleStop = true;
    dieObject.needToDrop = true;
    scalingDice.push(die);
  }
  return dieEffectInterval;
}

function getRandomEffect() {
  let random: number = Math.random() * 100;
  if (random < 20)
    return DieEffect.Bomb;
  else if (random < 40)
    return DieEffect.ColoredSmoke;
  else if (random < 60)
    return DieEffect.Portal;
  else if (random < 80)
    return DieEffect.SteamPunkTunnel;
  else
    return DieEffect.Random;
}

function scaleFallingDice() {
  if (!scalingDice || scalingDice.length == 0)
    return;

  var hiddenDie = [];
  if (scalingDice && scalingDice.length > 0) {
    for (var i = 0; i < scalingDice.length; i++) {

      let dieObject = scalingDice[i].getObject();
      let portalOpenTime: number = dieObject.removeTime + dieObject.effectStartOffset;

      let now: number = performance.now();
      let waitToFallTime: number;
      if (dieObject.effectKind == DieEffect.SteamPunkTunnel) {
        waitToFallTime = 35 * 30;
      }
      else if (dieObject.effectKind == DieEffect.HandGrab) {
        waitToFallTime = 34 * 30;
      }
      else { // DieEffect.Portal
        waitToFallTime = 700;
      }

      if (now > portalOpenTime && dieObject.needToStartEffect) {
        dieObject.needToStartEffect = false;
        let screenPos: Vector = getScreenCoordinates(dieObject);

        if (dieObject.effectKind == DieEffect.SteamPunkTunnel) {
          diceLayer.addSteampunkTunnel(screenPos.x, screenPos.y, Math.floor(Math.random() * 360), 100, 100);
          diceSounds.playSteampunkTunnel();
        }
        else if (dieObject.effectKind == DieEffect.HandGrab) {
          let saturation: number = 100;
          let hueShift: number;
          if (DiceLayer.matchOozeToDieColor)
            if (scalingDice[i].isDamage)
              hueShift = 0;
            else
              hueShift = diceLayer.activePlayerHueShift;
          else {
            hueShift = getNonGreenHueShift();
            if (Math.random() < 0.1)
              saturation = 0;
          }

          diceLayer.testDiceGrab(screenPos.x, screenPos.y, hueShift, saturation, 100);
          diceSounds.playHandGrab();
        }
        else {  // DieEffect.Portal
          // Get a non-green hue shift:
          let hueShift = getNonGreenHueShift();
          diceLayer.addPortal(screenPos.x, screenPos.y, hueShift, 100, 100);
          diceSounds.playOpenDiePortal();
        }
      }

      let startFallTime: number = dieObject.removeTime + waitToFallTime + dieObject.effectStartOffset;

      if (now < startFallTime)
        continue;

      let totalFrames: number;
      let fps30: number = 33; // ms

      let totalScaleDistance: number;

      let elapsedTime: number = now - startFallTime;

      if (dieObject.effectKind == DieEffect.SteamPunkTunnel) {
        totalFrames = 45;
        totalScaleDistance = 0.9;
      }
      else if (dieObject.effectKind == DieEffect.HandGrab) {
        totalFrames = 30;
        totalScaleDistance = 0.99;
      }
      else {
        totalFrames = 40;
        totalScaleDistance = 0.99;
      }

      let totalTimeToScale: number = fps30 * totalFrames;  // ms

      if (elapsedTime > totalTimeToScale) {
        if (dieObject.hideOnScaleStop) {
          dieObject.hideOnScaleStop = false;
          hideDie(dieObject);
          hiddenDie.push(scalingDice[i]);
        }
        continue;
      }

      if (dieObject.needToDrop === true) {

        dieObject.needToDrop = false;
      }

      let percentTraveled: number = elapsedTime / totalTimeToScale;

      let distanceTraveled: number = percentTraveled * totalScaleDistance;

      let newScale: number = 1 - distanceTraveled;

      if (newScale <= hiddenDieScale) {
        hideDie(dieObject);
      }
      else {
        dieObject.scale.set(newScale, newScale, newScale);
      }
      //if (newScale < 0.35) {
      //  bodiesToRemove.push(die);
      //  // @ts-ignore - DiceManager
      //  //die.body.collisionResponse = 1;
      //  //die.body.mass = 1;
      //  //DiceManager.world.remove(die.body);
      //}
    }
  }
  removeDiceFromArray(hiddenDie, scalingDice);
  removeDiceFromArray(hiddenDie, dice);
}

function getNonGreenHueShift() {
  let hueShift = Math.floor(Math.random() * 360);
  var tryCount: number = 0;
  while (hueShift > 30 && hueShift < 160 && tryCount++ < 20) {
    hueShift = Math.floor(Math.random() * 360);
  }
  return hueShift;
}

function hideDieIn(dieObject: any, ms: number) {
  dieObject.hideTime = performance.now() + ms;
  dieObject.needToHideDie = true;
}

const hiddenDieScale: number = 0.01;

function hideDie(dieObject: any) {
  dieObject.scale.set(hiddenDieScale, hiddenDieScale, hiddenDieScale);
  dieObject.isHidden = true;
  clearAllDiceIfHidden();
}

function clearAllDiceIfHidden() {
  for (var i = 0; i < dice.length; i++) {
    let die: any = dice[i];
    let dieObject = die.getObject();
    if (!dieObject.isHidden)
      return;
  }
  clearAllDice();
}

function removeDieEffects() {
  for (var i = 0; i < dice.length; i++) {
    let die: any = dice[i];
    removeDieEffectsForSingleDie(die);
  }
}

function removeDieEffectsForSingleDie(die: any) {
  var now: number = performance.now();
  if (die.attachedSprite)
    for (var i = 0; i < die.attachedSprite.length; i++) {
      let sprite: SpriteProxy = die.attachedSprite[i];
      const fadeOutTime = 1200;
      sprite.expirationDate = now + fadeOutTime;
      sprite.fadeOutTime = fadeOutTime;
    }
  die.attachedSprite = [];
  die.origins = [];
}

function highlightSpecialDice() {
  if (!specialDice || specialDice.length == 0)
    return;


  let now: number = performance.now();

  var hiddenDie = [];
  for (var i = 0; i < specialDice.length; i++) {
    let dieObject = specialDice[i].getObject();

    if (dieObject.needToHideDie) {
      if (dieObject.hideTime < now) {
        dieObject.needToHideDie = false;
        hideDie(dieObject);
        hiddenDie.push(specialDice[i]);
      }
    }

    if (dieObject.needToStartEffect) {
      let effectStartTime: number = dieObject.removeTime + dieObject.effectStartOffset;
      if (now > effectStartTime && dieObject.needToStartEffect) {

        dieObject.needToStartEffect = false;

        // die.dieValue is also available.
        let screenPos: Vector = getScreenCoordinates(dieObject);

        if (dieObject.effectKind === DieEffect.Ring) {
          diceLayer.addMagicRing(screenPos.x, screenPos.y, Math.floor(Math.random() * 360), 100, 100);
        }
        else if (dieObject.effectKind === DieEffect.Fireball) {
          //diceLayer.addD20Fire(screenPos.x, screenPos.y);
          diceLayer.testFireball(screenPos.x, screenPos.y);
          diceSounds.playFireball();
        }
        else if (dieObject.effectKind === DieEffect.Bomb) {
          diceLayer.addDiceBomb(screenPos.x, screenPos.y, Math.floor(Math.random() * 360), 100, 100);
          diceSounds.playDieBomb();
          hideDieIn(dieObject, 700);
        }
        else if (dieObject.effectKind === DieEffect.SteamPunkTunnel) {
          diceLayer.addSteampunkTunnel(screenPos.x, screenPos.y, Math.floor(Math.random() * 360), 100, 100);
          //diceLayer.playSteampunkTunnel();
          //hideDieIn(die, 700);
        }
        else if (dieObject.effectKind === DieEffect.HandGrab) {
          diceLayer.testDiceGrab(screenPos.x, screenPos.y, Math.floor(Math.random() * 360), 100, 100);
          //diceSounds.playHandGrab();
          //hideDieIn(die, 41 * 30);
        }
        else if (dieObject.effectKind === DieEffect.ColoredSmoke) {
          let saturation: number = 100;
          let brightnessBase: number = 50;
          let rand: number = Math.random() * 100;
          if (rand < 5) {
            saturation = 0;
            brightnessBase = 110;
          }
          else if (rand < 10) {
            saturation = 25;
            brightnessBase = 100;
          }
          else if (rand < 25) {
            saturation = 50;
            brightnessBase = 90;
          }
          else if (rand < 75) {
            saturation = 75;
            brightnessBase = 70;
          }

          diceLayer.blowColoredSmoke(screenPos.x, screenPos.y, Math.floor(Math.random() * 360), saturation, brightnessBase + Math.random() * 80);
          hideDie(dieObject);
          hiddenDie.push(specialDice[i]);
          diceSounds.playDiceBlow();
        }
      }
    }
  }
  removeDiceFromArray(hiddenDie, specialDice);
  removeDiceFromArray(hiddenDie, dice);
}

function removeSingleDieFromArray(dieToRemove: any, list: any) {
  for (var i = 0; i < list.length; i++) {
    if (dieToRemove == list[i]) {
      list.splice(i, 1);
      return;
    }
  }
}

function removeDiceFromArray(dieToRemove: any, list: any) {
  for (var i = 0; i < dieToRemove; i++) {
    removeSingleDieFromArray(dieToRemove[i], list);
  }
}

function updatePhysics() {
  //  if (bodiesToRemove && bodiesToRemove.length > 0) {
  //    console.log('removing bodies...');

  //    bodiesToRemove.forEach(function (body) {
  //      body.collisionResponse = true;
  //      body.mass = 1;
  //      world.remove(body);
  //    });
  //    bodiesToRemove = [];
  //  }

  world.step(1.0 / 60.0);

  for (var i in dice) {
    dice[i].updateMeshFromBody();
  }
  checkStillRolling();
  scaleFallingDice();
  highlightSpecialDice();
}

function prepareDie(die: any, throwPower: number, xPositionModifier: number = 0) {
  prepareBaseDie(die, throwPower, xPositionModifier);

  var newValue: number = Math.floor(Math.random() * die.values + 1);
  diceValues.push({ dice: die, value: newValue });
}

function prepareBaseDie(die: any, throwPower: number, xPositionModifier: number = 0) {
  let dieObject = die.getObject();
  scene.add(dieObject);
  die.inPlay = true;
  die.attachedSprite = [];
  die.origins = [];
  dice.push(die);

  die.hasNotHitFloorYet = true;

  let index: number = dice.length;
  let yVelocityModifier: number = Math.random() * 10 * throwPower;
  dieObject.position.x = xPositionModifier + -15 - (index % 3) * dieScale;
  dieObject.position.y = 4 + Math.floor(index / 3) * dieScale;
  dieObject.position.z = -13 + (index % 3) * dieScale;
  dieObject.quaternion.x = (Math.random() * 90 - 45) * Math.PI / 180;
  dieObject.quaternion.z = (Math.random() * 90 - 45) * Math.PI / 180;
  let xVelocityMultiplier: number = 1;
  if (xPositionModifier != 0)
    xVelocityMultiplier = -1;
  die.updateBodyFromMesh();
  let xVelocityModifier: number = Math.random() * 20 * throwPower;
  let zVelocityModifier: number = Math.random() * 20 * throwPower;
  dieObject.body.velocity.set(xVelocityMultiplier * (35 + xVelocityModifier), 10 + yVelocityModifier, 25 + zVelocityModifier);
  let angularModifierLimit: number = 20 * throwPower;
  let angularModifierHalfLimit: number = angularModifierLimit / 2;
  let xAngularRotationModifier: number = Math.random() * angularModifierLimit;
  let yAngularRotationModifier: number = Math.random() * angularModifierLimit;
  let zAngularRotationModifier: number = Math.random() * angularModifierLimit;
  dieObject.body.angularVelocity.set(xAngularRotationModifier - angularModifierHalfLimit, yAngularRotationModifier - angularModifierHalfLimit, zAngularRotationModifier - angularModifierHalfLimit);
  dieObject.body.name = 'die';
  dieObject.body.addEventListener("collide", handleDieCollision);
  die.lastPos = [];
  die.lastPos.push(new Vector(-100, -100));
  die.lastPawPrintOnLeft = false;
}

function prepareD10x10Die(die: any, throwPower: number, xPositionModifier: number = 0) {
  prepareBaseDie(die, throwPower, xPositionModifier);
  var newValue: number = Math.floor(Math.random() * die.values) + 1;
  diceValues.push({ dice: die, value: newValue });
}

function prepareD10x01Die(die: any, throwPower: number, xPositionModifier: number = 0) {
  prepareBaseDie(die, throwPower, xPositionModifier);
  var newValue: number = Math.floor(Math.random() * die.values) + 1;
  diceValues.push({ dice: die, value: newValue });
}

function clearBeforeRoll() {
  diceLayer.clearResidualEffects();
  scalingDice = [];
  specialDice = [];
  restoreDieScale();
  setNormalGravity();
  waitingForSettle = true;
  diceValues = [];

  clearAllDice();
  allDiceHaveStoppedRolling = false;
}

function queueRoll(diceRollData: DiceRollData) {
  console.log('queueRoll - TODO');
  // TODO: queue this roll for later when the current roll has stopped.
}

function addD100(diceRollData: DiceRollData, backgroundColor: string, textColor: string, throwPower: number = 1, xPositionModifier: number = 0) {

  // @ts-ignore - DiceD10x10
  var die = new DiceD10x10({ size: dieScale, backColor: backgroundColor, fontColor: textColor });
  prepareD10x10Die(die, throwPower, xPositionModifier);
  if (diceRollData.isMagic) {
    die.attachedSprite.push(diceLayer.addMagicRing(960, 540, Math.floor(Math.random() * 360), 100, 100));
    die.origins.push(new Vector(diceLayer.magicRing.originX, diceLayer.magicRing.originY));
  }

  // @ts-ignore - DiceD10x01
  die = new DiceD10x01({ size: dieScale, backColor: backgroundColor, fontColor: textColor });
  prepareD10x01Die(die, throwPower, xPositionModifier);
  if (diceRollData.isMagic) {
    die.attachedSprite.push(diceLayer.addMagicRing(960, 540, Math.floor(Math.random() * 360), 100, 100));
    die.origins.push(new Vector(diceLayer.magicRing.originX, diceLayer.magicRing.originY));
  }
}

function addDie(dieStr: string, backgroundColor: string, textColor: string, throwPower: number = 1, isDamage: boolean = false, xPositionModifier: number = 0): any {
  let countPlusDie: string[] = dieStr.split('d');
  if (countPlusDie.length != 2)
    throw new Error(`Issue with die format string: "${dieStr}". Unable to throw dice.`);
  let count: number = 1;
  if (countPlusDie[0])
    count = +countPlusDie[0];
  let dieKind: string = countPlusDie[1];

  for (var i = 0; i < count; i++) {
    // @ts-ignore - DiceD4
    let die: DiceObject = null;
    switch (dieKind) {
      case '4':
        // @ts-ignore - DiceD4
        die = new DiceD4({ size: dieScale, backColor: backgroundColor, fontColor: textColor });
        break;
      case '6':
        // @ts-ignore - DiceD6
        die = new DiceD6({ size: dieScale, backColor: backgroundColor, fontColor: textColor });
        break;
      case '8':
        // @ts-ignore - DiceD8
        die = new DiceD8({ size: dieScale, backColor: backgroundColor, fontColor: textColor });
        break;
      case '10':
        // @ts-ignore - DiceD10
        die = new DiceD10({ size: dieScale, backColor: backgroundColor, fontColor: textColor });
        break;
      case '1001':
        // @ts-ignore - DiceD10x01
        die = new DiceD10x01({ size: dieScale, backColor: backgroundColor, fontColor: textColor });
        break;
      case '1010':
        // @ts-ignore - DiceD10x01
        die = new DiceD10x10({ size: dieScale, backColor: backgroundColor, fontColor: textColor });
        break;
      case '12':
        // @ts-ignore - DiceD12
        die = new DiceD12({ size: dieScale, backColor: backgroundColor, fontColor: textColor });
        break;
      case '20':
        // @ts-ignore - DiceD20
        die = new DiceD20({ size: dieScale, backColor: backgroundColor, fontColor: textColor });
        break;
    }
    if (die === null) {
      throw new Error(`Die not found: "${dieStr}". Unable to throw dice.`);
    }
    prepareDie(die, throwPower, xPositionModifier);
    die.isDamage = isDamage;
  }
}

function addDamageDie(damageDice: string, throwPower: number, xPositionModifier: number = 0) {
  let allDice: string[] = damageDice.split(',');

  var modifier: number = 0;
  allDice.forEach(function (dieSpec: string) {
    let dieAndModifier = dieSpec.split('+');
    if (dieAndModifier.length == 2)
      modifier += +dieAndModifier[1];
    addDie(dieAndModifier[0], damageDieBackgroundColor, damageDieFontColor, throwPower, true, xPositionModifier);
  });

  damageModifierThisRoll = modifier;
}

function update() {
  controls.update();
  if (stats) {
    stats.update();
  }
}

function render() {
  renderer.render(scene, camera);

  updateDieRollSpecialEffects();

  diceLayer.renderCanvas();
}

init();

var nextBirdFlapInterval: number = 600 + Random.plusMinus(400);
var nextCrowInterval: number = 800 + Random.plusMinus(300);

function updateDieRollSpecialEffects() {
  for (var i = 0; i < dice.length; i++) {
    let die = dice[i];
    if (rollIsWildAnimalAttack) {
      positionTrailingSprite(die, diceLayer.addPawPrint.bind(diceLayer), 90, 50);
    }
    if (rollIsSneakAttack) {
      positionTrailingSprite(die, diceLayer.addPuff.bind(diceLayer), 120 + Random.plusMinus(30));
    }
    if (rollIsWildMagic) {
      positionTrailingSprite(die, diceLayer.addSparkTrail.bind(diceLayer), 84);
    }
    if (rollIsPalladinSmite) {
      if (positionTrailingSprite(die, diceLayer.addSpiral.bind(diceLayer), 150)) {
        if (diceSounds.playRandom('Crow', 3, nextCrowInterval))
          nextCrowInterval = 500 + Random.plusMinus(300);
      }
      if (positionTrailingSprite(die, diceLayer.addRaven.bind(diceLayer), 5, 15, 1)) {
        if (diceSounds.playRandom('Flap', 6, nextBirdFlapInterval))
          nextBirdFlapInterval = 600 + Random.plusMinus(400);
      }
    }

    if (die.attachedSprite && die.attachedSprite.length > 0) {
      let screenPos: Vector = getScreenCoordinates(die.getObject());
      for (var j = 0; j < die.attachedSprite.length; j++) {
        let centerX: number = screenPos.x - die.origins[j].x;
        let centerY: number = screenPos.y - die.origins[j].y;
        let sprite: SpriteProxy = die.attachedSprite[j];
        sprite.x = centerX;
        sprite.y = centerY;
      }
    }
    if (die.sparks) {
      let screenPos: Vector = getScreenCoordinates(die.getObject());
      let newX: number = screenPos.x - diceLayer.diceSparks.originX;
      let newY: number = screenPos.y - diceLayer.diceSparks.originY;
      die.sparks.forEach(function (spark: SpriteProxy) {
        const newLocationWeight = 0.1;
        spark.x = spark.x * (1 - newLocationWeight) + newX * newLocationWeight;
        spark.y = spark.y * (1 - newLocationWeight) + newY * newLocationWeight;
      });
    }
  }
}

function pleaseRollDice(diceRollData: DiceRollData) {
  addedOneHeavyEffectThisRoll = false;
  if (randomDiceThrowIntervalId != 0) {
    clearInterval(randomDiceThrowIntervalId);
    randomDiceThrowIntervalId = 0;
  }

  // @ts-ignore - DiceManager
  if (DiceManager.throwRunning) {
    queueRoll(diceRollData);
    return;
  }

  let xPositionModifier: number = 0;

  if (Math.random() * 100 < 50)
    xPositionModifier = 26;  // Throw from the right to the left.

  clearBeforeRoll();
  thisRollKind = diceRollData.kind;
  thisRollType = diceRollData.type;
  hiddenThreshold = diceRollData.hiddenThreshold;
  rollModifier = diceRollData.modifier;

  rollIsWildAnimalAttack = diceRollData.isWildAnimalAttack;
  rollIsPalladinSmite = diceRollData.isPaladinSmiteAttack;
  rollIsSneakAttack = diceRollData.isSneakAttack;
  if (rollIsWildAnimalAttack)
    firstContactSoundEffect = 'WildForm';

  if (diceRollData.type == DiceRollType.WildMagic) {
    rollIsWildMagic = true;
    itsAD20Roll = false;
    addD100(diceRollData, diceLayer.activePlayerSpecialDieColor, diceLayer.activePlayerSpecialDieFontColor, diceRollData.throwPower, xPositionModifier);
  }
  else {
    itsAD20Roll = true;
    rollIsWildMagic = false;
    let numD20s: number = 1;
    if (diceRollData.kind !== DiceRollKind.Normal)
      numD20s = 2;

    let d20BackColor: string = diceLayer.activePlayerDieColor;
    let d20FontColor: string = diceLayer.activePlayerDieFontColor;

    if (rollIsPalladinSmite || rollIsWildAnimalAttack || rollIsWildMagic || rollIsSneakAttack) {
      d20BackColor = diceLayer.activePlayerSpecialDieColor;
      d20FontColor = diceLayer.activePlayerSpecialDieFontColor;
    }
    for (var i = 0; i < numD20s; i++) {
      // @ts-ignore - DiceD20
      var die = new DiceD20({ size: dieScale, backColor: d20BackColor, fontColor: d20FontColor });
      die.isD20 = true;
      prepareDie(die, diceRollData.throwPower, xPositionModifier);
      if (diceRollData.isMagic) {
        die.attachedSprite.push(diceLayer.addMagicRing(960, 540, Math.floor(Math.random() * 360), 100, 100));
        die.origins.push(new Vector(diceLayer.magicRing.originX, diceLayer.magicRing.originY));
      }
      if (rollIsPalladinSmite) {
        let angle: number = Math.random() * 360;
        die.attachedSprite.push(diceLayer.addHaloSpin(960, 540, diceLayer.activePlayerHueShift + Random.plusMinus(30), angle));
        die.origins.push(new Vector(diceLayer.haloSpins.originX, diceLayer.haloSpins.originY));
        die.attachedSprite.push(diceLayer.addHaloSpin(960, 540, diceLayer.activePlayerHueShift + Random.plusMinus(30), angle + 180));
        die.origins.push(new Vector(diceLayer.haloSpins.originX, diceLayer.haloSpins.originY));
      }
    }

    if (diceRollData.type == DiceRollType.Attack) {
      addDamageDie(diceRollData.damageDice, diceRollData.throwPower, xPositionModifier);
    }
  }

  try {
    // @ts-ignore - DiceManager
    DiceManager.prepareValues(diceValues);
  }
  catch (ex) {
    console.log('exception on call to DiceManager.prepareValues: ' + ex);
  }

  if (rollIsWildMagic) {
    diceSounds.safePlayMp3('WildMagicRoll');
  }
  if (rollIsPalladinSmite) {
    diceSounds.safePlayMp3('PaladinThunder');
  }
  if (rollIsSneakAttack) {
    diceSounds.safePlayMp3('SneakAttackWhoosh');
  }
}

function onDiceRollStopped() {
  allDiceHaveStoppedRolling = true;
  console.log('Dice have stopped rolling!');
  diceHaveStoppedRolling(null);
  //console.log(dice);
  //console.log(diceValues);
  let checkD20s: boolean = itsAD20Roll && thisRollKind != DiceRollKind.Normal;
  let totalDamage: number = 0;
  let d20Value: number = -1;
  let thisRollValue: number = 0;
  let otherDie: any = null;
  const vantageTextDelay = 900;
  for (var i = 0; i < dice.length; i++) {
    let die = dice[i];
    let topNumber = die.getTopNumber();

    if (checkD20s && die.isD20) {
      if (d20Value == -1)
        d20Value = topNumber;
      else if (thisRollKind == DiceRollKind.Advantage) {
        if (d20Value <= topNumber) {
          removeSingleDieNow(otherDie);
          diceLayer.addAdvantageText(otherDie, vantageTextDelay);
          d20Value = topNumber;
        }
        else {
          removeSingleDieNow(die);
          diceLayer.addAdvantageText(die, vantageTextDelay);
        }
      }
      else if (thisRollKind == DiceRollKind.Disadvantage) {
        if (d20Value >= topNumber) {
          removeSingleDieNow(otherDie);
          diceLayer.addDisadvantageText(otherDie, vantageTextDelay);
          d20Value = topNumber;
        }
        else {
          removeSingleDieNow(die);
          diceLayer.addDisadvantageText(die, vantageTextDelay);
        }
      }

      otherDie = die;
    }
    else if (die.isDamage)
      totalDamage += topNumber;
    else
      thisRollValue += topNumber;

    if (showDieValues) {
      let screenPos: Vector = getScreenCoordinates(die.getObject());
      diceLayer.addDieValueLabel(screenPos, topNumber, false);
    }

    if (rollIsWildMagic) {
      d20Value += topNumber;
      diceSounds.playRandom('WildMagicFinale/drum', 18);
    }
  }

  if (d20Value > 0) {
    thisRollValue = d20Value;
  }

  if (thisRollValue >= 0) {
    if (rollModifier != 0)
      diceLayer.showRollModifier(rollModifier);

    diceLayer.showDieTotal(`${thisRollValue + rollModifier}`);
  }

  let success: boolean = d20Value + rollModifier >= hiddenThreshold;

  if (success) {
    onSuccess();
  }
  else {
    onFailure();
  }

  let totalDamagePlusModifier: number = totalDamage + damageModifierThisRoll;

  if (totalDamage > 0) {
    diceLayer.showTotalDamage(totalDamagePlusModifier, success);
  }
  else 
    totalDamagePlusModifier = 0;


  var diceData = {
    'playerID': diceLayer.playerID,
    'success': success,
    'roll': thisRollValue,
    'hiddenThreshold': hiddenThreshold,
    'damage': totalDamagePlusModifier,
  };

  diceHaveStoppedRolling(JSON.stringify(diceData));

  if (removeDiceImmediately)
    removeRemainingDice();
}

function onSuccess() {
	
}

function onFailure() {
	
}

