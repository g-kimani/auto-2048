// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  const game = new GameManager(
    4,
    KeyboardInputManager,
    HTMLActuator,
    LocalStorageManager
  );
  const ai = new AutoAI(game);
});
