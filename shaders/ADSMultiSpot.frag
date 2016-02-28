#version 430 core
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;

struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
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
uniform Material material;
uniform DirLight dirLight;
uniform SpotLight spotLight;
uniform PointLight pointLight;
uniform bool gamma;

vec3 dirLightCalc(int lightIndex, vec3 viewDir, vec3 normal);
vec3 spotLightCalc(int lightIndex, vec3 viewDir, vec3 normal);
vec3 pointLightCalc(int lightIndex, vec3 viewDir, vec3 normal);

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
    vec3 ambient = dirLight.ambient * material.ambient;
    vec3 diffuse = dirLight.diffuse * diff * material.diffuse;
    vec3 specular = dirLight.specular * spec * material.specular;
    return (ambient + diffuse + specular);
}


vec3 spotLightCalc(int lightIndex, vec3 viewDir, vec3 normal)
{
    // Ambient
    vec3 ambient = spotLight.ambient * material.ambient;

    // Diffuse
    vec3 lightDir = normalize(spotLightPos[lightIndex] - FragPos);
    float diff = max(dot(lightDir, normal), 0.0);
    vec3 diffuse = diff * spotLight.diffuse * material.diffuse;

    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = 0.0;

    vec3 halfwayDir = normalize(lightDir + viewDir);
    spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);
    vec3 specular = spotLight.specular * material.specular * spec;

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

    return(ambient + diffuse + specular);
}

vec3 pointLightCalc(int lightIndex, vec3 viewDir, vec3 normal)
{
    // Ambient
    vec3 ambient = pointLight.ambient * material.ambient;

    // Diffuse
    vec3 lightDir = normalize(pointLightPos[lightIndex] - FragPos);
    float diff = max(dot(lightDir, normal), 0.0);
    vec3 diffuse = diff * pointLight.diffuse * material.diffuse;

    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = 0.0;

    vec3 halfwayDir = normalize(lightDir + viewDir);
    spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);
    vec3 specular = pointLight.specular * material.specular * spec;

    // Attenuation
    float distance    = length(pointLightPos[lightIndex] - FragPos);
    float attenuation = 1.0f / (pointLight.constant + pointLight.linear * distance +
                        pointLight.quadratic * (distance * distance));

    ambient  *= attenuation;
    diffuse  *= attenuation;
    specular *= attenuation;

    return(ambient + diffuse + specular);
}


