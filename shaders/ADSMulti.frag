#version 430 core
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;

struct Material {
    vec3 ambient;  // Ka
    vec3 diffuse;  // Kd
    vec3 specular; // Ks
    float shininess;
};

struct Light {
    vec3 ambient;  // La
    vec3 diffuse;  // Ld
    vec3 specular; // Ls
};

uniform vec3 viewPos;
uniform vec3 lightPositions[9];
uniform Material material;
uniform Light light;

vec3 ads(int lightIndex, vec3 viewDir, vec3 normal);

void main()
{
    vec3 color = vec3(0.0);

    vec3 normal = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);

    for (int i = 0; i < 9; i++)
    {
        color += ads(i, viewDir, normal);
    }

    FragColor = vec4(color, 1.0f);
}

vec3 ads(int lightIndex, vec3 viewDir, vec3 normal)
{
    // Ambient
    vec3 ambient = light.ambient * material.ambient;

    // Diffuse
    vec3 lightDir = normalize(lightPositions[lightIndex] - FragPos);
    float diff = max(dot(lightDir, normal), 0.0);
    vec3 diffuse = diff * light.diffuse * material.diffuse;

    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = 0.0;

    vec3 halfwayDir = normalize(lightDir + viewDir);
    spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);

    vec3 specular = light.specular * material.specular * spec; // assuming bright white light color

    return(ambient + diffuse + specular);

}



