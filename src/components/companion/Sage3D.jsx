import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { ACESFilmicToneMapping, Box3, PMREMGenerator, Vector3 } from "three";
import sageModel from "../../assets/sage.glb";
import { COMPACT } from "../../utils/breakpoints.js";
import { createSageController } from "../../utils/sageController.js";
import {
  PROP_FRAMING_DROP,
  PROP_FRAMING_EASE_SECONDS,
  PROP_FRAMING_ZOOM,
} from "../../data/sageClips.js";
import SageSteam from "./SageSteam.jsx";
import "./Sage3D.css";

// ─────────────────────────────────────────────────────────────────────────
// Lighting. These three are the whole look — adjust them here.
//
// EXPOSURE      Overall brightness of everything. Turn this down first if
//               she looks washed out or white. Shifts light and shadow
//               together, so it changes brightness without flattening her.
//
// ENV_INTENSITY Soft light arriving from every direction at once. Raising it
//               lifts her shaded side, which reads as softer. Raising it too
//               far removes the shading altogether and she goes flat.
//
// KEY_LIGHT     The single directional lamp, like sun through a window. This
//               is what gives her a bright side and a dark side, and what
//               casts the shadow. High values are what make lighting "harsh".
//
// Rough guide: washed out → lower EXPOSURE. Too contrasty → lower KEY_LIGHT
// and raise ENV_INTENSITY. Too flat → the reverse.
// ─────────────────────────────────────────────────────────────────────────
const EXPOSURE = 0.5;
const ENV_INTENSITY = 1.2;
const KEY_LIGHT = 0.9;

// Where the camera sits normally (see the Canvas below).
const CAMERA_Z = 6.2;

// Headroom. The canvas is taller than her circle by this much and reaches up
// above it, so when she hops (react_great) or lifts her arms her leaves have
// somewhere to go instead of being cut off at the top edge. The camera's view
// is widened by the same amount and raised, so she stays exactly the same
// size and in the same place; there's just empty sky above her. A clip that
// still touches the top needs a larger value.
const HEADROOM = 1.45;
// The lens she was framed with (degrees, top to bottom of her circle), and
// the wider one that covers the circle plus the headroom.
const BASE_FOV = 20;
const HALF_TAN = Math.tan((BASE_FOV / 2) * (Math.PI / 180));
const FOV = 2 * Math.atan(HEADROOM * HALF_TAN) * (180 / Math.PI);
// How far up the camera looks so her circle stays at the bottom of the taller
// view, at a given distance.
const headroomLift = (z) => (HEADROOM - 1) * z * HALF_TAN;
// Clips with a prop in her hands.
const PROP_CLIP = /^sage_(work|write|break)_/;

// Shadow under her feet.
const SHADOW_DARKNESS = 0.2; // 0 is invisible, 1 is solid black
const SHADOW_SOFTNESS = 9; // higher is blurrier

// The model is Draco-compressed, so the loader needs a decoder. These are
// copied into public/draco rather than fetched from a CDN, so the app keeps
// working offline and doesn't depend on a third party staying up.
function withDraco(loader) {
  const draco = new DRACOLoader();
  // BASE_URL keeps this working when the site is served from a subfolder,
  // as it is on GitHub Pages.
  draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
  loader.setDRACOLoader(draco);
}

// Lamps alone make a model look lit rather than rendered: the light only ever
// arrives from the few directions the lamps are placed in. An environment surrounds her,
// so light wraps around her edges and the clay picks up a soft sheen — the
// difference between a game character and a product render.
//
// RoomEnvironment is a small studio box that ships with three, so this costs
// no download and works offline. It is generated once and the scene is asked
// to redraw, since the canvas only renders on demand.
function StudioLight() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = ENV_INTENSITY;
    invalidate();
    return () => {
      scene.environment = null;
      environment.texture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);

  return null;
}

function SageModel({ onGround }) {
  const gltf = useLoader(GLTFLoader, sageModel, withDraco);

  // Blender and glTF disagree about which way is up, and exported models
  // rarely sit neatly at the origin. Rather than hard-coding a scale that
  // would break on re-export, measure the model and fit it to the frame.
  const { scene, controller, mug, eyes, offset, scale, feet } = useMemo(() => {
    // She's rigged, so a plain clone would leave every copy's skin bound to
    // the original's bones. SkeletonUtils rebinds each copy to its own, so
    // two Sages on screen can move independently.
    const scene = cloneSkinned(gltf.scene);

    scene.traverse((node) => {
      if (!node.isMesh) return;
      // Nothing in a glTF casts shadows by default.
      node.castShadow = true;
      // Three culls by the bind pose's bounds; once she moves (arms up,
      // props in hand) that would clip her at the frame edge.
      node.frustumCulled = false;
    });

    // Props hidden and idle applied before anything else, so neither the
    // T-pose nor the floating props are ever drawn.
    const controller = createSageController(scene, gltf.animations);

    // Measured in her idle pose, from her body and eyes only: the T-pose's
    // outstretched arms and the hidden props would make the box far wider
    // than she is, and shrink her in the frame.
    scene.updateMatrixWorld(true);
    const box = new Box3();
    scene.traverse((node) => {
      if (!node.isSkinnedMesh) return;
      node.computeBoundingBox();
      box.union(node.boundingBox.clone().applyMatrix4(node.matrixWorld));
    });
    if (box.isEmpty()) box.setFromObject(scene);

    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const tallest = Math.max(size.x, size.y, size.z) || 1;
    // The camera sees roughly 2.1 units at this distance, so she fills most
    // of the frame and rises clear of the disc behind her.
    const scale = 1.85 / tallest;

    const mug = controller.props.props.Prop_Mug;
    const eyes = ["eye_L", "eye_R"].map((n) => scene.getObjectByName(n)).filter(Boolean);

    // Where her feet end up once she is centred and scaled, so the floor can
    // be put exactly there rather than guessed at.
    return { scene, controller, mug, eyes, offset: centre, scale, feet: -(size.y * scale) / 2 };
  }, [gltf]);

  useEffect(() => {
    onGround(feet);
  }, [feet, onGround]);

  // Listen for useSageAnimation commands while she's on screen.
  useEffect(() => controller.attach(), [controller]);

  // Laptop, notepad and mug reach further out and lower than she does, so
  // while one is in her hands the camera eases back and down a little to
  // keep it inside her circle, then eases home again once it's put away.
  const camera = useThree((s) => s.camera);
  // The camera is raised to make headroom, and must still look straight
  // ahead. React Three Fiber aims a new camera at the scene's centre, which
  // would tilt it down and lift her up out of her circle.
  useLayoutEffect(() => {
    camera.rotation.set(0, 0, 0);
  }, [camera]);
  useFrame((_, delta) => {
    controller.tick(delta);
    const holdingProp = PROP_CLIP.test(controller.clipName() ?? "");
    const z = CAMERA_Z * (holdingProp ? PROP_FRAMING_ZOOM : 1);
    const y = headroomLift(z) - (holdingProp ? PROP_FRAMING_DROP : 0);
    const k = 1 - Math.exp((-delta * 3) / PROP_FRAMING_EASE_SECONDS);
    camera.position.z += (z - camera.position.z) * k;
    camera.position.y += (y - camera.position.y) * k;
  });

  return (
    <group scale={scale}>
      <primitive object={scene} position={[-offset.x, -offset.y, -offset.z]} />
      {mug && <SageSteam mug={mug} eyes={eyes} />}
    </group>
  );
}

export default function Sage3D({ size = 64, float = false }) {
  // Measured from the model once it loads, so the floor sits at her feet
  // whatever she is re-exported at.
  const [ground, setGround] = useState(-0.9);

  return (
    <div
      className={`sage-3d${float ? " sage-float" : ""}`}
      style={{ width: size, height: size }}
    >
      <Canvas
        // She's always moving (even idle breathes and blinks), so the
        // scene is drawn every frame. The browser pauses this in a
        // background tab, and the canvas is small.
        frameloop="always"
        shadows
        // A phone's screen is dense enough at 1.5× and draws far fewer
        // pixels; the canvas is small either way.
        dpr={window.matchMedia(COMPACT).matches ? [1, 1.5] : [1, 2]}
        // A long lens flattens the perspective, so she reads as a rendered
        // figure rather than something photographed up close with a wide
        // angle. Pulling the camera back keeps her the same size in frame.
        camera={{ position: [0, headroomLift(CAMERA_Z), CAMERA_Z], fov: FOV }}
        gl={{
          alpha: true,
          antialias: true,
          // Rolls highlights off softly instead of clipping them to flat
          // white, which is most of what separates a render from a preview.
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: EXPOSURE,
        }}
        // Bottom-aligned with her circle and HEADROOM times as tall, rising
        // above it. Her box (what the page lays out and what is dragged)
        // stays the circle; this only paints over the space above it.
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: `${HEADROOM * 100}%`,
          background: "transparent",
        }}
      >
        <StudioLight />

        {/* The environment does most of the lighting. This one is here for
            direction and, mainly, to cast the shadow. Its shadow camera is
            wrapped tightly around her — a wide frustum spreads the same
            resolution over empty space and the shadow turns blocky. */}
        <directionalLight
          position={[1.6, 4, 2.4]}
          intensity={KEY_LIGHT}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-radius={SHADOW_SOFTNESS}
          shadow-bias={-0.0015}
          shadow-camera-near={0.1}
          shadow-camera-far={12}
          shadow-camera-left={-1.6}
          shadow-camera-right={1.6}
          shadow-camera-top={1.6}
          shadow-camera-bottom={-1.6}
        />

        {/* An invisible floor at her feet. ShadowMaterial draws nothing of
            itself, only what falls on it, so the disc behind shows through
            everywhere she isn't standing. */}
        <mesh
          position={[0, ground, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[8, 8]} />
          <shadowMaterial opacity={SHADOW_DARKNESS} />
        </mesh>

        <SageModel onGround={setGround} />
      </Canvas>
    </div>
  );
}
