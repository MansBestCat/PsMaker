import { Data } from './Data';
import { CameraManMain } from './Camera/CameraManMain';
import { GameEngine } from './GameEngine';
import { CircleCorona } from './Scenes/CircleCorona';

// MAIN 
console.clear();

window.addEventListener('DOMContentLoaded', () => {

  const canvas = document.getElementById("elementDungeon") as HTMLCanvasElement;
  const data = new Data(canvas);
  const cameraManMain = new CameraManMain(data);

  const gameEngine = new GameEngine(data, canvas, cameraManMain);
  gameEngine.init();

  switch (window.location.hash.substring(1)) {
    case "CircleCorona":
      new CircleCorona(data).go(data, cameraManMain);
      break;
  }
});


