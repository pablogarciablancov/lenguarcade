function doGet() {
  return HtmlService.createHtmlOutputFromFile('Alumno')
    .setTitle('Scrabble · LenguArcade')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
