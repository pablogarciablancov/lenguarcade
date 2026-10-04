/* Adaptador listo para la rama integration: copiar esta función al script del
   runner y llamar desde buildCentralProgress cuando gameRecord.gameId==='lexoma'.
   No se ejecuta en el juego ni modifica el host desde una rama game/*. */
function buildLexomaCentralProgress(result, gameRecord) {
  const old=gameRecord?.progress||{};
  const c=result.save?.career||{};
  // Valor educativo acumulado, independiente del score multiplicado de combate.
  const earned=Math.max(0,Number(c.phrases||0)*8+Number(c.concordances||0)*3+Number(c.wins||0)*80);
  const errors=Math.max(Number(old.errors||0),Number(c.errors||0));
  const successes=Math.max(Number(old.successes||0),Number(c.words||0)+Number(c.phrases||0));
  const attempts=successes+errors;
  return {
    xpDelta:Math.max(0,earned-Number(old.xp||0)),
    plumasDelta:0,
    percentage:Math.max(Number(old.percentage||0),Number(result.percentage||0)),
    accuracy:attempts?Math.round(successes/attempts*100):0,
    attempts,successes,errors,
    streak:Math.max(Number(old.streak||0),Number(c.bestCombo||1))
  };
}
if(typeof module!=='undefined')module.exports=buildLexomaCentralProgress;
