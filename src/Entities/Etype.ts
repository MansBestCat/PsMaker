export enum Etype {
    NONE,           //  0   for threejs, no layer
    RESERVED,       //  1   for threejs
    DEV,            //  2   client-side dev stuff
    CAMERA,         //  3
    DRONE,          //  4   a key camera position, used for cinematography

    DESPAWNED,      //  5   entity is dead but not removed from scene yet

    ITEM,           //  6
    CHEST,          //  7
    MONSTER,        //  8   monsters and forges
    DROPZONE,       //  9
    GROUND,         //  10
    DOOR_SPACE,     //  11  An open entryway with no door, used for reserving the space so it will not be overwritten by the wall generation algo
    DOOR,           //  12
    ENVIRONMENT,    //  13  Setpieces
    PLAYER,         //  14
    TRANSIENT,      //  15  attacks, explosions, building blocks
    WALL_BLOCK,     //  16  individual blocks,
    BARRIER_BLOCK,  //  17  individual blocks, half height
    WALL,           //  19  an entire wall or rock pile, prevents raycast from needing to be recursive
    TRANSPORTER,    //  20  move between levels
    UNDERLAYMENT,   //  21  a layer under all

    OUTLINE         //  27  reserved for postprocessing OutlineEffect.selection.layer.  DO NOT ASSIGN TO ENTITIES.
}