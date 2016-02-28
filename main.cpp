// Std. Includes
#include <string>
#include <iomanip>
#include <iostream>

#include "gl_core_4_3.h"

// GLFW
#include <GLFW/glfw3.h>

// GLM Mathemtics
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtx/transform.hpp>
#include <glm/gtc/type_ptr.hpp>

// GL includes
#include "glutils.h"
#include "glslprogram.h"
#include "Camera.h"
#include "Text.h"
#include "Model.h"
#include "vbocube.h"
#include "vbotorus.h"
#include "vboplane.h"
#include "Standard_Materials.h"

// Other Libs
#include <SOIL.h>
#include <FreeImage.h>

using namespace std;

// Properties
GLuint screenWidth = 1024, screenHeight = 768;

// Function prototypes
void keyCallback(GLFWwindow* window, int key, int scancode, int action,
                  int mode);

void scrollCallback(GLFWwindow* window, double xoffset, double yoffset);
void mouseCallback(GLFWwindow* window, double xpos, double ypos);
void doMovement();
GLuint loadTexture(GLchar* path, bool sRGB = false);

// Camera
Camera camera(glm::vec3(0.0f, 0.0f, 4.0f));
bool keys[1024];
GLfloat lastX = 400, lastY = 300;
bool firstMouse = true;

GLfloat deltaTime = 0.0f;
GLfloat lastFrame = 0.0f;
GLfloat frameRate = 1000.0f;

// World coordinates of a single light
glm::vec3 lightPos( -3.5f,  2.5f, -4.0f);

glm::vec3 halogen(1.0f, 0.945098039f, 0.878431373f);

//glm::vec3 halogen(1.0f, 0.839215686f, 0.666666667f);

struct Light {
    glm::vec3 position;
    glm::vec3 ambient;  // La
    glm::vec3 diffuse;  // Ld
    glm::vec3 specular; // Ls
};

// The MAIN function, from here we start our application and run our Game loop
int main()
{

    loadStdMats();
    stdMaterial matDefinition;

    // Init GLFW
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_RESIZABLE, 0);
    glfwWindowHint(GLFW_SAMPLES, 4);
    glfwWindowHint(GLFW_OPENGL_DEBUG_CONTEXT, GL_TRUE);

    GLFWwindow* window = glfwCreateWindow(screenWidth, screenHeight,
                                          "LearnOpenGL", nullptr, nullptr);
    glfwMakeContextCurrent(window);

    int loaded = ogl_LoadFunctions();
    if(loaded == ogl_LOAD_FAILED) {
        //Destroy the context and abort
        return 0;
    }
    int num_failed = loaded - ogl_LOAD_SUCCEEDED;
    printf("Number of functions that failed to load: %i.\n",num_failed);


    // Set the required callback functions
    glfwSetKeyCallback(window, keyCallback);
    glfwSetCursorPosCallback(window, mouseCallback);
    glfwSetScrollCallback(window, scrollCallback);

    // Options
    glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);

    // Define the viewport dimensions
    glViewport(0, 0, screenWidth, screenHeight);

   // Setup some OpenGL options
    glEnable(GL_DEBUG_OUTPUT);
    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LESS);
    glEnable(GL_MULTISAMPLE);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    glDebugMessageCallback(GLUtils::debugCallback, NULL);
    glDebugMessageControl(GL_DONT_CARE, GL_DONT_CARE, GL_DONT_CARE, 0, NULL, GL_TRUE);

    // Draw in wireframe
    // glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);

    GLSLProgram lampShader, floorShader, textShader, testShader, adsShader, diamondShader;

    lampShader.init("shaders/lamp.vert","shaders/lamp.frag");
    floorShader.init("shaders/ADSTexMultiSpot.vert","shaders/ADSTexMultiSpot.frag");
    textShader.init("shaders/text.vert","shaders/text.frag");
    adsShader.init("shaders/ADSMultiSpot.vert", "shaders/ADSMultiSpot.frag");
    diamondShader.init("shaders/ADSMultiSpot.vert","shaders/ADSMultiSpot.frag");

    VBOCube cube;
    VBOTorus torus(0.7f, 0.3f, 60, 60);
    VBOPlane plane(15.0f, 15.0f, 1, 1, 4.0f, 4.0f);

    glm::vec3 *lightPositions = new glm::vec3[24] {
        glm::vec3(-5.5, 2.5f, -6.0f),
        glm::vec3(-3.5, 2.5f, -6.0f),
        glm::vec3(-1.5f, 2.5f, -6.0f),
        glm::vec3(1.5f, 2.5f, -6.0f),
        glm::vec3(3.5f, 2.5f, -6.0f),
        glm::vec3(5.5f, 2.5f, -6.0f),
        glm::vec3(-5.5, 2.5f, -2.0f),
        glm::vec3(-3.5, 2.5f, -2.0f),
        glm::vec3(-1.5f, 2.5f, -2.0f),
        glm::vec3(1.5f, 2.5f, -2.0f),
        glm::vec3(3.5f, 2.5f, -2.0f),
        glm::vec3(5.5f, 2.5f, -2.0f),
        glm::vec3(-5.5, 2.5f, 2.0f),
        glm::vec3(-3.5, 2.5f, 2.0f),
        glm::vec3(-1.5f, 2.5f, 2.0f),
        glm::vec3(1.5f, 2.5f, 2.0f),
        glm::vec3(3.5f, 2.5f, 2.0f),
        glm::vec3(5.5f, 2.5f, 2.0f),
        glm::vec3(-5.5, 2.5f, 6.0f),
        glm::vec3(-3.5, 2.5f, 6.0f),
        glm::vec3(-1.5f, 2.5f, 6.0f),
        glm::vec3(1.5f, 2.5f, 6.0f),
        glm::vec3(3.5f, 2.5f, 6.0f),
        glm::vec3(5.5f, 2.5f, 6.0f)
    };

    Model diamond("models/diamond.obj");

    glm::vec3 *matObjPositions = new glm::vec3[24] {
        glm::vec3(-5.5, 0.0f, -6.0f),
        glm::vec3(-3.5, 0.0f, -6.0f),
        glm::vec3(-1.5f, 0.0f, -6.0f),
        glm::vec3(1.5f, 0.0f, -6.0f),
        glm::vec3(3.5f, 0.0f, -6.0f),
        glm::vec3(5.5f, 0.0f, -6.0f),
        glm::vec3(-5.5, 0.0f, -2.0f),
        glm::vec3(-3.5, 0.0f, -2.0f),
        glm::vec3(-1.5f, 0.0f, -2.0f),
        glm::vec3(1.5f, 0.0f, -2.0f),
        glm::vec3(3.5f, 0.0f, -2.0f),
        glm::vec3(5.5f, 0.0f, -2.0f),
        glm::vec3(-5.5, 0.0f, 2.0f),
        glm::vec3(-3.5, 0.0f, 2.0f),
        glm::vec3(-1.5f, 0.0f, 2.0f),
        glm::vec3(1.5f, 0.0f, 2.0f),
        glm::vec3(3.5f, 0.0f, 2.0f),
        glm::vec3(5.5f, 0.0f, 2.0f),
        glm::vec3(-5.5, 0.0f, 6.0f),
        glm::vec3(-3.5, 0.0f, 6.0f),
        glm::vec3(-1.5f, 0.0f, 6.0f),
        glm::vec3(1.5f, 0.0f, 6.0f),
        glm::vec3(3.5f, 0.0f, 6.0f),
        glm::vec3(5.5f, 0.0f, 6.0f)
    };

    string matList[] =  {
        "emerald",
        "jade",
        "obsidian",
        "pearl",
        "ruby",
        "turquoise",
        "brass",
        "bronze",
        "chrome",
        "copper",
        "gold",
        "silver",
        "black plastic",
        "cyan plastic",
        "green plastic",
        "red plastic",
        "white plastic",
        "yellow plastic",
        "black rubber",
        "cyan rubber",
        "green rubber",
        "red rubber",
        "white rubber",
        "yellow rubber"
    };

    // Variables for the Frame Rate Display
    GLint frameRateCounterTarget = 4;
    GLint frameRateCounter = frameRateCounterTarget;
    string frameRateString;

    Text frameRateText(textShader, "fonts/Arial.ttf", 48, screenWidth,
                       screenHeight);

    // Load textures
    GLuint floorTexture = loadTexture((char *)"textures/wood.png", true);
    GLuint floorSpec = loadTexture((char *)"textures/wood_spec.png");

    // Set texture units
    floorShader.use();
    floorShader.setUniform("material.diffuse", 0);
    floorShader.setUniform("material.specular", 1);

    floorShader.setUniform("light.direction", 0.0f, -1.0f, 0.0f);
    floorShader.setUniform("light.constant", 1.0f);
    floorShader.setUniform("light.linear", 0.09f);
    floorShader.setUniform("light.quadratic", 0.032f);
    floorShader.setUniform("light.cutOff", glm::cos(glm::radians(18.0f)));
    floorShader.setUniform("light.outerCutOff", glm::cos(glm::radians(28.0f)));

    floorShader.setUniform("light.ambient", glm::vec3(0.08f) * halogen);
    floorShader.setUniform("light.diffuse", glm::vec3(0.7f) * halogen);
    floorShader.setUniform("light.specular", glm::vec3(2.0f) * halogen);

    floorShader.setUniform("material.shininess", 128.0f);
    glUniform3fv(glGetUniformLocation(floorShader.getHandle(), "lightPositions")
                 , 24, glm::value_ptr(lightPositions[0]));


    diamondShader.use();

    diamondShader.setUniform("light.direction", 0.0f, -1.0f, 0.0f);
    diamondShader.setUniform("light.constant", 1.0f);
    diamondShader.setUniform("light.linear", 0.09f);
    diamondShader.setUniform("light.quadratic", 0.032f);
    diamondShader.setUniform("light.cutOff", glm::cos(glm::radians(18.0f)));
    diamondShader.setUniform("light.outerCutOff", glm::cos(glm::radians(28.0f)));

    diamondShader.setUniform("light.ambient", glm::vec3(0.08f) * halogen);
    diamondShader.setUniform("light.diffuse", glm::vec3(0.7f) * halogen);
    diamondShader.setUniform("light.specular", glm::vec3(2.0f) * halogen);

    glUniform3fv(glGetUniformLocation(diamondShader.getHandle(),
                 "lightPositions"), 24, glm::value_ptr(lightPositions[0]));

    glm::mat4 model;



    // Game loop
    while(!glfwWindowShouldClose(window))
    {
        // Set frame time
        GLfloat currentFrame = glfwGetTime();
        deltaTime = currentFrame - lastFrame;

        // Setting up the text for the Frame Rate display
        if(frameRateCounter == frameRateCounterTarget)
        {
            frameRate = deltaTime * 1000;
            frameRateString = to_string(frameRate);
            frameRateCounter = 0;
        }

        ++frameRateCounter;

        lastFrame = currentFrame;

        // Check and call events
        glfwPollEvents();
        doMovement();

        // Clear the colorbuffer
        glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
        //glClearColor(0.05f, 0.05f, 0.05f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom),
                                                (float)screenWidth/
                                                (float)screenHeight, 0.1f,
                                                100.0f);

        glm::mat4 view = camera.GetViewMatrix();


        //------ Setup and Render the Lamp ------

        lampShader.use();

        lampShader.setUniform("view", view);
        lampShader.setUniform("projection", projection);

        for(int x=0; x < 24; x++)
        {
            model = glm::mat4();
            model = glm::translate(model, lightPositions[x]);
            model = glm::scale(model, glm::vec3(0.2f));
            lampShader.setUniform("model", model);
            cube.render();
        }

        glBindVertexArray(0);


        //------ Render the Framerate Text ------

        frameRateText.render(textShader, frameRateString, screenWidth - 130.0f,
                             screenHeight - 30.0f, 0.5f,
                             glm::vec3(0.2f, 0.6f, 0.2f));


        //------ Setup and Render the Floor ------

        floorShader.use();

        floorShader.setUniform("projection", projection);
        floorShader.setUniform("view", view);

        model = glm::mat4();
        model *= glm::translate(glm::vec3(0.0f, -1.0f, 0.0f));
        floorShader.setUniform("model", model);
        floorShader.setUniform("viewPos", camera.Position);

        // Bind diffuse map
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, floorTexture);
        // Bind specular map
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, floorSpec);

        plane.render();


        //------ Setup and Render the Diamonds ------

        diamondShader.use();

        diamondShader.setUniform("projection", projection);
        diamondShader.setUniform("view", view);

        GLfloat rotation = (GLfloat)glfwGetTime() * glm::radians(50.0f);

        diamondShader.setUniform("model", model);
        diamondShader.setUniform("viewPos", camera.Position);

        for(GLint matObjCounter = 0; matObjCounter < 24; ++matObjCounter)
        {
            stdMaterial matObjMat = stdMatMap[matList[matObjCounter]];

            model = glm::mat4();
            model *= glm::translate(matObjPositions[matObjCounter]);
            model *= glm::rotate(rotation, vec3(0.0f, 1.0f, 0.0f));

            diamondShader.setUniform("model", model);
            diamondShader.setUniform("material.ambient", matObjMat.ambient);
            diamondShader.setUniform("material.diffuse", matObjMat.diffuse);
            diamondShader.setUniform("material.specular", matObjMat.specular);
            diamondShader.setUniform("material.shininess", matObjMat.shininess);

            diamond.Draw(diamondShader);
        }

        glfwSwapBuffers(window);
    }

    glfwTerminate();

    return 0;
}


// This function loads a texture from file. Note: texture loading functions like these are usually
// managed by a 'Resource Manager' that manages all resources (like textures, models, audio).
// For learning purposes we'll just define it as a utility function.

GLuint loadTexture(GLchar* path, bool sRGB)
{
    // Generate texture ID and load texture data
    GLuint textureID;
    glGenTextures(1, &textureID);
    int width,height;
    unsigned char* image = SOIL_load_image(path, &width, &height, 0,
                                           SOIL_LOAD_RGB);

    // Assign texture to ID
    glBindTexture(GL_TEXTURE_2D, textureID);

    if(sRGB)
        glTexImage2D(GL_TEXTURE_2D, 0, GL_SRGB, width, height, 0, GL_RGB,
                     GL_UNSIGNED_BYTE, image);
    else
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB,
                     GL_UNSIGNED_BYTE, image);

    glGenerateMipmap(GL_TEXTURE_2D);

    // Parameters
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT );
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT );
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER,
                     GL_LINEAR_MIPMAP_LINEAR );

    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glBindTexture(GL_TEXTURE_2D, 0);
    SOIL_free_image_data(image);
    return textureID;

}

// Moves/alters the camera positions based on user input
void doMovement()
{
    // Camera controls
    if(keys[GLFW_KEY_W])
        camera.ProcessKeyboard(FORWARD, deltaTime);
    if(keys[GLFW_KEY_S])
        camera.ProcessKeyboard(BACKWARD, deltaTime);
    if(keys[GLFW_KEY_A])
        camera.ProcessKeyboard(LEFT, deltaTime);
    if(keys[GLFW_KEY_D])
        camera.ProcessKeyboard(RIGHT, deltaTime);
}

// Is called whenever a key is pressed/released via GLFW
void keyCallback(GLFWwindow* window, int key, int scancode, int action,
                  int mode)
{
    if(key == GLFW_KEY_ESCAPE && action == GLFW_PRESS)
        glfwSetWindowShouldClose(window, GL_TRUE);

    if(key == GLFW_KEY_P && action == GLFW_PRESS)
    {

        // Make the BYTE array, factor of 3 because it's RBG.
        BYTE* pixels = new BYTE[ 3 * screenWidth * screenHeight];

        glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
        glReadPixels(0, 0, screenWidth, screenHeight, GL_BGR, GL_UNSIGNED_BYTE, pixels);

        // Convert to FreeImage format & save to file
        FIBITMAP* image = FreeImage_ConvertFromRawBits(pixels, screenWidth, screenHeight, 3 * screenWidth, 24, 0x0000FF, 0xFF0000, 0x00FF00,  false);
        FreeImage_Save(FIF_BMP, image, "screenshot.bmp", 0);

        // Free resources
        FreeImage_Unload(image);
        delete [] pixels;


    }

    if(action == GLFW_PRESS)
        keys[key] = true;
    else if(action == GLFW_RELEASE)
        keys[key] = false;
}

void mouseCallback(GLFWwindow* window, double xpos, double ypos)
{
    if(firstMouse)
    {
        lastX = xpos;
        lastY = ypos;
        firstMouse = false;
    }

    GLfloat xoffset = xpos - lastX;
    GLfloat yoffset = lastY - ypos;

    lastX = xpos;
    lastY = ypos;

    camera.ProcessMouseMovement(xoffset, yoffset);
}

void scrollCallback(GLFWwindow* window, double xoffset, double yoffset)
{
    camera.ProcessMouseScroll(yoffset);
}

void debugCallback(GLenum source, GLenum type, GLuint id, GLenum severity,
                   GLsizei length, const GLchar * message, const void * param)
{
    // Convert GLenum parameters to strings
    printf("%d:%d[%d](%d): %s\n", source, type, severity, id, message);
}
