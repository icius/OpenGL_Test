#version 430 core
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;

struct Material {
    float shininess;
};

struct Light {
    vec3 ambient;  // La
    vec3 diffuse;  // Ld
    vec3 specular; // Ls
};

uniform Light light;
uniform Material material;

uniform sampler2D floorTexture;
uniform vec3 lightPos;
uniform vec3 viewPos;

void main()
{
    vec3 color = texture(floorTexture, TexCoords).rgb;
    // Ambient
    vec3 ambient = light.ambient * color;

    // Diffuse
    vec3 lightDir = normalize(lightPos - FragPos);
    vec3 normal = normalize(Normal);
    float diff = max(dot(lightDir, normal), 0.0);
    vec3 diffuse = diff * light.diffuse * color;

    // Specular
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = 0.0;

    vec3 halfwayDir = normalize(lightDir + viewDir);
    spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);

    vec3 specular = light.specular * spec; // assuming bright white light color

    FragColor = vec4(ambient + diffuse + specular, 1.0f);

}
