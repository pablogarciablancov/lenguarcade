/* Adaptador acumulativo de FORJA / gameId lexoma.
   Nunca vuelve a premiar un checkpoint ya contabilizado. */
function buildLexomaCentralProgress(result, gameRecord) {
  const old=gameRecord?.progress||{};
  const c=result.save?.career||{};
  const words=Math.max(0,Number(c.words||0));
  const wins=Math.max(0,Number(c.wins||0));
  const discovered=Array.isArray(c.bonusesSeen)?c.bonusesSeen.length:0;
  const earned=words*5+wins*90+discovered*2;
  const errors=Math.max(Number(old.errors||0),Number(c.errors||0));
  const successes=Math.max(Number(old.successes||0),words);
  const attempts=successes+errors;
  return {
    xpDelta:Math.max(0,earned-Number(old.xp||0)),
    plumasDelta:0,
    percentage:Math.max(Number(old.percentage||0),Number(result.percentage||0)),
    accuracy:attempts?Math.round(successes/attempts*100):0,
    attempts,successes,errors,
    streak:Math.max(Number(old.streak||0),Math.round(Number(c.bestMulti||1)))
  };
}
if(typeof module!=='undefined')module.exports=buildLexomaCentralProgress;