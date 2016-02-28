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

struct Light {
    vec3 direction;
    float cutOff;
    float outerCutOff;

    float constant;
    float linear;
    float quadratic;

    vec3 ambient;  // La
    vec3 diffuse;  // Ld
    vec3 specular; // Ls
};

uniform vec3 viewPos;
uniform vec3 lightPositions[24];
uniform Material material;
uniform Light light;
uniform sampler2D objTexture;

vec3 ads(int lightIndex, vec3 viewDir, vec3 normal);

void main()
{

    vec3 color = vec3(0.0);

    vec3 normal = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);

    for (int i = 0; i < 24; i++)
    {
        color += ads(i, viewDir, normal);
    }

    float gamma = 2.2;
    color = pow(color, vec3(1.0/gamma));
    FragColor = vec4(color, 1.0f);

}

vec3 ads(int lightIndex, vec3 viewDir, vec3 normal)
{

    vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords));

    // Diffuse
    vec3 lightDir = normalize(lightPositions[lightIndex] - FragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * light.diffuse * vec3(texture(material.diffuse, TexCoords));

    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = 0.0;

    vec3 halfwayDir = normalize(lightDir + viewDir);
    spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);
    vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords));


    // Spotlight (soft edges)
    float theta = dot(lightDir, normalize(-light.direction));
    float epsilon = (light.cutOff - light.outerCutOff);
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);
    diffuse  *= intensity;
    specular *= intensity;

    // Attenuation
    float distance    = length(lightPositions[lightIndex] - FragPos);
    float attenuation = 1.0f / (light.constant + light.linear * distance +
                        light.quadratic * (distance * distance));

    ambient  *= attenuation;
    diffuse  *= attenuation;
    specular *= attenuation;

    return(ambient + diffuse + specular);

}

