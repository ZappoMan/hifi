//
//  Light.cpp
//  libraries/model/src/model
//
//  Created by Sam Gateau on 1/26/2014.
//  Copyright 2014 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
#include "Light.h"

using namespace model;

Light::Light() {
    // only if created from nothing shall we create the Buffer to store the properties
    Schema schema;
    _schemaBuffer = std::make_shared<gpu::Buffer>(sizeof(Schema), (const gpu::Byte*) &schema);
    updateLightRadius();
}

Light::Light(const Light& light) :
    _flags(light._flags),
    _schemaBuffer(light._schemaBuffer),
    _transform(light._transform)
{
}

Light& Light::operator= (const Light& light) {
    _flags = (light._flags);
    _schemaBuffer = (light._schemaBuffer);
    _transform = (light._transform);

    return (*this);
}

Light::~Light() {
}

void Light::setType(Type type) {
    editSchema()._control.x = float(type);
    updateLightRadius();
    updateVolumeGeometry();
}


void Light::setPosition(const Vec3& position) {
    _transform.setTranslation(position);
    editSchema()._position = Vec4(position, 1.f);
}

void Light::setOrientation(const glm::quat& orientation) {
    setDirection(orientation * glm::vec3(0.0f, 0.0f, -1.0f));
    _transform.setRotation(orientation);
}

void Light::setDirection(const Vec3& direction) {
    editSchema()._direction = glm::normalize(direction);
}

const Vec3& Light::getDirection() const {
    return getSchema()._direction;
}

void Light::setColor(const Color& color) {
    editSchema()._color = color;
    updateLightRadius();
}

void Light::setIntensity(float intensity) {
    editSchema()._intensity = intensity;
    updateLightRadius();
}

void Light::setAmbientIntensity(float intensity) {
    editSchema()._ambientIntensity = intensity;
}

void Light::setFalloffRadius(float radius) {
    if (radius <= 0.0f) {
        radius = 0.1f;
    }
    editSchema()._attenuation.x = radius;
    updateLightRadius();
}
void Light::setMaximumRadius(float radius) {
    if (radius <= 0.f) {
        radius = 1.0f;
    }
    editSchema()._attenuation.y = radius;
    updateLightRadius();
    updateVolumeGeometry();
}

void Light::updateLightRadius() {
    // This function relies on the attenuation equation:
    // I = Li / (1 + (d + Lr)/Lr)^2
    // where I = calculated intensity, Li = light intensity, Lr = light falloff radius, d = distance from surface 
    // see: https://imdoingitwrong.wordpress.com/2011/01/31/light-attenuation/
    // note that falloff radius replaces surface radius in linked example
    // This equation is biased back by Lr so that all lights act as true points, regardless of surface radii

    const float MIN_CUTOFF_INTENSITY = 0.001f;
    // Get cutoff radius at minimum intensity
    float intensity = getIntensity() * std::max(std::max(getColor().x, getColor().y), getColor().z);
    float cutoffRadius = getFalloffRadius() * ((glm::sqrt(intensity / MIN_CUTOFF_INTENSITY) - 1) - 1);

    // If it is less than max radius, store it to buffer to avoid extra shading
    editSchema()._attenuation.z = std::min(getMaximumRadius(), cutoffRadius);
}

#include <math.h>

void Light::setSpotAngle(float angle) {
    double dangle = angle;
    if (dangle <= 0.0) {
        dangle = 0.0;
    }
    if (dangle > glm::half_pi<double>()) {
        dangle = glm::half_pi<double>();
    }

    auto cosAngle = cos(dangle);
    auto sinAngle = sin(dangle);
    editSchema()._spot.x = (float) std::abs(cosAngle);
    editSchema()._spot.y = (float) std::abs(sinAngle);
    editSchema()._spot.z = (float) angle;

    updateVolumeGeometry();
}

void Light::setSpotExponent(float exponent) {
    if (exponent <= 0.f) {
        exponent = 0.0f;
    }
    editSchema()._spot.w = exponent;
}

void Light::setShowContour(float show) {
    if (show <= 0.f) {
        show = 0.0f;
    }
    editSchema()._control.z = show;
}

void Light::setAmbientSphere(const gpu::SphericalHarmonics& sphere) {
    editSchema()._ambientSphere = sphere;
}

void Light::setAmbientSpherePreset(gpu::SphericalHarmonics::Preset preset) {
    editSchema()._ambientSphere.assignPreset(preset);
}

void Light::setAmbientMap(gpu::TexturePointer ambientMap) {
    _ambientMap = ambientMap;
    if (ambientMap) {
        setAmbientMapNumMips(_ambientMap->evalNumMips());
    } else {
        setAmbientMapNumMips(0);
    }
}

void Light::setAmbientMapNumMips(uint16_t numMips) {
    editSchema()._ambientMapNumMips = (float)numMips;
}

void Light::updateVolumeGeometry() {
    // enlarge the scales slightly to account for tesselation
    const float SCALE_EXPANSION = 0.05f;
    glm::vec4 volumeGeometry(0.0f, 0.0f, 0.0f, getMaximumRadius() * (1.0f + SCALE_EXPANSION));

    if (getType() == SPOT) {
        const float TANGENT_LENGTH_SCALE = 0.666f;
        volumeGeometry = glm::vec4(getSpotAngleCosSin(), TANGENT_LENGTH_SCALE * tanf(0.5f * getSpotAngle()), volumeGeometry.w);
    }
    editSchema()._volumeGeometry = volumeGeometry;
}
