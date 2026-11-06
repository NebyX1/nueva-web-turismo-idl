import { Color, Group, MathUtils, MeshBasicMaterial, MeshStandardMaterial, PointLight } from 'three';

// Six seconds per colour, with zero velocity at the palette stops and the wrap.
const PALETTE = [new Color('#9654ff'), new Color('#ff5ca8'), new Color('#68ceff')];
const PERIOD = 18;

/** Coloured water/LED emission and three local lights, owned by the plaza model. */
export function createPlazaFountainLights(
  parent: Group,
  jets: MeshStandardMaterial,
  leds: MeshStandardMaterial,
  ripples: MeshBasicMaterial,
) {
  const group = new Group(); group.name = 'plaza-fountain-colour-lights'; group.visible = false;
  parent.add(group);
  const lights = [-29, -10, 8].map(z => {
    const light = new PointLight(PALETTE[0], 18, 18, 2);
    light.position.set(0, .75, z); light.name = 'plaza-fountain-colour-light';
    light.castShadow = false; light.visible = false; group.add(light);
    return light;
  });
  const day = {
    jet: jets.color.clone(), emission: jets.emissive.clone(), intensity: jets.emissiveIntensity, opacity: jets.opacity,
    led: leds.color.clone(), ledEmission: leds.emissive.clone(), ledIntensity: leds.emissiveIntensity,
    ripple: ripples.color.clone(), rippleOpacity: ripples.opacity,
  };
  const colour = new Color();
  let night = false, time = 0;
  function apply() {
    if (!night) {
      jets.color.copy(day.jet); jets.emissive.copy(day.emission); jets.emissiveIntensity = day.intensity; jets.opacity = day.opacity;
      leds.color.copy(day.led); leds.emissive.copy(day.ledEmission); leds.emissiveIntensity = day.ledIntensity;
      ripples.color.copy(day.ripple); ripples.opacity = day.rippleOpacity;
      return;
    }
    const phase = ((time % PERIOD + PERIOD) % PERIOD) / PERIOD * PALETTE.length;
    const index = Math.floor(phase), mix = MathUtils.smootherstep(phase - index, 0, 1);
    colour.copy(PALETTE[index]).lerp(PALETTE[(index + 1) % PALETTE.length], mix);
    jets.color.copy(colour); jets.emissive.copy(colour); jets.emissiveIntensity = 1.4; jets.opacity = .94;
    leds.color.copy(colour); leds.emissive.copy(colour); leds.emissiveIntensity = 2.2;
    ripples.color.copy(day.ripple).lerp(colour, .65); ripples.opacity = .34;
    for (const light of lights) light.color.copy(colour);
  }
  return {
    update(value: number) { time = Number.isFinite(value) ? value : 0; if (night) apply(); },
    setNight(value: boolean, active: boolean) {
      night = value; group.visible = value && active;
      for (const light of lights) light.visible = value && active;
      apply();
    },
  };
}
