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
  const [objectProperties, setObjectProperties] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });
  const [extrusionHeight, setExtrusionHeight] = useState(2);
  
  // Refs to store current state values for event handlers
  const isSketchModeRef = useRef(false);
  const sketchToolRef = useRef('rectangle');
  const isDrawingRef = useRef(false);
  const currentSketchRef = useRef(null);
  const polygonPointsRef = useRef([]);

  // Keep refs in sync with state
  useEffect(() => {
    isSketchModeRef.current = isSketchMode;
  }, [isSketchMode]);

  useEffect(() => {
    sketchToolRef.current = sketchTool;
  }, [sketchTool]);

  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  useEffect(() => {
    currentSketchRef.current = currentSketch;
  }, [currentSketch]);

  useEffect(() => {
    polygonPointsRef.current = polygonPoints;
  }, [polygonPoints]);

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
          if (isSketchModeRef.current) {
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

            if (!isDrawingRef.current) {
              startSketch(intersectPoint);
            } else if (sketchToolRef.current === 'polygon') {
              startSketch(intersectPoint);
            }
          }
        };

        const handleMouseDown = (event) => {
          if (!isSketchModeRef.current || sketchToolRef.current === 'polygon') return;
          
          console.log('Mouse down in sketch mode, tool:', sketchToolRef.current);
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
            console.log('Starting sketch at point:', intersectPoint);
            startSketch(intersectPoint);
          } else {
            console.log('No intersection point found');
          }
        };

        const handleMouseUp = (event) => {
          if (!isSketchModeRef.current || sketchToolRef.current === 'polygon') return;
          
          console.log('Mouse up in sketch mode, currentSketch:', currentSketchRef.current);
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const intersectPoint = new THREE.Vector3();
          raycaster.ray.intersectPlane(plane, intersectPoint);

          if (intersectPoint && currentSketchRef.current) {
            intersectPoint.x = Math.round(intersectPoint.x);
            intersectPoint.z = Math.round(intersectPoint.z);
            intersectPoint.y = 0;
            finishSketchWithPoint(intersectPoint);
          }
        };

        const handleMouseMove = (event) => {
          if (!isSketchModeRef.current || !isDrawingRef.current) return;

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

        if (mountRef.current) {
          mountRef.current.addEventListener('click', handleMouseClick);
          mountRef.current.addEventListener('mousedown', handleMouseDown);
          mountRef.current.addEventListener('mouseup', handleMouseUp);
          mountRef.current.addEventListener('mousemove', handleMouseMove);
        }

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
          if (!mountRef.current) return;
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
          if (mountRef.current) {
            mountRef.current.removeEventListener('click', handleMouseClick);
            mountRef.current.removeEventListener('mousedown', handleMouseDown);
            mountRef.current.removeEventListener('mouseup', handleMouseUp);
            mountRef.current.removeEventListener('mousemove', handleMouseMove);
            if (renderer.domElement) {
              mountRef.current.removeChild(renderer.domElement);
            }
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
    
    // Update object properties state for dynamic UI updates
    setObjectProperties({
      position: {
        x: object.position.x,
        y: object.position.y,
        z: object.position.z
      },
      rotation: {
        x: object.rotation.x * 180 / Math.PI,
        y: object.rotation.y * 180 / Math.PI,
        z: object.rotation.z * 180 / Math.PI
      },
      scale: {
        x: object.scale.x,
        y: object.scale.y,
        z: object.scale.z
      }
    });
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
    console.log('sketchTool:', sketchToolRef.current);
    
    if (sketchToolRef.current === 'polygon') {
      if (polygonPointsRef.current.length === 0) {
        setPolygonPoints([point.clone()]);
        setIsDrawing(true);
        console.log('Started polygon with first point');
      } else {
        const newPoints = [...polygonPointsRef.current, point.clone()];
        setPolygonPoints(newPoints);
        
        const firstPoint = polygonPointsRef.current[0];
        const distance = point.distanceTo(firstPoint);
        console.log('Distance to first point:', distance);
        if (distance < 1.5 && polygonPointsRef.current.length >= 3) {
          console.log('Closing polygon with', newPoints.length, 'points');
          finishPolygonSketch(newPoints);
        } else {
          console.log('Added point', newPoints.length, 'to polygon');
        }
      }
      return;
    }

    const sketch = {
      type: sketchToolRef.current,
      startPoint: point.clone(),
      currentPoint: point.clone(),
      id: Date.now()
    };
    setCurrentSketch(sketch);
    setIsDrawing(true);
    console.log('Started sketch:', sketchToolRef.current, 'at point:', point);
  };

  const continueSketch = (point) => {
    if (!currentSketchRef.current) return;
    
    if (sketchToolRef.current === 'rectangle') {
      const sketch = { ...currentSketchRef.current, endPoint: point.clone() };
      setCurrentSketch(sketch);
      finishSketch(sketch);
    } else if (sketchToolRef.current === 'circle') {
      const radius = point.distanceTo(currentSketchRef.current.startPoint);
      const sketch = { ...currentSketchRef.current, radius, endPoint: point.clone() };
      setCurrentSketch(sketch);
      finishSketch(sketch);
    }
  };

  const finishSketchWithPoint = (point) => {
    if (!currentSketchRef.current) return;
    
    if (sketchToolRef.current === 'rectangle') {
      const sketch = { ...currentSketchRef.current, endPoint: point.clone() };
      setCurrentSketch(sketch);
      finishSketch(sketch);
    } else if (sketchToolRef.current === 'circle') {
      const radius = point.distanceTo(currentSketchRef.current.startPoint);
      const sketch = { ...currentSketchRef.current, radius, endPoint: point.clone() };
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
    if (sketchToolRef.current === 'polygon') {
      updatePolygonPreview(point);
      return;
    }
    
    if (!currentSketchRef.current) return;
    
    const updatedSketch = { ...currentSketchRef.current, currentPoint: point.clone() };
    setCurrentSketch(updatedSketch);
    
    updateSketchPreviewMesh(updatedSketch);
  };

  const updatePolygonPreview = (point) => {
    // Remove all existing preview objects
    const existingPreviews = sceneRef.current.children.filter(child => child.name === 'sketchPreview');
    existingPreviews.forEach(preview => sceneRef.current.remove(preview));

    if (polygonPointsRef.current.length > 0) {
      const points = [...polygonPointsRef.current, point];
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
      
      // Add point markers
      points.forEach((p, index) => {
        const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
          color: index === points.length - 1 ? 0x00ff00 : (index === 0 ? 0xffff00 : 0xff0000)
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(p.x, 0.02, p.z);
        marker.name = 'sketchPreview';
        sceneRef.current.add(marker);
      });
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

  const createPolygonShape = (points) => {
    console.log('Creating polygon shape from points:', points);
    
    // Validate polygon
    if (points.length < 3) {
      console.error('Polygon must have at least 3 points');
      return null;
    }
    
    // Check for duplicate points
    const uniquePoints = [];
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      if (current.distanceTo(next) > 0.1) { // Minimum distance between points
        uniquePoints.push(current);
      }
    }
    
    if (uniquePoints.length < 3) {
      console.error('Polygon has too many duplicate points');
      return null;
    }
    
    const shape = new THREE.Shape();
    const centerX = uniquePoints.reduce((sum, p) => sum + p.x, 0) / uniquePoints.length;
    const centerZ = uniquePoints.reduce((sum, p) => sum + p.z, 0) / uniquePoints.length;
    
    // Create shape with proper winding order
    shape.moveTo(uniquePoints[0].x - centerX, uniquePoints[0].z - centerZ);
    for (let i = 1; i < uniquePoints.length; i++) {
      shape.lineTo(uniquePoints[i].x - centerX, uniquePoints[i].z - centerZ);
    }
    shape.lineTo(uniquePoints[0].x - centerX, uniquePoints[0].z - centerZ);
    
    console.log('Created polygon shape with', uniquePoints.length, 'unique points');
    return shape;
  };

  const extrudeSketch = (sketch, height = 2) => {
    console.log('Extruding sketch:', sketch.type, 'with height:', height);
    saveToHistory();
    
    let shape;
    
    try {
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
        console.log('Creating polygon shape with', sketch.points.length, 'points');
        shape = createPolygonShape(sketch.points);
        if (!shape) {
          console.error('Failed to create polygon shape');
          return;
        }
      }

      const extrudeSettings = {
        depth: height,
        bevelEnabled: false
      };

      console.log('Creating extrude geometry...');
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
      console.log('Successfully extruded', sketch.type, 'sketch');
      
    } catch (error) {
      console.error('Error extruding sketch:', error);
      alert(`Failed to extrude ${sketch.type} sketch. Please check the shape and try again.`);
    }
  };

  const transformObject = (property, value) => {
    if (!selectedObject) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    switch (property) {
      case 'positionX':
        selectedObject.position.x = numValue;
        setObjectProperties(prev => ({
          ...prev,
          position: { ...prev.position, x: numValue }
        }));
        break;
      case 'positionY':
        selectedObject.position.y = numValue;
        setObjectProperties(prev => ({
          ...prev,
          position: { ...prev.position, y: numValue }
        }));
        break;
      case 'positionZ':
        selectedObject.position.z = numValue;
        setObjectProperties(prev => ({
          ...prev,
          position: { ...prev.position, z: numValue }
        }));
        break;
      case 'rotationX':
        selectedObject.rotation.x = numValue * Math.PI / 180;
        setObjectProperties(prev => ({
          ...prev,
          rotation: { ...prev.rotation, x: numValue }
        }));
        break;
      case 'rotationY':
        selectedObject.rotation.y = numValue * Math.PI / 180;
        setObjectProperties(prev => ({
          ...prev,
          rotation: { ...prev.rotation, y: numValue }
        }));
        break;
      case 'rotationZ':
        selectedObject.rotation.z = numValue * Math.PI / 180;
        setObjectProperties(prev => ({
          ...prev,
          rotation: { ...prev.rotation, z: numValue }
        }));
        break;
      case 'scale':
        selectedObject.scale.set(numValue, numValue, numValue);
        setObjectProperties(prev => ({
          ...prev,
          scale: { x: numValue, y: numValue, z: numValue }
        }));
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
            <div className="extrusion-height-control">
              <label>Extrusion Height: 
                <input 
                  type="range" 
                  min="0.1" 
                  max="20" 
                  step="0.1"
                  value={extrusionHeight}
                  onChange={(e) => setExtrusionHeight(parseFloat(e.target.value))}
                />
                <input 
                  type="number" 
                  step="0.1"
                  value={extrusionHeight.toFixed(2)}
                  onChange={(e) => setExtrusionHeight(parseFloat(e.target.value))}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
            </div>
            <div className="extrusion-info">
              <small>Click "Extrude" to convert sketches to 3D objects</small>
            </div>
            {sketchShapes.map((sketch, index) => (
              <div key={sketch.id} className="sketch-item">
                <div className="sketch-info">
                  <span>Sketch {index + 1} ({sketch.type})</span>
                  <div className="sketch-dimensions">
                    {sketch.type === 'rectangle' && (
                      <div>
                        <small>Width: {Math.abs(sketch.endPoint.x - sketch.startPoint.x).toFixed(2)}</small>
                        <small>Depth: {Math.abs(sketch.endPoint.z - sketch.startPoint.z).toFixed(2)}</small>
                      </div>
                    )}
                    {sketch.type === 'circle' && (
                      <div>
                        <small>Radius: {sketch.radius.toFixed(2)}</small>
                        <small>Diameter: {(sketch.radius * 2).toFixed(2)}</small>
                      </div>
                    )}
                    {sketch.type === 'polygon' && (
                      <div>
                        <small>Points: {sketch.points.length}</small>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => extrudeSketch(sketch, extrusionHeight)}>Extrude</button>
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
                  min="-50" 
                  max="50" 
                  step="0.1"
                  value={objectProperties.position.x}
                  onChange={(e) => transformObject('positionX', e.target.value)}
                />
                <input 
                  type="number" 
                  step="0.1"
                  value={objectProperties.position.x.toFixed(2)}
                  onChange={(e) => transformObject('positionX', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
              <label>Y: 
                <input 
                  type="range" 
                  min="-50" 
                  max="50" 
                  step="0.1"
                  value={objectProperties.position.y}
                  onChange={(e) => transformObject('positionY', e.target.value)}
                />
                <input 
                  type="number" 
                  step="0.1"
                  value={objectProperties.position.y.toFixed(2)}
                  onChange={(e) => transformObject('positionY', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
              <label>Z: 
                <input 
                  type="range" 
                  min="-50" 
                  max="50" 
                  step="0.1"
                  value={objectProperties.position.z}
                  onChange={(e) => transformObject('positionZ', e.target.value)}
                />
                <input 
                  type="number" 
                  step="0.1"
                  value={objectProperties.position.z.toFixed(2)}
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
                  min="-360" 
                  max="360" 
                  step="1"
                  value={objectProperties.rotation.x}
                  onChange={(e) => transformObject('rotationX', e.target.value)}
                />
                <input 
                  type="number" 
                  step="1"
                  value={objectProperties.rotation.x.toFixed(2)}
                  onChange={(e) => transformObject('rotationX', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
              <label>Y: 
                <input 
                  type="range" 
                  min="-360" 
                  max="360" 
                  step="1"
                  value={objectProperties.rotation.y}
                  onChange={(e) => transformObject('rotationY', e.target.value)}
                />
                <input 
                  type="number" 
                  step="1"
                  value={objectProperties.rotation.y.toFixed(2)}
                  onChange={(e) => transformObject('rotationY', e.target.value)}
                  style={{width: '60px', marginLeft: '5px'}}
                />
              </label>
              <label>Z: 
                <input 
                  type="range" 
                  min="-360" 
                  max="360" 
                  step="1"
                  value={objectProperties.rotation.z}
                  onChange={(e) => transformObject('rotationZ', e.target.value)}
                />
                <input 
                  type="number" 
                  step="1"
                  value={objectProperties.rotation.z.toFixed(2)}
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
                  min="0.01" 
                  max="20" 
                  step="0.01"
                  value={objectProperties.scale.x}
                  onChange={(e) => transformObject('scale', e.target.value)}
                />
                <input 
                  type="number" 
                  step="0.01"
                  value={objectProperties.scale.x.toFixed(2)}
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
                  <div>Width: {(objectProperties.scale.x * 2).toFixed(2)}</div>
                  <div>Height: {(objectProperties.scale.y * 2).toFixed(2)}</div>
                  <div>Depth: {(objectProperties.scale.z * 2).toFixed(2)}</div>
                </div>
              )}
              {selectedObject.userData.type === 'sphere' && (
                <div>
                  <div>Radius: {objectProperties.scale.x.toFixed(2)}</div>
                  <div>Diameter: {(objectProperties.scale.x * 2).toFixed(2)}</div>
                </div>
              )}
              {selectedObject.userData.type === 'cylinder' && (
                <div>
                  <div>Radius: {objectProperties.scale.x.toFixed(2)}</div>
                  <div>Height: {(objectProperties.scale.y * 2).toFixed(2)}</div>
                </div>
              )}
              {selectedObject.userData.type === 'extruded' && (
                <div>
                  <div>Extruded Shape</div>
                  <div>Height: {(objectProperties.scale.y * 2).toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div 
        className={`scene-viewport ${isSketchMode ? 'sketch-mode' : ''}`}
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