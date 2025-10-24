import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const ThreeScene = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const raycasterRef = useRef(null);
  const mouseRef = useRef(null);
  
  const [selectedObject, setSelectedObject] = useState(null);
  const [objects, setObjects] = useState([]);
  const [isSketchMode, setIsSketchMode] = useState(false);
  const [sketchShapes, setSketchShapes] = useState([]);
  const [currentSketch, setCurrentSketch] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [sketchTool, setSketchTool] = useState('rectangle');
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!mountRef.current) return;

    const initScene = async () => {
      try {
        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
          75,
          mountRef.current.clientWidth / mountRef.current.clientHeight,
          0.1,
          1000
        );
        camera.position.set(15, 15, 15);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        const width = mountRef.current.clientWidth || 800;
        const height = mountRef.current.clientHeight || 600;
        
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Clear any existing canvas
        while (mountRef.current.firstChild) {
          mountRef.current.removeChild(mountRef.current.firstChild);
        }
        
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls setup
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controlsRef.current = controls;

        // Helpers
        const gridHelper = new THREE.GridHelper(20, 20);
        scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Raycaster setup
        const raycaster = new THREE.Raycaster();
        raycasterRef.current = raycaster;

        const mouse = new THREE.Vector2();
        mouseRef.current = mouse;

        // Event listeners
        const handleMouseClick = (event) => {
          if (isSketchMode) {
            handleSketchClick(event);
            return;
          }

          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);

          if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData.isSelectable) {
              selectObject(object);
            }
          } else {
            setSelectedObject(null);
          }
        };

        const handleSketchClick = (event) => {
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const intersectPoint = new THREE.Vector3();
          raycaster.ray.intersectPlane(plane, intersectPoint);

          if (intersectPoint) {
            intersectPoint.x = Math.round(intersectPoint.x);
            intersectPoint.z = Math.round(intersectPoint.z);
            intersectPoint.y = 0;

            if (!isDrawing) {
              startSketch(intersectPoint);
            } else {
              continueSketch(intersectPoint);
            }
          }
        };

        const handleMouseMove = (event) => {
          if (!isSketchMode || !isDrawing) return;

          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const intersectPoint = new THREE.Vector3();
          raycaster.ray.intersectPlane(plane, intersectPoint);

          if (intersectPoint) {
            intersectPoint.x = Math.round(intersectPoint.x);
            intersectPoint.z = Math.round(intersectPoint.z);
            intersectPoint.y = 0;
            updateSketchPreview(intersectPoint);
          }
        };

        mountRef.current.addEventListener('click', handleMouseClick);
        mountRef.current.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          mountRef.current?.removeEventListener('click', handleMouseClick);
          mountRef.current?.removeEventListener('mousemove', handleMouseMove);
          if (mountRef.current && renderer.domElement) {
            mountRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };

      } catch (error) {
        console.error('Error initializing Three.js scene:', error);
      }
    };

    initScene();
  }, []); // Empty dependency array to run only once

  // Handle sketch mode changes
  useEffect(() => {
    if (isSketchMode) {
      console.log('Entered sketch mode');
      // Disable orbit controls when in sketch mode
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    } else {
      console.log('Exited sketch mode');
      // Re-enable orbit controls when exiting sketch mode
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
      setCurrentSketch(null);
      setIsDrawing(false);
      setPolygonPoints([]);
      
      if (sceneRef.current) {
        const preview = sceneRef.current.getObjectByName('sketchPreview');
        if (preview) {
          sceneRef.current.remove(preview);
        }
      }
    }
  }, [isSketchMode]);

  const selectObject = (object) => {
    if (selectedObject) {
      selectedObject.material.emissive.setHex(0x000000);
    }
    object.material.emissive.setHex(0x444444);
    setSelectedObject(object);
  };

  const saveToHistory = () => {
    const currentState = {
      objects: objects.map(obj => ({
        type: obj.userData.type,
        position: obj.position.toArray(),
        rotation: obj.rotation.toArray(),
        scale: obj.scale.toArray(),
        id: obj.userData.id
      })),
      sketches: [...sketchShapes]
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      restoreState(prevState);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      restoreState(nextState);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const restoreState = (state) => {
    objects.forEach(obj => sceneRef.current.remove(obj));
    setObjects([]);
    setSketchShapes([]);

    state.objects.forEach(objData => {
      createShapeFromData(objData);
    });

    setSketchShapes(state.sketches || []);
  };

  const createShapeFromData = (objData) => {
    let geometry, material, mesh;
    
    switch (objData.type) {
      case 'box':
        geometry = new THREE.BoxGeometry(2, 2, 2);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        break;
      case 'extruded':
        return;
      default:
        return;
    }

    material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.fromArray(objData.position);
    mesh.rotation.fromArray(objData.rotation);
    mesh.scale.fromArray(objData.scale);
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isSelectable = true;
    mesh.userData.type = objData.type;
    mesh.userData.id = objData.id;

    sceneRef.current.add(mesh);
    setObjects(prev => [...prev, mesh]);
  };

  const createShape = (type) => {
    if (!sceneRef.current) {
      console.warn('Scene not initialized yet');
      return;
    }
    
    saveToHistory();
    
    let geometry, material, mesh;
    
    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(2, 2, 2);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        break;
      default:
        return;
    }

    material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    mesh = new THREE.Mesh(geometry, material);
    
    // Random position within 10x10x10 range
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isSelectable = true;
    mesh.userData.type = type;
    mesh.userData.id = Date.now() + Math.random();

    sceneRef.current.add(mesh);
    setObjects(prev => [...prev, mesh]);
  };

  const startSketch = (point) => {
    console.log('startSketch called with point:', point);
    console.log('sketchTool:', sketchTool);
    
    if (sketchTool === 'polygon') {
      if (polygonPoints.length === 0) {
        setPolygonPoints([point.clone()]);
        setIsDrawing(true);
        console.log('Started polygon with first point');
      } else {
        const newPoints = [...polygonPoints, point.clone()];
        setPolygonPoints(newPoints);
        
        const firstPoint = polygonPoints[0];
        const distance = point.distanceTo(firstPoint);
        console.log('Distance to first point:', distance);
        if (distance < 1 && polygonPoints.length >= 3) {
          finishPolygonSketch(newPoints);
        }
      }
      return;
    }

    const sketch = {
      type: sketchTool,
      startPoint: point.clone(),
      currentPoint: point.clone(),
      id: Date.now()
    };
    setCurrentSketch(sketch);
    setIsDrawing(true);
    console.log('Started sketch:', sketchTool, 'at point:', point);
  };

  const continueSketch = (point) => {
    if (!currentSketch) return;
    
    if (sketchTool === 'rectangle') {
      const sketch = { ...currentSketch, endPoint: point.clone() };
      setCurrentSketch(sketch);
      finishSketch(sketch);
    } else if (sketchTool === 'circle') {
      const radius = point.distanceTo(currentSketch.startPoint);
      const sketch = { ...currentSketch, radius, endPoint: point.clone() };
      setCurrentSketch(sketch);
      finishSketch(sketch);
    }
  };

  const finishPolygonSketch = (points) => {
    saveToHistory();
    
    const sketch = {
      type: 'polygon',
      points: points.map(p => p.clone()),
      id: Date.now()
    };
    
    setSketchShapes(prev => [...prev, sketch]);
    setPolygonPoints([]);
    setIsDrawing(false);
    
    const preview = sceneRef.current.getObjectByName('sketchPreview');
    if (preview) {
      sceneRef.current.remove(preview);
    }
  };

  const updateSketchPreview = (point) => {
    if (sketchTool === 'polygon') {
      updatePolygonPreview(point);
      return;
    }
    
    if (!currentSketch) return;
    
    const updatedSketch = { ...currentSketch, currentPoint: point.clone() };
    setCurrentSketch(updatedSketch);
    
    updateSketchPreviewMesh(updatedSketch);
  };

  const updatePolygonPreview = (point) => {
    const existingPreview = sceneRef.current.getObjectByName('sketchPreview');
    if (existingPreview) {
      sceneRef.current.remove(existingPreview);
    }

    if (polygonPoints.length > 0) {
      const points = [...polygonPoints, point];
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p.x, 0.01, p.z))
      );
      
      const material = new THREE.LineBasicMaterial({ 
        color: 0xff0000, 
        linewidth: 3 
      });
      const preview = new THREE.Line(geometry, material);
      preview.name = 'sketchPreview';
      sceneRef.current.add(preview);
      console.log('Added polygon preview with', points.length, 'points');
    }
  };

  const updateSketchPreviewMesh = (sketch) => {
    const existingPreview = sceneRef.current.getObjectByName('sketchPreview');
    if (existingPreview) {
      sceneRef.current.remove(existingPreview);
    }

    if (sketch.type === 'rectangle') {
      const width = Math.abs(sketch.currentPoint.x - sketch.startPoint.x);
      const height = Math.abs(sketch.currentPoint.z - sketch.startPoint.z);
      const centerX = (sketch.startPoint.x + sketch.currentPoint.x) / 2;
      const centerZ = (sketch.startPoint.z + sketch.currentPoint.z) / 2;

      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const preview = new THREE.Mesh(geometry, material);
      preview.position.set(centerX, 0.01, centerZ);
      preview.name = 'sketchPreview';
      sceneRef.current.add(preview);
      console.log('Added rectangle preview:', width, 'x', height);
    } else if (sketch.type === 'circle') {
      const radius = sketch.currentPoint.distanceTo(sketch.startPoint);
      const geometry = new THREE.CircleGeometry(radius, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const preview = new THREE.Mesh(geometry, material);
      preview.position.set(sketch.startPoint.x, 0.01, sketch.startPoint.z);
      preview.name = 'sketchPreview';
      sceneRef.current.add(preview);
      console.log('Added circle preview with radius:', radius);
    }
  };

  const finishSketch = (sketch) => {
    saveToHistory();
    setSketchShapes(prev => [...prev, sketch]);
    setCurrentSketch(null);
    setIsDrawing(false);
    
    const preview = sceneRef.current.getObjectByName('sketchPreview');
    if (preview) {
      sceneRef.current.remove(preview);
    }
  };

  const extrudeSketch = (sketch, height = 2) => {
    saveToHistory();
    
    let shape;
    
    if (sketch.type === 'rectangle') {
      const width = Math.abs(sketch.endPoint.x - sketch.startPoint.x);
      const depth = Math.abs(sketch.endPoint.z - sketch.startPoint.z);
      const centerX = (sketch.startPoint.x + sketch.endPoint.x) / 2;
      const centerZ = (sketch.startPoint.z + sketch.endPoint.z) / 2;

      shape = new THREE.Shape();
      shape.moveTo(-width/2, -depth/2);
      shape.lineTo(width/2, -depth/2);
      shape.lineTo(width/2, depth/2);
      shape.lineTo(-width/2, depth/2);
      shape.lineTo(-width/2, -depth/2);
    } else if (sketch.type === 'circle') {
      const radius = sketch.radius;
      shape = new THREE.Shape();
      shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    } else if (sketch.type === 'polygon') {
      shape = new THREE.Shape();
      const points = sketch.points;
      
      const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const centerZ = points.reduce((sum, p) => sum + p.z, 0) / points.length;
      
      shape.moveTo(points[0].x - centerX, points[0].z - centerZ);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x - centerX, points[i].z - centerZ);
      }
      shape.lineTo(points[0].x - centerX, points[0].z - centerZ);
    }

    const extrudeSettings = {
      depth: height,
      bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    const mesh = new THREE.Mesh(geometry, material);
    
    if (sketch.type === 'rectangle') {
      const centerX = (sketch.startPoint.x + sketch.endPoint.x) / 2;
      const centerZ = (sketch.startPoint.z + sketch.endPoint.z) / 2;
      mesh.position.set(centerX, height/2, centerZ);
    } else if (sketch.type === 'circle') {
      mesh.position.set(sketch.startPoint.x, height/2, sketch.startPoint.z);
    } else if (sketch.type === 'polygon') {
      const centerX = sketch.points.reduce((sum, p) => sum + p.x, 0) / sketch.points.length;
      const centerZ = sketch.points.reduce((sum, p) => sum + p.z, 0) / sketch.points.length;
      mesh.position.set(centerX, height/2, centerZ);
    }
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isSelectable = true;
    mesh.userData.type = 'extruded';
    mesh.userData.id = Date.now() + Math.random();

    sceneRef.current.add(mesh);
    setObjects(prev => [...prev, mesh]);
  };

  const transformObject = (property, value) => {
    if (!selectedObject) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    switch (property) {
      case 'positionX':
        selectedObject.position.x = numValue;
        break;
      case 'positionY':
        selectedObject.position.y = numValue;
        break;
      case 'positionZ':
        selectedObject.position.z = numValue;
        break;
      case 'rotationX':
        selectedObject.rotation.x = numValue * Math.PI / 180;
        break;
      case 'rotationY':
        selectedObject.rotation.y = numValue * Math.PI / 180;
        break;
      case 'rotationZ':
        selectedObject.rotation.z = numValue * Math.PI / 180;
        break;
      case 'scale':
        selectedObject.scale.set(numValue, numValue, numValue);
        break;
    }
    
    // Force update the object
    selectedObject.updateMatrixWorld(true);
    console.log('Transformed object:', property, '=', numValue);
  };

  const exportScene = () => {
    const sceneData = {
      objects: objects.map(obj => ({
        type: obj.userData.type,
        position: obj.position.toArray(),
        rotation: obj.rotation.toArray(),
        scale: obj.scale.toArray(),
        id: obj.userData.id
      })),
      sketches: sketchShapes
    };
    
    const dataStr = JSON.stringify(sceneData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scene.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importScene = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const sceneData = JSON.parse(e.target.result);
        
        objects.forEach(obj => sceneRef.current.remove(obj));
        setObjects([]);
        setSketchShapes([]);

        sceneData.objects.forEach(objData => {
          createShapeFromData(objData);
        });

        setSketchShapes(sceneData.sketches || []);
      } catch (error) {
        console.error('Error importing scene:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="three-scene-container">
      <div className="controls-panel">
        <h3>3D Editor</h3>
        
        <div className="shape-controls">
          <h4>Create Shapes</h4>
          <button onClick={() => createShape('box')}>Box</button>
          <button onClick={() => createShape('sphere')}>Sphere</button>
          <button onClick={() => createShape('cylinder')}>Cylinder</button>
        </div>

        <div className="sketch-controls">
          <h4>Sketch Mode</h4>
          <button 
            onClick={() => setIsSketchMode(!isSketchMode)}
            className={isSketchMode ? 'active' : ''}
          >
            {isSketchMode ? 'Exit Sketch' : 'Enter Sketch'}
          </button>
          
          {isSketchMode && (
            <div className="sketch-tools">
              <h5>Sketch Tools</h5>
              <button 
                onClick={() => setSketchTool('rectangle')}
                className={sketchTool === 'rectangle' ? 'active' : ''}
              >
                Rectangle
              </button>
              <button 
                onClick={() => setSketchTool('circle')}
                className={sketchTool === 'circle' ? 'active' : ''}
              >
                Circle
              </button>
              <button 
                onClick={() => setSketchTool('polygon')}
                className={sketchTool === 'polygon' ? 'active' : ''}
              >
                Polygon
              </button>
              
              <div className="sketch-instructions">
                {sketchTool === 'rectangle' && (
                  <div className="instruction-box">
                    <strong>How to draw Rectangle:</strong>
                    <ol>
                      <li>Click on the grid to set first corner</li>
                      <li>Drag to second corner</li>
                      <li>Release to finish</li>
                    </ol>
                  </div>
                )}
                {sketchTool === 'circle' && (
                  <div className="instruction-box">
                    <strong>How to draw Circle:</strong>
                    <ol>
                      <li>Click on the grid to set center</li>
                      <li>Drag to set radius</li>
                      <li>Release to finish</li>
                    </ol>
                  </div>
                )}
                {sketchTool === 'polygon' && (
                  <div className="instruction-box">
                    <strong>How to draw Polygon:</strong>
                    <ol>
                      <li>Click multiple points on the grid</li>
                      <li>Click near the first point to close</li>
                      <li>Need at least 3 points</li>
                    </ol>
                    {polygonPoints.length > 0 && (
                      <div className="point-counter">Points: {polygonPoints.length}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {sketchShapes.length > 0 && (
          <div className="extrusion-controls">
            <h4>Extrude Sketches ({sketchShapes.length})</h4>
            <div className="extrusion-info">
              <small>Click "Extrude" to convert sketches to 3D objects</small>
            </div>
            {sketchShapes.map((sketch, index) => (
              <div key={sketch.id} className="sketch-item">
                <span>Sketch {index + 1} ({sketch.type})</span>
                <button onClick={() => extrudeSketch(sketch)}>Extrude</button>
              </div>
            ))}
          </div>
        )}

        {selectedObject && (
          <div className="object-properties">
            <h4>Object Properties</h4>
            
            <div className="property-group">
              <h5>Position</h5>
              <label>X: 
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  step="0.5"
                  value={selectedObject.position.x}
                  onChange={(e) => transformObject('positionX', e.target.value)}
                />
                <input 
                  type="number" 
                  step="0.5"
                  value={selectedObject.position.x.toFixed(2)}
                  onChange={(e) => transformObject('positionX', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
              <label>Y: 
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  step="0.5"
                  value={selectedObject.position.y}
                  onChange={(e) => transformObject('positionY', e.target.value)}
                />
                <input 
                  type="number" 
                  step="0.5"
                  value={selectedObject.position.y.toFixed(2)}
                  onChange={(e) => transformObject('positionY', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
              <label>Z: 
                <input 
                  type="range" 
                  min="-20" 
                  max="20" 
                  step="0.5"
                  value={selectedObject.position.z}
                  onChange={(e) => transformObject('positionZ', e.target.value)}
                />
                <input 
                  type="number" 
                  step="0.5"
                  value={selectedObject.position.z.toFixed(2)}
                  onChange={(e) => transformObject('positionZ', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
            </div>
            
            <div className="property-group">
              <h5>Rotation (degrees)</h5>
              <label>X: 
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  step="5"
                  value={selectedObject.rotation.x * 180 / Math.PI}
                  onChange={(e) => transformObject('rotationX', e.target.value)}
                />
                <input 
                  type="number" 
                  step="5"
                  value={(selectedObject.rotation.x * 180 / Math.PI).toFixed(2)}
                  onChange={(e) => transformObject('rotationX', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
              <label>Y: 
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  step="5"
                  value={selectedObject.rotation.y * 180 / Math.PI}
                  onChange={(e) => transformObject('rotationY', e.target.value)}
                />
                <input 
                  type="number" 
                  step="5"
                  value={(selectedObject.rotation.y * 180 / Math.PI).toFixed(2)}
                  onChange={(e) => transformObject('rotationY', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
              <label>Z: 
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  step="5"
                  value={selectedObject.rotation.z * 180 / Math.PI}
                  onChange={(e) => transformObject('rotationZ', e.target.value)}
                />
                <input 
                  type="number" 
                  step="5"
                  value={(selectedObject.rotation.z * 180 / Math.PI).toFixed(2)}
                  onChange={(e) => transformObject('rotationZ', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
            </div>
            
            <div className="property-group">
              <h5>Scale</h5>
              <label>Scale: 
                <input 
                  type="range" 
                  min="0.1" 
                  max="5" 
                  step="0.1"
                  value={selectedObject.scale.x}
                  onChange={(e) => transformObject('scale', e.target.value)}
                />
                <input 
                  type="number" 
                  step="0.1"
                  value={selectedObject.scale.x.toFixed(2)}
                  onChange={(e) => transformObject('scale', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
            </div>
          </div>
        )}

        <div className="history-controls">
          <h4>History</h4>
          <button 
            onClick={undo} 
            disabled={historyIndex <= 0}
            className="undo-button"
          >
            Undo
          </button>
          <button 
            onClick={redo} 
            disabled={historyIndex >= history.length - 1}
            className="redo-button"
          >
            Redo
          </button>
        </div>

        <div className="scene-controls">
          <h4>Scene</h4>
          <button onClick={exportScene}>Export Scene</button>
          <input 
            type="file" 
            accept=".json" 
            onChange={importScene}
            style={{ display: 'none' }}
            id="import-file"
          />
          <label htmlFor="import-file" className="import-button">Import Scene</label>
        </div>

        {selectedObject && (
          <div className="dimensions-display">
            <h4>Dimensions</h4>
            <div className="dimension-info">
              {selectedObject.userData.type === 'box' && (
                <div>
                  <div>Width: {(selectedObject.scale.x * 2).toFixed(2)}</div>
                  <div>Height: {(selectedObject.scale.y * 2).toFixed(2)}</div>
                  <div>Depth: {(selectedObject.scale.z * 2).toFixed(2)}</div>
                </div>
              )}
              {selectedObject.userData.type === 'sphere' && (
                <div>
                  <div>Radius: {selectedObject.scale.x.toFixed(2)}</div>
                  <div>Diameter: {(selectedObject.scale.x * 2).toFixed(2)}</div>
                </div>
              )}
              {selectedObject.userData.type === 'cylinder' && (
                <div>
                  <div>Radius: {selectedObject.scale.x.toFixed(2)}</div>
                  <div>Height: {(selectedObject.scale.y * 2).toFixed(2)}</div>
                </div>
              )}
              {selectedObject.userData.type === 'extruded' && (
                <div>
                  <div>Extruded Shape</div>
                  <div>Height: {(selectedObject.scale.y * 2).toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div 
        className="scene-viewport" 
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
          position: 'relative'
        }}
      />
      {isSketchMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(231, 76, 60, 0.9)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          fontWeight: 'bold',
          fontSize: '14px',
          zIndex: 1000
        }}>
          ✏️ SKETCH MODE ACTIVE
        </div>
      )}
    </div>
  );
};

export default ThreeScene;