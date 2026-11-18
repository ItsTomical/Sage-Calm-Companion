// Sage prop show/hide for Three.js.
// In the .glb, every prop is a child of Sage's bones, so it already follows her hands.
// The animations say WHEN a prop is visible through a tiny (0.1 mm) offset on the "root" bone:
// offset length x 10000 = how visible (0 = hidden, 1 = fully shown).
// Which prop that offset belongs to depends on the clip's name.

const PROPS_FOR_CLIP = [
  { prefix: "sage_work_", props: ["Prop_Laptop"] },
  { prefix: "sage_write_", props: ["Prop_Notepad", "Prop_Pencil"] },
  { prefix: "sage_break_", props: ["Prop_Mug"] },
];
const ALL_PROPS = ["Prop_Laptop", "Prop_Notepad", "Prop_Pencil", "Prop_Mug"];

export function setupSageProps(sageScene) {
  const root = sageScene.getObjectByName("root"); // the root bone
  const restPos = root.position.clone(); // capture BEFORE any clip plays
  const props = {};
  for (const name of ALL_PROPS) {
    props[name] = sageScene.getObjectByName(name);
    props[name].userData.fullScale = props[name].scale.clone();
    props[name].visible = false;
  }
  return { root, restPos, props, current: [] };
}

// Call when a clip starts (e.g. right after action.play() / crossFadeTo).
export function setPropClip(state, clipName) {
  const entry = PROPS_FOR_CLIP.find((e) => clipName.startsWith(e.prefix));
  state.current = entry ? entry.props : [];
  for (const name of ALL_PROPS) {
    if (!state.current.includes(name)) state.props[name].visible = false;
  }
}

// Call every frame, after mixer.update(delta).
export function updateSageProps(state) {
  const amount = Math.min(
    Math.max(state.root.position.distanceTo(state.restPos) * 10000, 0),
    1,
  );
  for (const name of state.current) {
    const p = state.props[name];
    p.visible = amount > 0.001;
    p.scale.copy(p.userData.fullScale).multiplyScalar(amount);
  }
}

// Usage:
//   const props = setupSageProps(gltf.scene);
//   ...
//   const action = mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, 'sage_work_in'));
//   action.reset().play();
//   setPropClip(props, 'sage_work_in');
//   ...
//   function tick(dt) { mixer.update(dt); updateSageProps(props); renderer.render(scene, camera); }
