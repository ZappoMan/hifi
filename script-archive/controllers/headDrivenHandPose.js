//
//  proceduralHandPoseExample.js
//  examples/controllers
//
//  Created by Brad Hefta-Gaub on 2015/12/15
//  Copyright 2015 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var MAPPING_NAME = "com.highfidelity.examples.lookAtHandPose";
var mapping = Controller.newMapping(MAPPING_NAME);

mapping.from(function() {
    if (!Controller.getValue(Controller.Standard.X)) {
        print("not X");
        var pose = {
            valid: false
        };
        return pose;
    }

    var position = MyAvatar.getHeadPosition();
    var rotation = Quat.multiply(MyAvatar.headOrientation, Quat.angleAxis(-90, { x: 1, y: 0, z: 0 }));

    var inverseAvatarRotation = Quat.inverse(MyAvatar.orientation);
    var worldSpaceLookAtPoint = Vec3.sum(MyAvatar.getHeadPosition(), Vec3.multiply(Quat.getUp(rotation), 0.5));
    var avatarRelativeLookAtPoint = Vec3.subtract(worldSpaceLookAtPoint,MyAvatar.position);
    var avatarSpaceLookAtPoint = Vec3.multiplyQbyV(inverseAvatarRotation,Vec3.subtract(worldSpaceLookAtPoint,MyAvatar.position));

    var slightOffset = { x: -0.15, y: -0.25, z: 0.05 }; // slightly wide, slightly lower, and slightly in toward body
    var avatarSpaceHandPosition = Vec3.sum(avatarSpaceLookAtPoint, slightOffset);

    var headOrientationInAvatarSpace = Quat.multiply(inverseAvatarRotation, MyAvatar.headOrientation);
    var headOrientationInAvatarSpace = Quat.multiply(headOrientationInAvatarSpace, Quat.angleAxis(-90, { x: 1, y: 0, z: 0 }));
    var headOrientationInAvatarSpace = Quat.multiply(headOrientationInAvatarSpace, Quat.angleAxis(90, { x: 0, y: 1, z: 0 }));

    var pose = {
            translation: avatarSpaceHandPosition,
            rotation: headOrientationInAvatarSpace,
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 }
        };
    return pose;
}).to(Controller.Standard.LeftHand);

Controller.enableMapping(MAPPING_NAME);


Script.scriptEnding.connect(function(){
    mapping.disable();
});
