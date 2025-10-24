# Extrusion Height Visual Explanation

## **What Extrusion Height Does**

Extrusion height controls how tall your 3D objects become when you convert 2D sketches to 3D.

## **Visual Representation**

### **2D Sketch (Top View)**
```
     ┌─────────┐
     │         │  ← Rectangle sketch on XZ plane
     │         │
     └─────────┘
```

### **Extrusion Process**
```
     ┌─────────┐  ← Top of 3D object
     │         │
     │         │  ← Extrusion Height = 5 units
     │         │
     │         │
     └─────────┘  ← Bottom of 3D object (original sketch)
```

## **Different Extrusion Heights**

### **Height = 1 unit (Thin)**
```
     ┌─────────┐
     └─────────┘
```

### **Height = 5 units (Medium)**
```
     ┌─────────┐
     │         │
     │         │
     │         │
     └─────────┘
```

### **Height = 10 units (Tall)**
```
     ┌─────────┐
     │         │
     │         │
     │         │
     │         │
     │         │
     │         │
     │         │
     │         │
     └─────────┘
```

## **Why You Might Not See the Difference**

### **1. Camera Position**
- **Too Far**: Camera is too far away to see height differences
- **Solution**: Zoom in closer to the objects

### **2. Viewing Angle**
- **Top View**: Looking down from above, height is not visible
- **Solution**: Rotate camera to see from the side

### **3. Object Size**
- **Small Sketch**: If your sketch is very small, height difference is minimal
- **Solution**: Create larger sketches or use higher extrusion heights

## **How to See the Effect Clearly**

### **Step 1: Create a Large Sketch**
- Draw a big rectangle or circle
- Make it at least 5x5 units

### **Step 2: Test Different Heights**
- Try extrusion height = 1
- Try extrusion height = 10
- Compare the results

### **Step 3: Rotate the Camera**
- Use mouse to rotate the view
- Look at objects from the side
- You'll see the height difference clearly

### **Step 4: Use the Grid for Reference**
- The grid helps you see the scale
- Each grid square is 1 unit
- Compare object height to grid squares

## **Technical Details**

### **Extrusion Settings**
```javascript
const extrudeSettings = {
  depth: height,        // This is your extrusion height
  bevelEnabled: false   // No rounded edges
};
```

### **Object Positioning**
```javascript
mesh.position.set(centerX, height/2, centerZ);
```
- **Y Position**: `height/2` - Centers the object on the ground
- **Result**: Object sits on the ground with specified height

### **Console Output**
When you extrude, check the console for:
```
Creating extrude geometry with height: 5
Extruded mesh size: {x: 4, y: 5, z: 3}
Extruded mesh height: 5
```

## **Troubleshooting**

### **If You Still Don't See the Effect:**

1. **Check Console**: Look for extrusion messages
2. **Try Different Values**: Use 1, 5, 10, 20 for clear differences
3. **Create Multiple Objects**: Extrude the same sketch with different heights
4. **Use Side View**: Rotate camera to see from the side
5. **Check Object Selection**: Make sure you're looking at the right object

### **Pro Tips:**
- **Start with 5 units**: Good middle ground for testing
- **Use the grid**: Helps visualize scale
- **Rotate frequently**: See objects from all angles
- **Compare objects**: Create multiple extrusions with different heights

The extrusion height IS working - it's just a matter of viewing angle and camera position to see the effect clearly!
