'use strict';

// Set some default values
THREE.XHRLoader.prototype.crossOrigin = 'anonymous';
THREE.ImageUtils.crossOrigin = 'anonymous';


// Set up the renderer
var renderer = null;
renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setClearColor( 0x888888, 1 );


// Create a global scene to work with
var scene = new THREE.Scene();


// Set up some basic initial lighting
var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.1 );
directionalLight.position.set( 100, 100, 100 );
scene.add( directionalLight );

var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
hemiLight.color.setHSL( 0.6, 1, 0.75 );
hemiLight.groundColor.setHSL( 0.1, 0.8, 0.7 );
hemiLight.position.z = 500;
scene.add( hemiLight );


// Set a global camera to work with
var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.up.copy(new THREE.Vector3(0, 0, 1));
camera.position.copy(new THREE.Vector3(-15, 15, 15));
camera.lookAt(new THREE.Vector3(0, 0, 0));

camera.position.add(new THREE.Vector3(5200, 5200, 0));

// Default material for testing with
var defaultMat = new THREE.MeshPhongMaterial({ambient: 0x030303, color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.FlatShading});


// Create a debug GUI manager.
var debugGui = new dat.GUI();


var activeGameState = null;

var clock = new THREE.Clock();
var renderFrame = function () {
  requestAnimationFrame(renderFrame, renderer.domElement);

  var delta = clock.getDelta();
  //THREE.AnimationHandler.update( delta );

  if (activeGameState) {
    activeGameState.update(delta);
  }

  renderer.render(scene, camera);
};
renderFrame();

var launchStateName = 'test';
if (window.location.hash.length > 1) {
  launchStateName = window.location.hash.substr(1);
}

console.log('Launching game with state `' + launchStateName + '`');
var launchGameState = null;
if (launchStateName === 'test') {
  launchGameState = new TestState();
} else if (launchStateName === 'login') {
  launchGameState = new LoginState();
} else {
  console.log('Invalid launch state specified.');
}


if (launchGameState) {
  // Needed for game states that alter UI.
  $(function() {
    launchGameState.prepare(function() {
      launchGameState.enter();
      activeGameState = launchGameState;
    });
  });
}






/*
var loginClient = new LoginClient();
loginClient.connect('128.241.92.36', 29000, function(err) {
  console.log('login connected');

  loginClient.login('*******', '********', function(data) {
    console.log('login result', data);

    for (var i = 0; i < data.servers.length; ++i) {
      loginClient.channelList(data.servers[i].id, function(data) {
        console.log('got channel reply', data);

      });
    }
  });
});
//*/

/*
var charIdx = 2;
if (window.location.hash.length > 1) {
  charIdx = window.location.hash.substr(1);
}

function GroupLoader() {
  this.sources = [];
}
GroupLoader.prototype.add = function(name, loader, path) {
  this.sources.push([name, loader, path]);
};
GroupLoader.prototype.load = function(callback) {
  var self = this;
  var loadedObjs = {};
  var loadedCount = 0;
  function maybeDone() {
    if (loadedCount === self.sources.length) {
      callback(loadedObjs);
    }
  }
  for (var i = 0; i < self.sources.length; ++i) {
    (function(source) {
      var name = source[0];
      var loader = source[1];
      var path = source[2];
      loader.load(path, function(res) {
        loadedObjs[name] = res;
        loadedCount++;
        maybeDone();
      });
    })(self.sources[i]);
  }
};

var avatarGrp = new GroupLoader();
avatarGrp.add('male_skel', ZMDLoader, '3DDATA/AVATAR/MALE.ZMD');
avatarGrp.add('female_skel', ZMDLoader, '3DDATA/AVATAR/FEMALE.ZMD');
avatarGrp.add('male_face', ZSCLoader, '3DDATA/AVATAR/LIST_MFACE.ZSC');
avatarGrp.add('male_hair', ZSCLoader, '3DDATA/AVATAR/LIST_MHAIR.ZSC');
avatarGrp.add('male_body', ZSCLoader, '3DDATA/AVATAR/LIST_MBODY.ZSC');
avatarGrp.add('male_foot', ZSCLoader, '3DDATA/AVATAR/LIST_MFOOT.ZSC');
avatarGrp.add('male_arms', ZSCLoader, '3DDATA/AVATAR/LIST_MARMS.ZSC');
avatarGrp.load(function(loadedObjs) {
  var mskel = loadedObjs['male_skel'];
  var fskel = loadedObjs['female_skel'];
  var mface = loadedObjs['male_face'];
  var mhair = loadedObjs['male_hair'];
  var mbody = loadedObjs['male_body'];
  var mfoot = loadedObjs['male_foot'];
  var marms = loadedObjs['male_arms'];

  var charObj = new THREE.Object3D();
  charObj.position.set(5200, 5200, 40);
  charObj.rotation.z += Math.PI;
  charObj.scale.set(1.2,1.2,1.2);
  scene.add(charObj);
  moveObj = charObj;

  var charSkel = mskel.create(charObj);
  function addPart(zscData, modelIdx, bindBone) {
    var model = zscData.objects[modelIdx];

    for (var j = 0; j < model.parts.length; ++j) {
      (function(part) {
        var material = makeZscMaterial(zscData.materials[part.materialIdx]);

        var meshPath = zscData.meshes[part.meshIdx];
        ZMSLoader.load(meshPath, function (geometry) {
          if (bindBone === undefined) {
            var charPartMesh = new THREE.SkinnedMesh(geometry, material);
            charPartMesh.bind(charSkel);
            charObj.add(charPartMesh);
          } else {
            var charPartMesh = new THREE.Mesh(geometry, material);
            charSkel.bones[bindBone].add(charPartMesh);
          }
        });
      })(model.parts[j]);
    }
  }
  addPart(mhair, 1, 4);
  addPart(mface, 2, 4);
  addPart(mbody, 1);
  addPart(mfoot, 1);
  addPart(marms, 1);

  var animPath = '3DDATA/MOTION/AVATAR/EMPTY_RUN_M1.ZMO';
  ZMOLoader.load(animPath, function(zmoData) {
    var anim = zmoData.createForSkeleton('test', charObj, charSkel);
    anim.play();
  });

  //charObj.add(camera);
});

/*
var coreGrp = new GroupLoader();
coreGrp.add('list_npc_chr', CharacterList, '3DDATA/NPC/LIST_NPC.CHR');
coreGrp.add('part_npc_zsc', ZSCLoader, '3DDATA/NPC/PART_NPC.ZSC');
coreGrp.load(function(loadedObjs) {
  var chrData = loadedObjs['list_npc_chr'];
  var zscData = loadedObjs['part_npc_zsc'];

  var char = chrData.characters[charIdx];
  if (char == null) {
    return;d 
  }

  var charObj = new THREE.Object3D();
  charObj.position.set(5200, 5200, 40);
  charObj.scale.set(10, 10, 10);
  scene.add(charObj);
  moveObj = charObj;

  var skelPath = chrData.skeletons[char.skeletonIdx];
  ZMDLoader.load(skelPath, function(zmdData) {
    var charSkel = zmdData.create(charObj);

    var charModels = char.models;
    for (var i = 0; i < charModels.length; ++i) {
      var model = zscData.objects[charModels[i]];

      for (var j = 0; j < model.parts.length; ++j) {
        (function(part) {
          var material = makeZscMaterial(zscData.materials[part.materialIdx]);

          var meshPath = zscData.meshes[part.meshIdx];
          ZMSLoader.load(meshPath, function (geometry) {
            var charPartMesh = new THREE.SkinnedMesh(geometry, material);
            charPartMesh.bind(charSkel);
            charObj.add(charPartMesh);
          });
        })(model.parts[j]);
      }
    }

    var animPath = chrData.animations[char.animations[0]];
    ZMOLoader.load(animPath, function(zmoData) {
      var anim = zmoData.createForSkeleton('test', charObj, charSkel);
      anim.play();
    });
  });

  setTimeout(function() {
 var ray = new THREE.Raycaster(new THREE.Vector3(5200, 5200, 200), new THREE.Vector3(0, 0, -1));
 var octreeObjects = worldTree.search( ray.ray.origin, ray.ray.far, true, ray.ray.direction );
 var inters = ray.intersectOctreeObjects( octreeObjects );
 if (inters.length > 0) {
 var p = inters[0].point;
 charObj.position.set(p.x, p.y, p.z);
 }
  }, 2000);

});
//*/

/*
var moveTowards = new THREE.Vector2(5200, 5200);
if (renderer) {
  renderer.domElement.addEventListener('mousemove', function (e) {
    e.preventDefault();

    var mouse = new THREE.Vector3(0, 0, 0.5);
    mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( e.clientY / window.innerHeight ) * 2 + 1;
    projector.unprojectVector(mouse, camera);

    var cameraPos = camera.localToWorld(new THREE.Vector3(0, 0, 0));
    var ray = new THREE.Raycaster(cameraPos, mouse.sub(cameraPos).normalize());
    var octreeObjects = worldTree.search(ray.ray.origin, ray.ray.far, true, ray.ray.direction);
    var inters = ray.intersectOctreeObjects(octreeObjects);

    if (inters.length > 0) {
      var p = inters[0].point;
      moveTowards.set(p.x, p.y);
      //moveObj.position.set(p.x, p.y, p.z);
    }
  }, false);
}
//*/

/*
var rootObj = new THREE.Object3D();
scene.add(rootObj);

ZMSLoader.load('3DDATA/NPC/PLANT/JELLYBEAN1/BODY02.ZMS', function (geometry) {
  ZMSLoader.load('3DDATA/NPC/PLANT/JELLYBEAN1/BODY01.ZMS', function (geometry2) {
    ZMDLoader.load('3DDATA/NPC/PLANT/JELLYBEAN1/JELLYBEAN2_BONE.ZMD', function(zmdData) {
      ZMOLoader.load('3DDATA/MOTION/NPC/JELLYBEAN1/JELLYBEAN1_WALK.ZMO', function(zmoData) {
        var skel = zmdData.create(rootObj);

        cube = new THREE.SkinnedMesh(geometry, material1);
        cube.bind(skel);

        var cube2 = new THREE.SkinnedMesh(geometry2, material1);
        cube2.bind(skel);

        var anim = zmoData.createForSkeleton('test', rootObj, skel);
        anim.play();

        rootObj.add(cube);
        rootObj.add(cube2);


      });
    });
  });
});
//*/
