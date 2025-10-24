# Enhanced Import/Export Features

This document describes the new import/export functionality added to the 3D Editor.

## Supported Formats

### Import Formats
- **JSON** (.json) - Native scene format with objects and sketches
- **GLB/GLTF** (.glb, .gltf) - 3D model format with materials and textures
- **STL** (.stl) - 3D printing format (geometry only)
- **BREP** (.brep) - CAD format (placeholder implementation)

### Export Formats
- **JSON** (.json) - Native scene format
- **GLB** (.glb) - 3D model format with materials
- **STL** (.stl) - 3D printing format
- **BREP** (.brep) - CAD format (placeholder implementation)

## Features

### GLB/GLTF Support
- **Import**: Loads 3D models with materials and textures
- **Export**: Exports scene as GLB binary format
- **Features**: Preserves materials, textures, and object hierarchy

### STL Support
- **Import**: Loads 3D geometry for 3D printing
- **Export**: Exports scene as STL format for 3D printing
- **Features**: Geometry-only format, suitable for 3D printing

### BREP Support (Placeholder)
- **Import**: Placeholder for CAD format support
- **Export**: Placeholder for CAD format export
- **Note**: Requires OpenCascade.js integration for full implementation

## Usage

### Importing Files
1. Go to the "Scene" section in the controls panel
2. Click on the desired import button (JSON, GLB/GLTF, STL, or BREP)
3. Select the file from your computer
4. The file will be loaded into the scene

### Exporting Files
1. Create objects in the scene
2. Go to the "Scene" section in the controls panel
3. Click on the desired export button (JSON, GLB, STL, or BREP)
4. The file will be downloaded to your computer

## Technical Implementation

### Dependencies
- **GLTFLoader**: Built into Three.js (r103+)
- **STLLoader**: Built into Three.js
- **GLTFExporter**: Built into Three.js
- **STLExporter**: Built into Three.js
- **OpenCascade.js**: For BREP support (future implementation)

### Error Handling
- File format validation
- Loading error messages
- Export validation (checks for objects)
- User-friendly error messages

### Performance
- Dynamic imports for loaders/exporters
- Memory cleanup after operations
- Efficient file processing

## Future Enhancements

### BREP Implementation
- Full OpenCascade.js integration
- CAD geometry support
- Advanced modeling operations

### Additional Formats
- OBJ support
- PLY support
- FBX support
- STEP support

### Advanced Features
- Batch import/export
- Format conversion
- Geometry optimization
- Material preservation
