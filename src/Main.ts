import { CameraManMain } from './Camera/CameraManMain';
import { Data } from './Data';
import { GameEngine } from './GameEngine';
import { CoronaScene } from './Scenes/CoronaScene';
import { SmokePuffScene } from './Scenes/SmokePuffScene';
import { SparksScene } from './Scenes/SparksScene';
import { SplineFollowerScene } from './Scenes/SplineFollowerScene';
import { TwinkleStarsScene } from './Scenes/TwinkleStarsScene';

// MAIN 
console.clear();

window.addEventListener('DOMContentLoaded', () => {

  const canvas = document.getElementById("elementDungeon") as HTMLCanvasElement;
  const data = new Data(canvas);
  const cameraManMain = new CameraManMain(data);

  const gameEngine = new GameEngine(data, canvas, cameraManMain);
  gameEngine.init();

  switch (window.location.hash.substring(1)) {
    case "SmokePuff":
      new SmokePuffScene().go(data, cameraManMain);
      break;
    case "Sparks":
      new SparksScene().go(data, cameraManMain);
      break;
    case "Corona":
      new CoronaScene().go(data, cameraManMain);
      break;
    case "TwinkleStars":
      new TwinkleStarsScene().go(data, cameraManMain);
      break;
    case "SplineFollower":
      new SplineFollowerScene().go(data, cameraManMain);
      break;
  }
});


