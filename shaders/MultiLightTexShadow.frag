#version 430 core
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;
in vec2 TexCoords;
in vec4 FragPosLightSpace;

struct Material {
    sampler2D diffuse;
    sampler2D specular;
    float shininess;
};

struct DirLight {
    vec3 direction;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct SpotLight {
    vec3 direction;
    float cutOff;
    float outerCutOff;

    float constant;
    float linear;
    float quadratic;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct PointLight {
    float constant;
    float linear;
    float quadratic;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

uniform vec3 viewPos;
uniform int numDirs;
uniform int numSpots;
uniform int numPoints;
uniform vec3 spotLightPos[10];
uniform vec3 pointLightPos[10];
uniform vec3 lightPos;
uniform Material material;
uniform DirLight dirLight;
uniform SpotLight spotLight;
uniform PointLight pointLight;
uniform sampler2D objTexture;
uniform bool gamma;

uniform sampler2D shadowMap;

vec3 dirLightCalc(int lightIndex, vec3 viewDir, vec3 normal);
vec3 spotLightCalc(int lightIndex, vec3 viewDir, vec3 normal);
vec3 pointLightCalc(int lightIndex, vec3 viewDir, vec3 normal);
float ShadowCalculation(vec4 fragPosLightSpace);

void main()
{

    vec3 color = vec3(0.0);

    vec3 normal = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);

    for (int i = 0; i < numDirs; i++)
    {
        color += dirLightCalc(i, viewDir, normal);
    }

    for (int i = 0; i < numSpots; i++)
    {
        color += spotLightCalc(i, viewDir, normal);
    }

    for (int i = 0; i < numPoints; i++)
    {
        color += pointLightCalc(i, viewDir, normal);
    }

    if(gamma)
        color = pow(color, vec3(1.0/2.2));

    FragColor = vec4(color, 1.0f);

}

vec3 dirLightCalc(int lightIndex, vec3 viewDir, vec3 normal)
{
    vec3 lightDir = normalize(-dirLight.direction);
    // Diffuse shading
    float diff = max(dot(normal, lightDir), 0.0);
    // Specular shading
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    // Combine results
    vec3 ambient = dirLight.ambient * vec3(texture(material.diffuse, TexCoords));
    vec3 diffuse = dirLight.diffuse * diff * vec3(texture(material.diffuse, TexCoords));
    vec3 specular = dirLight.specular * spec * vec3(texture(material.specular, TexCoords));

    float shadow = ShadowCalculation(FragPosLightSpace);
    vec3 lighting = (ambient + (1.0 - shadow) * (diffuse + specular));
    return(lighting);
}


vec3 spotLightCalc(int lightIndex, vec3 viewDir, vec3 normal)
{

    vec3 ambient = spotLight.ambient * vec3(texture(material.diffuse, TexCoords));

    // Diffuse
    vec3 lightDir = normalize(spotLightPos[lightIndex] - FragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * spotLight.diffuse * vec3(texture(material.diffuse, TexCoords));

    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = 0.0;

    vec3 halfwayDir = normalize(lightDir + viewDir);
    spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);
    vec3 specular = spotLight.specular * spec * vec3(texture(material.specular, TexCoords));


    // Spotlight (soft edges)
    float theta = dot(lightDir, normalize(-spotLight.direction));
    float epsilon = (spotLight.cutOff - spotLight.outerCutOff);
    float intensity = clamp((theta - spotLight.outerCutOff) / epsilon, 0.0, 1.0);
    diffuse  *= intensity;
    specular *= intensity;

    // Attenuation
    float distance    = length(spotLightPos[lightIndex] - FragPos);
    float attenuation = 1.0f / (spotLight.constant + spotLight.linear * distance +
                        spotLight.quadratic * (distance * distance));

    ambient  *= attenuation;
    diffuse  *= attenuation;
    specular *= attenuation;

    float shadow = ShadowCalculation(FragPosLightSpace);
    vec3 lighting = (ambient + (1.0 - shadow) * (diffuse + specular));
    return(lighting);

}

vec3 pointLightCalc(int lightIndex, vec3 viewDir, vec3 normal)
{

    vec3 ambient = pointLight.ambient * vec3(texture(material.diffuse, TexCoords));

    // Diffuse
    vec3 lightDir = normalize(pointLightPos[lightIndex] - FragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * pointLight.diffuse * vec3(texture(material.diffuse, TexCoords));

    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = 0.0;

    vec3 halfwayDir = normalize(lightDir + viewDir);
    spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);
    vec3 specular = pointLight.specular * spec * vec3(texture(material.specular, TexCoords));

    // Attenuation
    float distance    = length(pointLightPos[lightIndex] - FragPos);
    float attenuation = 1.0f / (pointLight.constant + pointLight.linear * distance +
                        pointLight.quadratic * (distance * distance));

    ambient  *= attenuation;
    diffuse  *= attenuation;
    specular *= attenuation;

    float shadow = ShadowCalculation(FragPosLightSpace);
    vec3 lighting = (ambient + (1.0 - shadow) * (diffuse + specular));
    return(lighting);
}

float ShadowCalculation(vec4 fragPosLightSpace)
{
    // perform perspective divide
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    // Transform to [0,1] range
    projCoords = projCoords * 0.5 + 0.5;
    // Get closest depth value from light's perspective (using [0,1] range fragPosLight as coords)
    float closestDepth = texture(shadowMap, projCoords.xy).r;
    // Get depth of current fragment from light's perspective
    float currentDepth = projCoords.z;
    // Calculate bias (based on depth map resolution and slope)
    vec3 normal = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    float bias = max(0.05 * (1.0 - dot(normal, lightDir)), 0.005);
    // Check whether current frag pos is in shadow
    // float shadow = currentDepth - bias > closestDepth  ? 1.0 : 0.0;
    // PCF
    float shadow = 0.0;
    vec2 texelSize = 1.0 / textureSize(shadowMap, 0);
    for(int x = -1; x <= 1; ++x)
    {
        for(int y = -1; y <= 1; ++y)
        {
            float pcfDepth = texture(shadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
            shadow += currentDepth - bias > pcfDepth  ? 1.0 : 0.0;
        }
    }
    shadow /= 9.0;

    // Keep the shadow at 0.0 when outside the far_plane region of the light's frustum.
    if(projCoords.z > 1.0)
        shadow = 0.0;

    return shadow;
}

