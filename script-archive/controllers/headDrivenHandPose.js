//
//  headDrivenHandPose.js
//  examples/controllers
//
//  Created by Brad Hefta-Gaub on 2016/10/29
//  Copyright 2016 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var MAPPING_NAME = "com.highfidelity.examples.lookAtHandPose";
var mapping = Controller.newMapping(MAPPING_NAME);

var LeftHandActive = false;
var RightHandActive = false;

var getAvatarHandPose = function(hand) {
    var avartHandPosition, handSlightOffset;
    if (hand == Controller.Standard.LeftHand) {
        handSlightOffset = { x: -0.25, y: -0.17, z: -0.05 }; // slightly wide, slightly lower, and slightly in toward body
    } else {
        handSlightOffset = { x: 0.25, y: -0.17, z: -0.05 }; // slightly wide, slightly lower, and slightly in toward body
    }

    var avatarRelativeHand = handSlightOffset;

    var handOrientation = { x: 0, y: 0, z: 0, w: 1};
    handOrientation = Quat.multiply(handOrientation, Quat.angleAxis(-90, { x: 1, y: 0, z: 0 }));
    if (hand == Controller.Standard.LeftHand) {
        handOrientation = Quat.multiply(handOrientation, Quat.angleAxis(90, { x: 0, y: 1, z: 0 }));
        handOrientation = Quat.multiply(handOrientation, Quat.angleAxis(-90, { x: 0, y: 0, z: 1 }));
    } else {
        handOrientation = Quat.multiply(handOrientation, Quat.angleAxis(-90, { x: 0, y: 1, z: 0 }));
        handOrientation = Quat.multiply(handOrientation, Quat.angleAxis(90, { x: 0, y: 0, z: 1 }));
    }

    return {
            translation: avatarRelativeHand,
            rotation: handOrientation,
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
    };
}

var mapHeadToHand = function(hand) {

    var position = MyAvatar.getHeadPosition();
    var rotation = Quat.multiply(MyAvatar.headOrientation, Quat.angleAxis(-90, { x: 1, y: 0, z: 0 }));

    var inverseAvatarRotation = Quat.inverse(MyAvatar.orientation);
    var worldSpaceLookAtPoint = Vec3.sum(MyAvatar.getHeadPosition(), Vec3.multiply(Quat.getUp(rotation), 0.5));
    var avatarRelativeLookAtPoint = Vec3.subtract(worldSpaceLookAtPoint, MyAvatar.position);
    var avatarSpaceLookAtPoint = Vec3.multiplyQbyV(inverseAvatarRotation, Vec3.subtract(worldSpaceLookAtPoint, MyAvatar.position));

    var slightOffset;
    if (hand == Controller.Standard.LeftHand) {
        slightOffset = { x: -0.15, y: -0.25, z: 0.05 }; // slightly wide, slightly lower, and slightly in toward body
    } else {
        slightOffset = { x: 0.15, y: -0.25, z: 0.05 }; // slightly wide, slightly lower, and slightly in toward body
    }

    var avatarSpaceHandPosition = Vec3.sum(avatarSpaceLookAtPoint, slightOffset);

    var headOrientationInAvatarSpace;
    headOrientationInAvatarSpace = Quat.multiply(inverseAvatarRotation, MyAvatar.headOrientation);
    headOrientationInAvatarSpace = Quat.multiply(headOrientationInAvatarSpace, Quat.angleAxis(-90, { x: 1, y: 0, z: 0 }));
    if (hand == Controller.Standard.LeftHand) {
        headOrientationInAvatarSpace = Quat.multiply(headOrientationInAvatarSpace, Quat.angleAxis(90, { x: 0, y: 1, z: 0 }));
    } else {
        headOrientationInAvatarSpace = Quat.multiply(headOrientationInAvatarSpace, Quat.angleAxis(-90, { x: 0, y: 1, z: 0 }));
    }

    var pose = {
            translation: avatarSpaceHandPosition,
            rotation: headOrientationInAvatarSpace,
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
        };
    return pose;
};


mapping.from(Controller.Standard.X).to(function(value) {
    if (value) {
        LeftHandActive = !LeftHandActive;
    }
});

mapping.from(Controller.Standard.B).to(function(value) {
    if (value) {
        RightHandActive = !RightHandActive;
    }
});


mapping.from(function() {
    if (!LeftHandActive) {
        return getAvatarHandPose(Controller.Standard.LeftHand);
    }
    return mapHeadToHand(Controller.Standard.LeftHand);
}).to(Controller.Standard.LeftHand);

mapping.from(function() {
    if (!RightHandActive) {
        return getAvatarHandPose(Controller.Standard.RightHand);
    }
    return mapHeadToHand(Controller.Standard.RightHand);
}).to(Controller.Standard.RightHand);

Controller.enableMapping(MAPPING_NAME);


Script.scriptEnding.connect(function(){
    mapping.disable();
});
