# Ray Tracing Visualization

<p>This was a research project for a professor in my 2nd year at UCF during the Undergraduate Research Experience. The goal was to create a JavaScript application that would let students better visualize how ray-tracing works in computer graphics.</p>

![Example](https://github.com/jlehett/RayTracingVisualization/blob/master/examples/1.PNG)

## How to Use ##

<p>Open up main.html in a web browser. Note: CORS requests may fail on certain browsers. Microsoft Edge has been tested to work fine for the purposes of this project.</p>
<p>On the top right of the app, there is a GUI. The first option is "Load File". Clicking this will pull up a file selection dialog. Select any ".obj" file (some example obj files are found in the OBJ folder in this repo), and Three.js will begin to load in the model.</p>
<p>Once the model is loaded, the next step should be placing a ray-tracing camera in the scene. Under the "Place" settings folder, there is a button labeled "Place Camera". This places a ray-tracing camera at your own viewing camera's position and with the same orientation. You can orbit your viewing camera by holding the left mouse button down and dragging. You can zoom in with the scrollwheel on the mouse. You can pan by holding the right mouse button down and dragging.</p>
<p>Once your camera is in the scene, you may have to adjust the frustum length (the length of the rays to send out from the camera; ray-tracing collisions are only computed in this frustum distance). Adjust the frustum length until it hits a part of the OBJ model you have loaded.</p>
<p>If you press the button near the top of the GUI that says "Ray Trace Camera" now, you should see dots appear on your model representing the nearest coordinate where each of the rays has hit an object. Under the "Display" settings folder, you can find various options to toggle what is rendered to your screen. Toggling "Dots" under the "Intersection" tab, for instance, will change the intersection dots to lines connecting each point to the camera, representing the rays themselves.</p>
<p>You may notice there is a "Shadow" tab in this settings folder. This requires lights to be placed in the scene. Under the "Place" tab in the GUI, you will find a "Lights" folder. Inside this folder is a "Place Point Light" button. Pressing this button will place a point light at your viewing camera's current location. Since it is a point light, orientation does not matter.</p>
<p>At this point, if you press the ray-tracing button again, you may notice lines extending from each of the dots or rays striking your model to the point light source if it can reach it. These represent shadow rays. If these rays reach the point light source, that means the pixel represented by the ray hitting the object at that location is illuminated by a factor of the distance from the object to the point light source. If it doesn't the pixel is not illuminated. You can view partial shadow rays (ones that don't fully reach the point light source) by toggling "Partial" in the "Shadow" folder. If you'd like to avoid viewing shadow rays, and would rather see just how the light illuminates the surface, you can toggle the shadow rays off by unchecking the "On" tickbox under "Shadow".</p>

![Shadow Ray 1 Point Light Source](https://github.com/jlehett/RayTracingVisualization/blob/master/examples/2.PNG)

<p>This program supports multiple point light sources in a scene at the same time. Simply placing more point lights using the "Place Point Light" button in the GUI will work. Ray-tracing the camera after placing the additional lights will show you shadow rays leading to both lights.</p>

![Shadow Ray 2 Point Light Sources](https://github.com/jlehett/RayTracingVisualization/blob/master/examples/3.PNG)
