#ifndef STANDARD_MATERIALS_H_INCLUDED
#define STANDARD_MATERIALS_H_INCLUDED

// GLM Mathemtics
#include <glm/glm.hpp>
#include <map>
#include "csv.h"

// GLFW
#include <GLFW/glfw3.h>

struct stdMaterial
{
    glm::vec3 ambient;
    glm::vec3 diffuse;
    glm::vec3 specular;
    GLfloat shininess;
};

map<string, stdMaterial> stdMatMap;

void loadStdMats()
{

    io::CSVReader<11> in("standard_materials.csv");
    in.read_header(io::ignore_extra_column, "material",
                   "ambr", "ambg", "ambb",
                   "diffr", "diffg", "diffb",
                   "specr", "specg", "specb",
                   "shiny");

    std::string matName;
    GLfloat ambr;
    GLfloat ambg;
    GLfloat ambb;
    GLfloat diffr;
    GLfloat diffg;
    GLfloat diffb;
    GLfloat specr;
    GLfloat specg;
    GLfloat specb;
    GLfloat shiny;

    while(in.read_row(matName,
                      ambr, ambg, ambb,
                      diffr, diffg, diffb,
                      specr, specg, specb,
                      shiny))
    {
        stdMaterial material;
        material = {glm::vec3(ambr, ambg, ambb),
                    glm::vec3(diffr, diffg, diffb),
                    glm::vec3(specr, specg, specb),
                    shiny * 128};

        stdMatMap[matName] = material;
    }
}

#endif // STANDARD_MATERIALS_H_INCLUDED
