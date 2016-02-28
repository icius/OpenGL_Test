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

struct SpotLight {
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
uniform vec3 spotLightPos[24];
uniform Material material;
uniform SpotLight spotLight;
uniform bool gamma;

vec3 spotLightCalc(int lightIndex, vec3 viewDir, vec3 normal);

void main()
{
    vec3 color = vec3(0.0);

    vec3 normal = normalize(Normal);
    vec3 viewDir = normalize(viewPos - FragPos);

    for (int i = 0; i < 24; i++)
    {
        color += spotLightCalc(i, viewDir, normal);
    }


    if(gamma)
        color = pow(color, vec3(1.0/2.2));

    FragColor = vec4(color, 1.0f);
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



