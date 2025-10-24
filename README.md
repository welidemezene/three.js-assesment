# Three.js + React 3D Editor

A comprehensive 3D editor built with React and Three.js, featuring basic 3D object manipulation and 2D sketching with extrusion capabilities.

## Features Completed

### Core Requirements ✅
- **Basic Three.js Scene**: PerspectiveCamera, OrbitControls, GridHelper, and AxesHelper
- **3D Shape Creation**: Box, Sphere, and Cylinder shapes with random positioning
- **Object Selection**: Raycasting-based selection with visual highlighting
- **Transform Controls**: Move, rotate, and scale selected objects via input controls
- **Properties Panel**: Real-time display of object position, rotation, and scale
- **Scene Persistence**: JSON export/import functionality for saving and loading scenes

### 2D Sketching & Extrusion ✅
- **Sketch Mode**: Toggle between normal 3D editing and 2D sketching
- **Drawing Tools**: Rectangle, Circle, and Polygon sketching tools
- **Grid Snapping**: All sketches snap to the grid for precision
- **Live Preview**: Real-time preview of shapes while drawing
- **Extrusion**: Convert 2D sketches to 3D meshes using Three.js ExtrudeGeometry
- **Extrusion Height**: Configurable height for extruded objects

### Bonus Features ✅
- **Polygon Sketching**: Click-to-place polygon creation with automatic closing
- **Undo/Redo**: Full history management for all operations
- **Dimension Display**: Real-time display of object dimensions (width, height, depth, radius, diameter)
- **Multiple Sketch Tools**: Rectangle, Circle, and Polygon tools with visual feedback
- **Enhanced UI**: Professional dark theme with organized control panels

## How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**: Navigate to `http://localhost:5173`

## Usage Instructions

### Creating 3D Objects
1. Click "Box", "Sphere", or "Cylinder" buttons to create shapes
2. Objects appear at random positions within a 10x10x10 range
3. Click on objects to select them (they will be highlighted)

### Transforming Objects
1. Select an object by clicking on it
2. Use the Properties panel to adjust:
   - Position (X, Y, Z coordinates)
   - Rotation (X, Y, Z in degrees)
   - Scale (uniform scaling)

### Sketching Mode
1. Click "Enter Sketch" to activate sketching mode
2. Choose a sketching tool:
   - **Rectangle**: Click and drag to create rectangles
   - **Circle**: Click center, drag to set radius
   - **Polygon**: Click points to create polygons, click near first point to close
3. All sketches snap to the grid for precision

### Extrusion
1. Create sketches in Sketch Mode
2. Use "Extrude" button next to each sketch to convert to 3D
3. Extruded objects behave like other 3D shapes (selectable, transformable)

### Scene Management
- **Export**: Save current scene to JSON file
- **Import**: Load previously saved scene from JSON file
- **Undo/Redo**: Navigate through operation history

### Dimension Display
- Select any object to see its dimensions
- Box: Width, Height, Depth
- Sphere: Radius, Diameter
- Cylinder: Radius, Height
- Extruded: Height information

## Technical Implementation

### Architecture
- **React**: Component-based UI with hooks for state management
- **Three.js**: Pure Three.js implementation (no React Three Fiber)
- **Scene Management**: Centralized object tracking and state management
- **History System**: Command pattern implementation for undo/redo

### Key Components
- `ThreeScene.jsx`: Main 3D editor component
- Scene setup with camera, renderer, controls, and lighting
- Raycasting for object selection
- Sketching system with multiple tools
- Extrusion using Three.js ExtrudeGeometry
- JSON-based scene persistence

### Performance Optimizations
- Efficient raycasting with object filtering
- Optimized geometry creation and disposal
- Smart preview updates during sketching
- Minimal re-renders with proper state management

## What Could Be Added/Improved

### With More Time
1. **Advanced Sketching**:
   - Bezier curves and splines
   - Text sketching and extrusion
   - Sketch editing (resize, move points)

2. **Enhanced 3D Features**:
   - Boolean operations (union, difference, intersection)
   - Advanced materials and textures
   - Animation and keyframe system

3. **UI/UX Improvements**:
   - Drag-and-drop object manipulation
   - Context menus and keyboard shortcuts
   - Multiple viewport support

4. **CAD-Specific Features**:
   - Constraint system
   - Parametric modeling
   - Assembly management
   - Technical drawing generation

5. **Performance Enhancements**:
   - Level-of-detail (LOD) system
   - Frustum culling optimization
   - Web Workers for heavy computations

## File Structure
```
src/
├── components/
│   └── ThreeScene.jsx    # Main 3D editor component
├── App.jsx              # Root component
├── App.css              # Main styles
└── index.css            # Global styles
```

## Dependencies
- React 19.1.1
- Three.js (latest)
- Vite (development server)

This project demonstrates proficiency in Three.js integration with React, CAD workflow concepts, and modern web development practices.