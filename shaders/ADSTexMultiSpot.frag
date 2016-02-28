#version 430 core
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;
in vec2 TexCoords;

struct Material {
    sampler2D diffuse;
    sampler2D specular;
    float shininess;
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
uniform int numSpots;
uniform int numPoints;
uniform vec3 spotLightPos[10];
uniform vec3 pointLightPos[10];
uniform Material material;
uniform SpotLight spotLight;
uniform PointLight pointLight;
uniform sampler2D objTexture;
uniform bool gamma;

vec3 spotLightCalc(int lightIndex, vec3 viewDir, vec3 normal);
vec3 pointLightCalc(int lightIndex, vec3 viewDir, vec3 normal);

void main()
{

    vec3 color = vec3(0.0);

    vec3 normal = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);

    for (int i = 0; i < numSpots; i++)
    {
        color += spotLightCalc(i, viewDir, normal);
    }

    for (int i = 0; i < numPoints; i++)
    {
        color += pointLightCalc(i, viewDir, normal);
    }

    float gamma = 2.2;
    color = pow(color, vec3(1.0/gamma));
    FragColor = vec4(color, 1.0f);

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

    return(ambient + diffuse + specular);

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

    return(ambient + diffuse + specular);

}

